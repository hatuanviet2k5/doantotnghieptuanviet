const pool = require('../config/database');
const LockService = require('../services/lockService');
const QrService = require('../services/qrService');
const AuditService = require('../services/auditService');

/**
 * Helper to automatically expire pending tickets whose hold time has passed
 */
const cleanupExpiredHolds = async (connection) => {
  const db = connection || pool;
  try {
    // 1. Revert copies back to AVAILABLE
    await db.query(`
      UPDATE book_copies bc
      JOIN ticket_details td ON bc.id = td.copy_id
      JOIN borrow_tickets bt ON td.ticket_id = bt.id
      SET bc.status = 'AVAILABLE'
      WHERE bt.status = 'PENDING' AND bt.hold_expires_at < NOW()
    `);

    // 2. Mark tickets as CANCELLED
    await db.query(`
      UPDATE borrow_tickets
      SET status = 'CANCELLED'
      WHERE status = 'PENDING' AND hold_expires_at < NOW()
    `);

    // 3. Update book available_copies
    await db.query(`
      UPDATE books b
      SET available_copies = (
        SELECT COUNT(id) FROM book_copies WHERE book_id = b.id AND status = 'AVAILABLE'
      )
    `);
  } catch (err) {
    console.error('Error during cleanupExpiredHolds:', err.message);
  }
};

const ticketController = {
  /**
   * Đăng ký giữ sách (Hold 5 phút, transaction-based)
   * POST /api/v1/tickets/hold
   */
  async holdBook(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Clean up previous expired holds
      await cleanupExpiredHolds(connection);

      const { copy_id, copy_ids, reader_card_id } = req.body;
      const targetCopyIds = copy_ids || (copy_id ? [copy_id] : []);

      if (targetCopyIds.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn ít nhất một cuốn sách/bản sao để giữ chỗ'
        });
      }

      // Determine reader card ID
      let finalReaderCardId = reader_card_id;
      if (req.user.role === 'BORROWER') {
        if (!req.user.reader_card_id) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Tài khoản độc giả chưa được cấp thẻ thư viện'
          });
        }
        finalReaderCardId = req.user.reader_card_id;
      } else if (!finalReaderCardId) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp mã thẻ độc giả (reader_card_id)'
        });
      }

      // 1. Lock and verify reader card
      const [cardRows] = await connection.query(
        'SELECT * FROM reader_cards WHERE id = ? FOR UPDATE',
        [finalReaderCardId]
      );
      if (cardRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin thẻ thư viện'
        });
      }

      const readerCard = cardRows[0];
      if (readerCard.status !== 'ACTIVE') {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'Thẻ độc giả đã bị tạm khóa hoặc không còn hoạt động'
        });
      }

      const today = new Date().toISOString().split('T')[0];
      if (readerCard.expire_date < today) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'Thẻ độc giả đã hết hạn sử dụng'
        });
      }

      // 2. Check unpaid fines > 50,000 VND
      const [fineRows] = await connection.query(
        `SELECT COALESCE(SUM(f.fine_amount), 0) AS total_unpaid
         FROM fines f
         JOIN borrow_tickets bt ON f.ticket_id = bt.id
         WHERE bt.reader_card_id = ? AND f.status = 'UNPAID'`,
        [finalReaderCardId]
      );
      const totalUnpaidFine = parseFloat(fineRows[0].total_unpaid || 0);
      if (totalUnpaidFine > 50000) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: `Độc giả có khoản phạt chưa thanh toán (${totalUnpaidFine.toLocaleString('vi-VN')} VNĐ) vượt quá 50.000 VNĐ. Vui lòng thanh toán tiền phạt trước.`
        });
      }

      // 3. Check current borrow & hold count
      const [borrowCountRows] = await connection.query(
        `SELECT COUNT(td.id) AS current_count
         FROM borrow_tickets bt
         JOIN ticket_details td ON bt.id = td.ticket_id
         WHERE bt.reader_card_id = ? AND bt.status IN ('PENDING', 'BORROWED')`,
        [finalReaderCardId]
      );
      const currentActiveCount = parseInt(borrowCountRows[0].current_count || 0, 10);
      const maxAllowed = readerCard.max_borrow || 5;

      if (currentActiveCount + targetCopyIds.length > maxAllowed) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Số lượng sách mượn/giữ vượt quá giới hạn cho phép (Hiện tại: ${currentActiveCount}, Tối đa: ${maxAllowed})`
        });
      }

      // 4. Lock book copies using SELECT ... FOR UPDATE
      const lockedCopies = await LockService.lockBookCopies(connection, targetCopyIds);
      if (lockedCopies.length !== targetCopyIds.length) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Một số cuốn sách đã chọn không tồn tại'
        });
      }

      // Check all copies are AVAILABLE
      for (const copy of lockedCopies) {
        if (copy.status !== 'AVAILABLE') {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `Cuốn sách "${copy.book_title}" (Mã: ${copy.copy_code}) hiện không khả dụng (Trạng thái: ${copy.status})`
          });
        }
      }

      // 5. Update copies status to HOLDING
      const placeholders = targetCopyIds.map(() => '?').join(',');
      await connection.query(
        `UPDATE book_copies SET status = 'HOLDING' WHERE id IN (${placeholders})`,
        targetCopyIds
      );

      // 6. Calculate default due_date (min max_borrow_days or 14 days)
      const minBorrowDays = Math.min(...lockedCopies.map(c => c.max_borrow_days || 14));
      const now = new Date();
      const holdExpiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes hold
      const dueDate = new Date(now.getTime() + minBorrowDays * 24 * 60 * 60 * 1000);

      // Generate ticket code
      const ticketCode = `TK${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`;

      // 7. Generate QR code
      const { qrPayload, qrDataUrl } = await QrService.generateTicketQr(ticketCode, {
        readerCardId: finalReaderCardId,
        copyCount: targetCopyIds.length
      });

      // 8. Insert borrow ticket
      const [ticketResult] = await connection.query(
        `INSERT INTO borrow_tickets (ticket_code, reader_card_id, due_date, hold_expires_at, status, qr_data)
         VALUES (?, ?, ?, ?, 'PENDING', ?)`,
        [ticketCode, finalReaderCardId, dueDate, holdExpiresAt, qrDataUrl]
      );
      const ticketId = ticketResult.insertId;

      // 9. Insert ticket details
      for (const copyId of targetCopyIds) {
        await connection.query(
          'INSERT INTO ticket_details (ticket_id, copy_id) VALUES (?, ?)',
          [ticketId, copyId]
        );
      }

      // 10. Update book available_copies
      const bookIds = [...new Set(lockedCopies.map(c => c.book_id))];
      for (const bookId of bookIds) {
        await connection.query(
          `UPDATE books b SET
             available_copies = (SELECT COUNT(id) FROM book_copies WHERE book_id = b.id AND status = 'AVAILABLE')
           WHERE b.id = ?`,
          [bookId]
        );
      }

      await AuditService.log({
        actorId: req.user.id,
        action: 'HOLD_BOOK_TICKET',
        entityType: 'borrow_tickets',
        entityId: ticketId,
        details: { ticketCode, targetCopyIds, holdExpiresAt }
      }, connection);

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: 'Đăng ký giữ sách thành công! Vui lòng đến quầy xuất trình mã QR trong vòng 5 phút.',
        data: {
          ticket_id: ticketId,
          ticket_code: ticketCode,
          status: 'PENDING',
          hold_expires_at: holdExpiresAt,
          due_date: dueDate,
          qr_code: qrDataUrl,
          copies: lockedCopies.map(c => ({
            id: c.id,
            copy_code: c.copy_code,
            book_title: c.book_title
          }))
        }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Hold book error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi giữ chỗ sách',
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  /**
   * Thủ thư quét mã QR để xác nhận cho mượn sách
   * POST /api/v1/tickets/verify-qr
   */
  async verifyQr(req, res) {
    const connection = await pool.getConnection();
    try {
      const { ticket_code } = req.body;

      if (!ticket_code) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp mã phiếu mượn (ticket_code)'
        });
      }

      await connection.beginTransaction();

      // Clean up expired tickets
      await cleanupExpiredHolds(connection);

      // Lock ticket
      const ticket = await LockService.lockTicketByCode(connection, ticket_code.trim());
      if (!ticket) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phiếu mượn'
        });
      }

      if (ticket.status === 'BORROWED') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Phiếu mượn này đã được xác nhận mượn trước đó'
        });
      }

      if (ticket.status !== 'PENDING') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Phiếu mượn không hợp lệ (Trạng thái hiện tại: ${ticket.status})`
        });
      }

      // Check if hold expired
      const now = new Date();
      if (new Date(ticket.hold_expires_at) < now) {
        // Cancel ticket & release holds
        await connection.query(
          "UPDATE borrow_tickets SET status = 'CANCELLED' WHERE id = ?",
          [ticket.id]
        );
        await connection.query(`
          UPDATE book_copies bc
          JOIN ticket_details td ON bc.id = td.copy_id
          SET bc.status = 'AVAILABLE'
          WHERE td.ticket_id = ?
        `, [ticket.id]);

        await connection.commit();
        return res.status(400).json({
          success: false,
          message: 'Thời gian giữ sách 5 phút đã hết hạn. Phiếu mượn đã bị hủy.'
        });
      }

      // Get ticket details and copies
      const [details] = await connection.query(
        `SELECT td.copy_id, bc.book_id, b.max_borrow_days, b.title
         FROM ticket_details td
         JOIN book_copies bc ON td.copy_id = bc.id
         JOIN books b ON bc.book_id = b.id
         WHERE td.ticket_id = ?`,
        [ticket.id]
      );

      const copyIds = details.map(d => d.copy_id);
      const minBorrowDays = Math.min(...details.map(d => d.max_borrow_days || 14));
      const dueDate = new Date(now.getTime() + minBorrowDays * 24 * 60 * 60 * 1000);

      // Update ticket status to BORROWED
      await connection.query(
        "UPDATE borrow_tickets SET status = 'BORROWED', due_date = ?, hold_expires_at = NULL WHERE id = ?",
        [dueDate, ticket.id]
      );

      // Update copies to BORROWED
      const placeholders = copyIds.map(() => '?').join(',');
      await connection.query(
        `UPDATE book_copies SET status = 'BORROWED' WHERE id IN (${placeholders})`,
        copyIds
      );

      // Record borrow history
      for (const d of details) {
        await connection.query(
          `INSERT INTO borrow_history (ticket_id, copy_id, borrow_date, status)
           VALUES (?, ?, NOW(), 'BORROWING')`,
          [ticket.id, d.copy_id]
        );
      }

      await AuditService.log({
        actorId: req.user.id,
        action: 'VERIFY_QR_BORROW',
        entityType: 'borrow_tickets',
        entityId: ticket.id,
        details: { ticketCode: ticket.ticket_code, copyIds, dueDate }
      }, connection);

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: 'Xác nhận mượn sách thành công!',
        data: {
          ticket_id: ticket.id,
          ticket_code: ticket.ticket_code,
          status: 'BORROWED',
          due_date: dueDate,
          books: details.map(d => ({ title: d.title, copy_id: d.copy_id }))
        }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Verify QR error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xác nhận mượn sách qua QR',
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  /**
   * Xử lý trả sách và tính phí phạt trễ hạn nếu có (5000 VND / ngày / cuốn)
   * POST /api/v1/tickets/return
   */
  async returnBook(req, res) {
    const connection = await pool.getConnection();
    try {
      const { ticket_id, ticket_code } = req.body;

      if (!ticket_id && !ticket_code) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp ticket_id hoặc ticket_code'
        });
      }

      await connection.beginTransaction();

      let ticket;
      if (ticket_id) {
        ticket = await LockService.lockTicket(connection, ticket_id);
      } else {
        ticket = await LockService.lockTicketByCode(connection, ticket_code.trim());
      }

      if (!ticket) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phiếu mượn'
        });
      }

      if (ticket.status !== 'BORROWED' && ticket.status !== 'OVERDUE') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Phiếu mượn không thể trả sách (Trạng thái hiện tại: ${ticket.status})`
        });
      }

      // Get copies
      const [details] = await connection.query(
        `SELECT td.copy_id, bc.book_id
         FROM ticket_details td
         JOIN book_copies bc ON td.copy_id = bc.id
         WHERE td.ticket_id = ?`,
        [ticket.id]
      );
      const copyIds = details.map(d => d.copy_id);
      const bookIds = [...new Set(details.map(d => d.book_id))];

      // Calculate overdue days
      const now = new Date();
      const dueDate = new Date(ticket.due_date);
      const diffTime = now.getTime() - dueDate.getTime();
      let overdueDays = 0;
      let fineAmount = 0;
      let fineRecord = null;

      if (diffTime > 0) {
        overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        fineAmount = overdueDays * copyIds.length * 5000; // 5000 VND/copy/day
      }

      // If overdue, create fine
      if (overdueDays > 0 && fineAmount > 0) {
        const [fineResult] = await connection.query(
          `INSERT INTO fines (ticket_id, reason, overdue_days, fine_amount, status)
           VALUES (?, 'OVERDUE', ?, ?, 'UNPAID')`,
          [ticket.id, overdueDays, fineAmount]
        );
        fineRecord = {
          id: fineResult.insertId,
          overdue_days: overdueDays,
          fine_amount: fineAmount,
          status: 'UNPAID'
        };
      }

      // Update ticket status
      await connection.query(
        "UPDATE borrow_tickets SET status = 'RETURNED', return_date = NOW() WHERE id = ?",
        [ticket.id]
      );

      // Release copies to AVAILABLE
      if (copyIds.length > 0) {
        const placeholders = copyIds.map(() => '?').join(',');
        await connection.query(
          `UPDATE book_copies SET status = 'AVAILABLE' WHERE id IN (${placeholders})`,
          copyIds
        );
      }

      // Recalculate available_copies on books
      for (const bookId of bookIds) {
        await connection.query(
          `UPDATE books b SET
             available_copies = (SELECT COUNT(id) FROM book_copies WHERE book_id = b.id AND status = 'AVAILABLE')
           WHERE b.id = ?`,
          [bookId]
        );
      }

      // Update borrow_history
      const historyStatus = overdueDays > 0 ? 'OVERDUE_RETURNED' : 'COMPLETED';
      await connection.query(
        `UPDATE borrow_history
         SET return_date = NOW(), status = ?
         WHERE ticket_id = ?`,
        [historyStatus, ticket.id]
      );

      await AuditService.log({
        actorId: req.user.id,
        action: 'RETURN_BOOK_TICKET',
        entityType: 'borrow_tickets',
        entityId: ticket.id,
        details: { ticketCode: ticket.ticket_code, overdueDays, fineAmount }
      }, connection);

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: overdueDays > 0
          ? `Trả sách thành công. Quá hạn ${overdueDays} ngày, phát sinh tiền phạt: ${fineAmount.toLocaleString('vi-VN')} VNĐ.`
          : 'Trả sách thành công đúng hạn!',
        data: {
          ticket_id: ticket.id,
          ticket_code: ticket.ticket_code,
          status: 'RETURNED',
          return_date: now,
          overdue_days: overdueDays,
          fine: fineRecord
        }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Return book error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý trả sách',
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  /**
   * Gia hạn mượn sách (thêm 7 ngày, tối đa 1 lần)
   * POST /api/v1/tickets/renew/:id
   */
  async renewTicket(req, res) {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;

      await connection.beginTransaction();

      const ticket = await LockService.lockTicket(connection, id);
      if (!ticket) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phiếu mượn'
        });
      }

      // Security check for borrower
      if (req.user.role === 'BORROWER' && ticket.reader_card_id !== req.user.reader_card_id) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ có thể gia hạn phiếu mượn của chính mình'
        });
      }

      if (ticket.status !== 'BORROWED') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Chỉ có thể gia hạn phiếu mượn đang trong trạng thái BORROWED'
        });
      }

      if (ticket.renewed >= 1) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Phiếu mượn này đã được gia hạn tối đa 1 lần'
        });
      }

      const now = new Date();
      const currentDueDate = new Date(ticket.due_date);
      if (currentDueDate < now) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Phiếu mượn đã quá hạn, không thể gia hạn. Vui lòng đến thư viện trả sách.'
        });
      }

      // Add 7 days
      const newDueDate = new Date(currentDueDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      await connection.query(
        'UPDATE borrow_tickets SET due_date = ?, renewed = 1 WHERE id = ?',
        [newDueDate, id]
      );

      await AuditService.log({
        actorId: req.user.id,
        action: 'RENEW_TICKET',
        entityType: 'borrow_tickets',
        entityId: id,
        details: { oldDueDate: ticket.due_date, newDueDate }
      }, connection);

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: 'Gia hạn phiếu mượn thành công thêm 7 ngày',
        data: {
          ticket_id: Number(id),
          new_due_date: newDueDate,
          renewed: 1
        }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Renew ticket error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi gia hạn phiếu mượn',
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  /**
   * Hủy phiếu mượn đang PENDING và giải phóng sách giữ chỗ
   * POST /api/v1/tickets/cancel/:id
   */
  async cancelTicket(req, res) {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;

      await connection.beginTransaction();

      const ticket = await LockService.lockTicket(connection, id);
      if (!ticket) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phiếu mượn'
        });
      }

      if (req.user.role === 'BORROWER' && ticket.reader_card_id !== req.user.reader_card_id) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền hủy phiếu mượn này'
        });
      }

      if (ticket.status !== 'PENDING') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Không thể hủy phiếu mượn ở trạng thái ${ticket.status}`
        });
      }

      // Mark ticket as CANCELLED
      await connection.query(
        "UPDATE borrow_tickets SET status = 'CANCELLED' WHERE id = ?",
        [id]
      );

      // Release copies to AVAILABLE
      const [details] = await connection.query(
        'SELECT copy_id FROM ticket_details WHERE ticket_id = ?',
        [id]
      );
      const copyIds = details.map(d => d.copy_id);

      if (copyIds.length > 0) {
        const placeholders = copyIds.map(() => '?').join(',');
        await connection.query(
          `UPDATE book_copies SET status = 'AVAILABLE' WHERE id IN (${placeholders})`,
          copyIds
        );
      }

      // Recalculate available_copies
      await connection.query(`
        UPDATE books b
        SET available_copies = (SELECT COUNT(id) FROM book_copies WHERE book_id = b.id AND status = 'AVAILABLE')
      `);

      await AuditService.log({
        actorId: req.user.id,
        action: 'CANCEL_TICKET',
        entityType: 'borrow_tickets',
        entityId: id,
        details: { ticketCode: ticket.ticket_code }
      }, connection);

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: 'Hủy phiếu giữ sách thành công'
      });
    } catch (error) {
      await connection.rollback();
      console.error('Cancel ticket error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi hủy phiếu mượn',
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  /**
   * Danh sách phiếu mượn (Librarian/Admin xem tất cả, Borrower xem của mình)
   * GET /api/v1/tickets
   */
  async getAll(req, res) {
    try {
      await cleanupExpiredHolds();

      const { status, reader_card_id, search, page = 1, limit = 20 } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const offset = (pageNum - 1) * limitNum;

      let whereConditions = [];
      let queryParams = [];

      // Role check
      if (req.user.role === 'BORROWER') {
        whereConditions.push('bt.reader_card_id = ?');
        queryParams.push(req.user.reader_card_id || 0);
      } else if (reader_card_id) {
        whereConditions.push('bt.reader_card_id = ?');
        queryParams.push(reader_card_id);
      }

      if (status) {
        whereConditions.push('bt.status = ?');
        queryParams.push(status);
      }

      if (search) {
        const term = `%${search.trim()}%`;
        whereConditions.push('(bt.ticket_code LIKE ? OR u.full_name LIKE ? OR rc.card_number LIKE ?)');
        queryParams.push(term, term, term);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const countSql = `
        SELECT COUNT(bt.id) AS total
        FROM borrow_tickets bt
        JOIN reader_cards rc ON bt.reader_card_id = rc.id
        JOIN users u ON rc.user_id = u.id
        ${whereClause}
      `;
      const [countResult] = await pool.query(countSql, queryParams);
      const totalItems = countResult[0].total;

      const selectSql = `
        SELECT
          bt.id, bt.ticket_code, bt.created_at, bt.due_date, bt.return_date,
          bt.hold_expires_at, bt.status, bt.renewed, bt.qr_data,
          rc.id AS reader_card_id, rc.card_number,
          u.id AS user_id, u.full_name AS borrower_name, u.email AS borrower_email, u.phone AS borrower_phone,
          COUNT(td.id) AS book_count,
          f.fine_amount, f.status AS fine_status
        FROM borrow_tickets bt
        JOIN reader_cards rc ON bt.reader_card_id = rc.id
        JOIN users u ON rc.user_id = u.id
        LEFT JOIN ticket_details td ON bt.id = td.ticket_id
        LEFT JOIN fines f ON f.ticket_id = bt.id
        ${whereClause}
        GROUP BY bt.id
        ORDER BY bt.id DESC
        LIMIT ? OFFSET ?
      `;
      const [tickets] = await pool.query(selectSql, [...queryParams, limitNum, offset]);

      return res.status(200).json({
        success: true,
        data: {
          items: tickets,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalItems / limitNum) || 1,
            totalItems,
            limit: limitNum
          }
        }
      });
    } catch (error) {
      console.error('Get tickets error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách phiếu mượn',
        error: error.message
      });
    }
  },

  /**
   * Chi tiết phiếu mượn
   * GET /api/v1/tickets/:id
   */
  async getById(req, res) {
    try {
      await cleanupExpiredHolds();
      const { id } = req.params;

      const [ticketRows] = await pool.query(
        `SELECT
           bt.*,
           rc.card_number, rc.expire_date AS card_expire_date,
           u.id AS user_id, u.full_name AS borrower_name, u.email AS borrower_email, u.phone AS borrower_phone
         FROM borrow_tickets bt
         JOIN reader_cards rc ON bt.reader_card_id = rc.id
         JOIN users u ON rc.user_id = u.id
         WHERE bt.id = ?`,
        [id]
      );

      if (ticketRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phiếu mượn'
        });
      }

      const ticket = ticketRows[0];

      if (req.user.role === 'BORROWER' && ticket.reader_card_id !== req.user.reader_card_id) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem phiếu mượn này'
        });
      }

      // Get books/copies in ticket
      const [copies] = await pool.query(
        `SELECT
           bc.id AS copy_id, bc.copy_code, bc.status AS copy_status, bc.condition_note,
           b.id AS book_id, b.title, b.isbn, b.code AS book_code, b.cover_image,
           s.shelf_code, s.location AS shelf_location
         FROM ticket_details td
         JOIN book_copies bc ON td.copy_id = bc.id
         JOIN books b ON bc.book_id = b.id
         LEFT JOIN shelves s ON bc.shelf_id = s.id
         WHERE td.ticket_id = ?`,
        [id]
      );

      // Get fine if any
      const [fines] = await pool.query(
        'SELECT * FROM fines WHERE ticket_id = ?',
        [id]
      );

      return res.status(200).json({
        success: true,
        data: {
          ...ticket,
          copies,
          fine: fines.length > 0 ? fines[0] : null
        }
      });
    } catch (error) {
      console.error('Get ticket detail error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin phiếu mượn',
        error: error.message
      });
    }
  }
};

module.exports = ticketController;

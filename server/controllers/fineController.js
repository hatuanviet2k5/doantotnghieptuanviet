const pool = require('../config/database');
const AuditService = require('../services/auditService');

const fineController = {
  /**
   * Danh sách phiếu phạt (hỗ trợ lọc theo trạng thái, thẻ độc giả)
   * GET /api/v1/fines
   */
  async getAll(req, res) {
    try {
      const { status, reader_card_id, search, page = 1, limit = 20 } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const offset = (pageNum - 1) * limitNum;

      let whereConditions = [];
      let queryParams = [];

      // If user is borrower, restrict to own fines
      if (req.user.role === 'BORROWER') {
        whereConditions.push('bt.reader_card_id = ?');
        queryParams.push(req.user.reader_card_id || 0);
      } else if (reader_card_id) {
        whereConditions.push('bt.reader_card_id = ?');
        queryParams.push(reader_card_id);
      }

      if (status) {
        whereConditions.push('f.status = ?');
        queryParams.push(status);
      }

      if (search) {
        const term = `%${search.trim()}%`;
        whereConditions.push('(bt.ticket_code LIKE ? OR u.full_name LIKE ? OR rc.card_number LIKE ?)');
        queryParams.push(term, term, term);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const countSql = `
        SELECT COUNT(f.id) AS total
        FROM fines f
        JOIN borrow_tickets bt ON f.ticket_id = bt.id
        JOIN reader_cards rc ON bt.reader_card_id = rc.id
        JOIN users u ON rc.user_id = u.id
        ${whereClause}
      `;
      const [countResult] = await pool.query(countSql, queryParams);
      const totalItems = countResult[0].total;

      const selectSql = `
        SELECT
          f.id, f.ticket_id, f.reason, f.overdue_days, f.fine_amount, f.status, f.created_at,
          bt.ticket_code, bt.due_date, bt.return_date,
          rc.id AS reader_card_id, rc.card_number,
          u.id AS user_id, u.full_name AS borrower_name, u.email AS borrower_email, u.phone AS borrower_phone,
          p.id AS payment_id, p.payment_method, p.paid_at
        FROM fines f
        JOIN borrow_tickets bt ON f.ticket_id = bt.id
        JOIN reader_cards rc ON bt.reader_card_id = rc.id
        JOIN users u ON rc.user_id = u.id
        LEFT JOIN payments p ON p.fine_id = f.id
        ${whereClause}
        ORDER BY f.id DESC
        LIMIT ? OFFSET ?
      `;
      const [fines] = await pool.query(selectSql, [...queryParams, limitNum, offset]);

      return res.status(200).json({
        success: true,
        data: {
          items: fines,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalItems / limitNum) || 1,
            totalItems,
            limit: limitNum
          }
        }
      });
    } catch (error) {
      console.error('Get fines error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách khoản phạt',
        error: error.message
      });
    }
  },

  /**
   * Lấy danh sách tiền phạt của người dùng cụ thể
   * GET /api/v1/fines/user/:userId
   */
  async getByUser(req, res) {
    try {
      const { userId } = req.params;

      // Borrower can only view their own fines
      if (req.user.role === 'BORROWER' && req.user.id !== parseInt(userId, 10)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ có quyền xem tiền phạt của chính mình'
        });
      }

      const [fines] = await pool.query(
        `SELECT
           f.id, f.ticket_id, f.reason, f.overdue_days, f.fine_amount, f.status, f.created_at,
           bt.ticket_code, bt.due_date, bt.return_date,
           p.id AS payment_id, p.payment_method, p.paid_at
         FROM fines f
         JOIN borrow_tickets bt ON f.ticket_id = bt.id
         JOIN reader_cards rc ON bt.reader_card_id = rc.id
         LEFT JOIN payments p ON p.fine_id = f.id
         WHERE rc.user_id = ?
         ORDER BY f.id DESC`,
        [userId]
      );

      return res.status(200).json({
        success: true,
        data: fines
      });
    } catch (error) {
      console.error('Get user fines error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách khoản phạt của người dùng',
        error: error.message
      });
    }
  },

  /**
   * Ghi nhận thanh toán khoản phạt
   * POST /api/v1/fines/pay
   */
  async payFine(req, res) {
    const connection = await pool.getConnection();
    try {
      const { fine_id, amount, payment_method } = req.body;

      if (!fine_id) {
        return res.status(400).json({
          success: false,
          message: 'fine_id là bắt buộc'
        });
      }

      const method = payment_method || 'CASH';
      if (!['CASH', 'VNPAY', 'MOMO'].includes(method)) {
        return res.status(400).json({
          success: false,
          message: 'Phương thức thanh toán không hợp lệ (CASH, VNPAY, MOMO)'
        });
      }

      await connection.beginTransaction();

      const [fineRows] = await connection.query(
        'SELECT * FROM fines WHERE id = ? FOR UPDATE',
        [fine_id]
      );

      if (fineRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khoản phạt'
        });
      }

      const fine = fineRows[0];
      if (fine.status === 'PAID') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Khoản phạt này đã được thanh toán trước đó'
        });
      }

      const payAmount = amount ? parseFloat(amount) : parseFloat(fine.fine_amount);

      // Create payment record
      const [paymentResult] = await connection.query(
        `INSERT INTO payments (fine_id, amount, payment_method, paid_at)
         VALUES (?, ?, ?, NOW())`,
        [fine_id, payAmount, method]
      );

      // Update fine status to PAID
      await connection.query(
        "UPDATE fines SET status = 'PAID' WHERE id = ?",
        [fine_id]
      );

      await AuditService.log({
        actorId: req.user.id,
        action: 'PAY_FINE',
        entityType: 'fines',
        entityId: fine_id,
        details: { amount: payAmount, method, paymentId: paymentResult.insertId }
      }, connection);

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: 'Thanh toán khoản phạt thành công',
        data: {
          fine_id: Number(fine_id),
          amount: payAmount,
          payment_method: method,
          status: 'PAID',
          payment_id: paymentResult.insertId
        }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Pay fine error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi ghi nhận thanh toán khoản phạt',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }
};

module.exports = fineController;

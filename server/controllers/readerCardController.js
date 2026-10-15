const pool = require('../config/database');
const AuditService = require('../services/auditService');

const readerCardController = {
  /**
   * Danh sách thẻ thư viện (Librarian/Admin)
   * GET /api/v1/reader-cards
   */
  async getAll(req, res) {
    try {
      const { search, status, page = 1, limit = 20 } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const offset = (pageNum - 1) * limitNum;

      let whereConditions = [];
      let queryParams = [];

      if (status) {
        whereConditions.push('rc.status = ?');
        queryParams.push(status);
      }

      if (search) {
        const term = `%${search.trim()}%`;
        whereConditions.push('(rc.card_number LIKE ? OR u.full_name LIKE ? OR u.username LIKE ? OR u.phone LIKE ?)');
        queryParams.push(term, term, term, term);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const countSql = `
        SELECT COUNT(rc.id) AS total
        FROM reader_cards rc
        JOIN users u ON rc.user_id = u.id
        ${whereClause}
      `;
      const [countResult] = await pool.query(countSql, queryParams);
      const totalItems = countResult[0].total;

      const selectSql = `
        SELECT
          rc.id, rc.card_number, rc.issued_date, rc.expire_date, rc.status, rc.max_borrow,
          u.id AS user_id, u.username, u.full_name, u.email, u.phone,
          (
            SELECT COUNT(td.id)
            FROM borrow_tickets bt
            JOIN ticket_details td ON bt.id = td.ticket_id
            WHERE bt.reader_card_id = rc.id AND bt.status IN ('PENDING', 'BORROWED')
          ) AS currently_borrowing_count,
          (
            SELECT COALESCE(SUM(f.fine_amount), 0)
            FROM fines f
            JOIN borrow_tickets bt ON f.ticket_id = bt.id
            WHERE bt.reader_card_id = rc.id AND f.status = 'UNPAID'
          ) AS unpaid_fines_total
        FROM reader_cards rc
        JOIN users u ON rc.user_id = u.id
        ${whereClause}
        ORDER BY rc.id DESC
        LIMIT ? OFFSET ?
      `;
      const [rows] = await pool.query(selectSql, [...queryParams, limitNum, offset]);

      return res.status(200).json({
        success: true,
        data: {
          items: rows,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalItems / limitNum) || 1,
            totalItems,
            limit: limitNum
          }
        }
      });
    } catch (error) {
      console.error('Get reader cards error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách thẻ độc giả',
        error: error.message
      });
    }
  },

  /**
   * Chi tiết thẻ thư viện
   * GET /api/v1/reader-cards/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const [rows] = await pool.query(
        `SELECT
           rc.*,
           u.id AS user_id, u.username, u.full_name, u.email, u.phone
         FROM reader_cards rc
         JOIN users u ON rc.user_id = u.id
         WHERE rc.id = ?`,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thẻ độc giả'
        });
      }

      return res.status(200).json({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      console.error('Get reader card detail error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin thẻ độc giả',
        error: error.message
      });
    }
  },

  /**
   * Cấp thẻ thư viện mới cho người dùng
   * POST /api/v1/reader-cards
   */
  async create(req, res) {
    try {
      const { user_id, card_number, issued_date, expire_date, max_borrow } = req.body;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'user_id là bắt buộc'
        });
      }

      // Check if user already has a reader card
      const [existing] = await pool.query('SELECT id FROM reader_cards WHERE user_id = ?', [user_id]);
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Người dùng này đã được cấp thẻ độc giả'
        });
      }

      const generatedCardNumber = card_number || `CARD-${Date.now().toString().slice(-8)}`;
      const now = new Date();
      const finalIssuedDate = issued_date || now.toISOString().split('T')[0];
      const finalExpireDate = expire_date || new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [result] = await pool.query(
        `INSERT INTO reader_cards (user_id, card_number, issued_date, expire_date, status, max_borrow)
         VALUES (?, ?, ?, ?, 'ACTIVE', ?)`,
        [user_id, generatedCardNumber, finalIssuedDate, finalExpireDate, max_borrow || 5]
      );

      await AuditService.log({
        actorId: req.user.id,
        action: 'CREATE_READER_CARD',
        entityType: 'reader_cards',
        entityId: result.insertId,
        details: { user_id, cardNumber: generatedCardNumber }
      });

      return res.status(201).json({
        success: true,
        message: 'Cấp thẻ độc giả thành công',
        data: {
          id: result.insertId,
          user_id,
          card_number: generatedCardNumber,
          issued_date: finalIssuedDate,
          expire_date: finalExpireDate,
          status: 'ACTIVE',
          max_borrow: max_borrow || 5
        }
      });
    } catch (error) {
      console.error('Create reader card error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo thẻ độc giả',
        error: error.message
      });
    }
  },

  /**
   * Cập nhật thông tin thẻ
   * PUT /api/v1/reader-cards/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { expire_date, max_borrow } = req.body;

      const [result] = await pool.query(
        `UPDATE reader_cards SET
           expire_date = COALESCE(?, expire_date),
           max_borrow = COALESCE(?, max_borrow)
         WHERE id = ?`,
        [expire_date || null, max_borrow || null, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thẻ độc giả để cập nhật'
        });
      }

      await AuditService.log({
        actorId: req.user.id,
        action: 'UPDATE_READER_CARD',
        entityType: 'reader_cards',
        entityId: id,
        details: { expire_date, max_borrow }
      });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin thẻ độc giả thành công'
      });
    } catch (error) {
      console.error('Update reader card error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thẻ độc giả',
        error: error.message
      });
    }
  },

  /**
   * Khóa / Mở khóa thẻ độc giả
   * PUT /api/v1/reader-cards/:id/status
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ. Chỉ chấp nhận ACTIVE hoặc SUSPENDED'
        });
      }

      const [result] = await pool.query(
        'UPDATE reader_cards SET status = ? WHERE id = ?',
        [status, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thẻ độc giả'
        });
      }

      await AuditService.log({
        actorId: req.user.id,
        action: 'UPDATE_READER_CARD_STATUS',
        entityType: 'reader_cards',
        entityId: id,
        details: { newStatus: status }
      });

      return res.status(200).json({
        success: true,
        message: status === 'ACTIVE' ? 'Đã kích hoạt thẻ độc giả' : 'Đã tạm đình chỉ thẻ độc giả',
        data: { id: Number(id), status }
      });
    } catch (error) {
      console.error('Update reader card status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi thay đổi trạng thái thẻ độc giả',
        error: error.message
      });
    }
  }
};

module.exports = readerCardController;

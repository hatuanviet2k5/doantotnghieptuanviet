const pool = require('../config/database');
const AuditService = require('../services/auditService');

const authorController = {
  /**
   * Danh sách tác giả
   * GET /api/v1/authors
   */
  async getAll(req, res) {
    try {
      const [rows] = await pool.query(
        `SELECT a.*, COUNT(b.id) AS total_books
         FROM authors a
         LEFT JOIN books b ON b.author_id = a.id AND b.status = 'ACTIVE'
         GROUP BY a.id
         ORDER BY a.name ASC`
      );

      return res.status(200).json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Get authors error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách tác giả',
        error: error.message
      });
    }
  },

  /**
   * Chi tiết tác giả
   * GET /api/v1/authors/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await pool.query('SELECT * FROM authors WHERE id = ?', [id]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tác giả'
        });
      }

      return res.status(200).json({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      console.error('Get author detail error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin tác giả',
        error: error.message
      });
    }
  },

  /**
   * Tạo tác giả mới (Admin only)
   * POST /api/v1/authors
   */
  async create(req, res) {
    try {
      const { code, name, bio } = req.body;

      if (!code || !name) {
        return res.status(400).json({
          success: false,
          message: 'Mã tác giả và tên tác giả là bắt buộc'
        });
      }

      const [existing] = await pool.query('SELECT id FROM authors WHERE code = ?', [code]);
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Mã tác giả đã tồn tại'
        });
      }

      const [result] = await pool.query(
        'INSERT INTO authors (code, name, bio) VALUES (?, ?, ?)',
        [code, name, bio || null]
      );

      await AuditService.log({
        actorId: req.user.id,
        action: 'CREATE_AUTHOR',
        entityType: 'authors',
        entityId: result.insertId,
        details: { code, name }
      });

      return res.status(201).json({
        success: true,
        message: 'Tạo tác giả mới thành công',
        data: {
          id: result.insertId,
          code,
          name,
          bio
        }
      });
    } catch (error) {
      console.error('Create author error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo tác giả',
        error: error.message
      });
    }
  },

  /**
   * Cập nhật tác giả (Admin only)
   * PUT /api/v1/authors/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { code, name, bio } = req.body;

      if (!code || !name) {
        return res.status(400).json({
          success: false,
          message: 'Mã tác giả và tên tác giả là bắt buộc'
        });
      }

      const [existing] = await pool.query(
        'SELECT id FROM authors WHERE code = ? AND id != ?',
        [code, id]
      );
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Mã tác giả đã được sử dụng'
        });
      }

      const [result] = await pool.query(
        'UPDATE authors SET code = ?, name = ?, bio = ? WHERE id = ?',
        [code, name, bio || null, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tác giả để cập nhật'
        });
      }

      await AuditService.log({
        actorId: req.user.id,
        action: 'UPDATE_AUTHOR',
        entityType: 'authors',
        entityId: id,
        details: { code, name }
      });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin tác giả thành công',
        data: { id: Number(id), code, name, bio }
      });
    } catch (error) {
      console.error('Update author error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật tác giả',
        error: error.message
      });
    }
  },

  /**
   * Xóa tác giả (Admin only)
   * DELETE /api/v1/authors/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const [books] = await pool.query('SELECT id FROM books WHERE author_id = ? LIMIT 1', [id]);
      if (books.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa tác giả đã có sách trong thư viện'
        });
      }

      const [result] = await pool.query('DELETE FROM authors WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tác giả để xóa'
        });
      }

      await AuditService.log({
        actorId: req.user.id,
        action: 'DELETE_AUTHOR',
        entityType: 'authors',
        entityId: id
      });

      return res.status(200).json({
        success: true,
        message: 'Xóa tác giả thành công'
      });
    } catch (error) {
      console.error('Delete author error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa tác giả',
        error: error.message
      });
    }
  }
};

module.exports = authorController;

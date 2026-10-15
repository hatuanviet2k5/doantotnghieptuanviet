const pool = require('../config/database');
const AuditService = require('../services/auditService');

const categoryController = {
  /**
   * Danh sách thể loại
   * GET /api/v1/categories
   */
  async getAll(req, res) {
    try {
      const [rows] = await pool.query(
        `SELECT c.*, COUNT(b.id) AS total_books
         FROM categories c
         LEFT JOIN books b ON b.category_id = c.id AND b.status = 'ACTIVE'
         GROUP BY c.id
         ORDER BY c.name ASC`
      );

      return res.status(200).json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Get categories error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách thể loại',
        error: error.message
      });
    }
  },

  /**
   * Chi tiết thể loại
   * GET /api/v1/categories/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thể loại'
        });
      }

      return res.status(200).json({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      console.error('Get category detail error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin thể loại',
        error: error.message
      });
    }
  },

  /**
   * Tạo thể loại mới (Admin only)
   * POST /api/v1/categories
   */
  async create(req, res) {
    try {
      const { code, name, description } = req.body;

      if (!code || !name) {
        return res.status(400).json({
          success: false,
          message: 'Mã thể loại và tên thể loại là bắt buộc'
        });
      }

      // Check code uniqueness
      const [existing] = await pool.query('SELECT id FROM categories WHERE code = ?', [code]);
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Mã thể loại đã tồn tại'
        });
      }

      const [result] = await pool.query(
        'INSERT INTO categories (code, name, description) VALUES (?, ?, ?)',
        [code, name, description || null]
      );

      await AuditService.log({
        actorId: req.user.id,
        action: 'CREATE_CATEGORY',
        entityType: 'categories',
        entityId: result.insertId,
        details: { code, name }
      });

      return res.status(201).json({
        success: true,
        message: 'Tạo thể loại thành công',
        data: {
          id: result.insertId,
          code,
          name,
          description
        }
      });
    } catch (error) {
      console.error('Create category error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo thể loại',
        error: error.message
      });
    }
  },

  /**
   * Cập nhật thể loại (Admin only)
   * PUT /api/v1/categories/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { code, name, description } = req.body;

      if (!code || !name) {
        return res.status(400).json({
          success: false,
          message: 'Mã thể loại và tên thể loại là bắt buộc'
        });
      }

      // Check uniqueness of code excluding self
      const [existing] = await pool.query(
        'SELECT id FROM categories WHERE code = ? AND id != ?',
        [code, id]
      );
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Mã thể loại đã được sử dụng bởi thể loại khác'
        });
      }

      const [result] = await pool.query(
        'UPDATE categories SET code = ?, name = ?, description = ? WHERE id = ?',
        [code, name, description || null, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thể loại để cập nhật'
        });
      }

      await AuditService.log({
        actorId: req.user.id,
        action: 'UPDATE_CATEGORY',
        entityType: 'categories',
        entityId: id,
        details: { code, name }
      });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thể loại thành công',
        data: { id: Number(id), code, name, description }
      });
    } catch (error) {
      console.error('Update category error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thể loại',
        error: error.message
      });
    }
  },

  /**
   * Xóa thể loại (Admin only)
   * DELETE /api/v1/categories/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Check if any books reference this category
      const [books] = await pool.query('SELECT id FROM books WHERE category_id = ? LIMIT 1', [id]);
      if (books.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa thể loại đã có sách trực thuộc'
        });
      }

      const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thể loại để xóa'
        });
      }

      await AuditService.log({
        actorId: req.user.id,
        action: 'DELETE_CATEGORY',
        entityType: 'categories',
        entityId: id
      });

      return res.status(200).json({
        success: true,
        message: 'Xóa thể loại thành công'
      });
    } catch (error) {
      console.error('Delete category error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa thể loại',
        error: error.message
      });
    }
  }
};

module.exports = categoryController;

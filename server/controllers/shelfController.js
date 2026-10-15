const pool = require('../config/database');
const AuditService = require('../services/auditService');

const shelfController = {
  /**
   * Danh sách tất cả các kệ sách
   * GET /api/v1/shelves
   */
  async getAllShelves(req, res) {
    try {
      const [rows] = await pool.query(
        `SELECT s.*, COUNT(bc.id) AS current_copies
         FROM shelves s
         LEFT JOIN book_copies bc ON bc.shelf_id = s.id
         GROUP BY s.id
         ORDER BY s.shelf_code ASC`
      );

      return res.status(200).json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Get shelves error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách kệ sách',
        error: error.message
      });
    }
  },

  /**
   * Chi tiết kệ sách cùng danh sách bản sao sách trên kệ
   * GET /api/v1/shelves/:id
   */
  async getShelfById(req, res) {
    try {
      const { id } = req.params;
      const [shelfRows] = await pool.query('SELECT * FROM shelves WHERE id = ?', [id]);

      if (shelfRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy kệ sách'
        });
      }

      const [copies] = await pool.query(
        `SELECT bc.*, b.title AS book_title, b.isbn, b.code AS book_code
         FROM book_copies bc
         JOIN books b ON bc.book_id = b.id
         WHERE bc.shelf_id = ?
         ORDER BY bc.copy_code ASC`,
        [id]
      );

      return res.status(200).json({
        success: true,
        data: {
          ...shelfRows[0],
          copies
        }
      });
    } catch (error) {
      console.error('Get shelf detail error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin kệ sách',
        error: error.message
      });
    }
  },

  /**
   * Tạo kệ sách mới
   * POST /api/v1/shelves
   */
  async createShelf(req, res) {
    try {
      const { shelf_code, location, capacity } = req.body;

      if (!shelf_code) {
        return res.status(400).json({
          success: false,
          message: 'Mã kệ sách là bắt buộc'
        });
      }

      const [existing] = await pool.query('SELECT id FROM shelves WHERE shelf_code = ?', [shelf_code]);
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Mã kệ sách đã tồn tại'
        });
      }

      const [result] = await pool.query(
        'INSERT INTO shelves (shelf_code, location, capacity) VALUES (?, ?, ?)',
        [shelf_code, location || null, capacity || 50]
      );

      await AuditService.log({
        actorId: req.user.id,
        action: 'CREATE_SHELF',
        entityType: 'shelves',
        entityId: result.insertId,
        details: { shelf_code, location }
      });

      return res.status(201).json({
        success: true,
        message: 'Tạo kệ sách thành công',
        data: {
          id: result.insertId,
          shelf_code,
          location,
          capacity: capacity || 50
        }
      });
    } catch (error) {
      console.error('Create shelf error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo kệ sách',
        error: error.message
      });
    }
  },

  /**
   * Cập nhật kệ sách
   * PUT /api/v1/shelves/:id
   */
  async updateShelf(req, res) {
    try {
      const { id } = req.params;
      const { shelf_code, location, capacity } = req.body;

      if (!shelf_code) {
        return res.status(400).json({
          success: false,
          message: 'Mã kệ sách là bắt buộc'
        });
      }

      const [existing] = await pool.query(
        'SELECT id FROM shelves WHERE shelf_code = ? AND id != ?',
        [shelf_code, id]
      );
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Mã kệ sách đã tồn tại trên hệ thống'
        });
      }

      const [result] = await pool.query(
        'UPDATE shelves SET shelf_code = ?, location = ?, capacity = ? WHERE id = ?',
        [shelf_code, location || null, capacity || 50, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy kệ sách'
        });
      }

      await AuditService.log({
        actorId: req.user.id,
        action: 'UPDATE_SHELF',
        entityType: 'shelves',
        entityId: id,
        details: { shelf_code, location }
      });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật kệ sách thành công'
      });
    } catch (error) {
      console.error('Update shelf error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật kệ sách',
        error: error.message
      });
    }
  },

  /**
   * Xóa kệ sách (chỉ khi không có bản sao sách)
   * DELETE /api/v1/shelves/:id
   */
  async deleteShelf(req, res) {
    try {
      const { id } = req.params;

      const [copies] = await pool.query('SELECT id FROM book_copies WHERE shelf_id = ? LIMIT 1', [id]);
      if (copies.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa kệ đang chứa sách'
        });
      }

      const [result] = await pool.query('DELETE FROM shelves WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy kệ sách để xóa'
        });
      }

      await AuditService.log({
        actorId: req.user.id,
        action: 'DELETE_SHELF',
        entityType: 'shelves',
        entityId: id
      });

      return res.status(200).json({
        success: true,
        message: 'Xóa kệ sách thành công'
      });
    } catch (error) {
      console.error('Delete shelf error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa kệ sách',
        error: error.message
      });
    }
  },

  /**
   * Thêm bản sao sách vào kệ
   * POST /api/v1/shelves/:shelfId/copies
   */
  async addCopy(req, res) {
    const connection = await pool.getConnection();
    try {
      const { shelfId } = req.params;
      const { book_id, copy_code, condition_note, status } = req.body;

      if (!book_id || !copy_code) {
        return res.status(400).json({
          success: false,
          message: 'Sách (book_id) và mã bản sao (copy_code) là bắt buộc'
        });
      }

      await connection.beginTransaction();

      // Check shelf exists
      const [shelves] = await connection.query('SELECT id, capacity FROM shelves WHERE id = ?', [shelfId]);
      if (shelves.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy kệ sách'
        });
      }

      // Check capacity
      const [countResult] = await connection.query(
        'SELECT COUNT(id) AS current_count FROM book_copies WHERE shelf_id = ?',
        [shelfId]
      );
      if (countResult[0].current_count >= shelves[0].capacity) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Kệ sách này đã đầy sức chứa'
        });
      }

      // Check book exists
      const [books] = await connection.query('SELECT id FROM books WHERE id = ?', [book_id]);
      if (books.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy sách tương ứng'
        });
      }

      // Check unique copy_code
      const [existingCopy] = await connection.query(
        'SELECT id FROM book_copies WHERE copy_code = ?',
        [copy_code]
      );
      if (existingCopy.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Mã bản sao sách (copy_code) đã tồn tại'
        });
      }

      const copyStatus = status || 'AVAILABLE';

      // Insert book_copy
      const [insertResult] = await connection.query(
        `INSERT INTO book_copies (book_id, shelf_id, copy_code, status, condition_note)
         VALUES (?, ?, ?, ?, ?)`,
        [book_id, shelfId, copy_code, copyStatus, condition_note || 'Tốt']
      );

      // Recalculate book total_copies and available_copies
      await connection.query(
        `UPDATE books b SET
           total_copies = (SELECT COUNT(id) FROM book_copies WHERE book_id = b.id),
           available_copies = (SELECT COUNT(id) FROM book_copies WHERE book_id = b.id AND status = 'AVAILABLE')
         WHERE b.id = ?`,
        [book_id]
      );

      await AuditService.log({
        actorId: req.user.id,
        action: 'ADD_BOOK_COPY',
        entityType: 'book_copies',
        entityId: insertResult.insertId,
        details: { book_id, shelfId, copy_code, status: copyStatus }
      }, connection);

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: 'Thêm bản sao sách vào kệ thành công',
        data: {
          id: insertResult.insertId,
          book_id,
          shelf_id: Number(shelfId),
          copy_code,
          status: copyStatus,
          condition_note: condition_note || 'Tốt'
        }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Add copy error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi thêm bản sao sách',
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  /**
   * Cập nhật trạng thái bản sao sách
   * PUT /api/v1/copies/:id
   */
  async updateCopyStatus(req, res) {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      const { status, condition_note, shelf_id } = req.body;

      await connection.beginTransaction();

      const [copyRows] = await connection.query('SELECT * FROM book_copies WHERE id = ? FOR UPDATE', [id]);
      if (copyRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bản sao sách'
        });
      }

      const copy = copyRows[0];
      const newStatus = status || copy.status;
      const newCondition = condition_note !== undefined ? condition_note : copy.condition_note;
      const newShelfId = shelf_id !== undefined ? shelf_id : copy.shelf_id;

      await connection.query(
        'UPDATE book_copies SET status = ?, condition_note = ?, shelf_id = ? WHERE id = ?',
        [newStatus, newCondition, newShelfId, id]
      );

      // Recalculate book counts
      await connection.query(
        `UPDATE books b SET
           total_copies = (SELECT COUNT(id) FROM book_copies WHERE book_id = b.id),
           available_copies = (SELECT COUNT(id) FROM book_copies WHERE book_id = b.id AND status = 'AVAILABLE')
         WHERE b.id = ?`,
        [copy.book_id]
      );

      await AuditService.log({
        actorId: req.user.id,
        action: 'UPDATE_COPY_STATUS',
        entityType: 'book_copies',
        entityId: id,
        details: { oldStatus: copy.status, newStatus, shelfId: newShelfId }
      }, connection);

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: 'Cập nhật bản sao sách thành công',
        data: {
          id: Number(id),
          status: newStatus,
          condition_note: newCondition,
          shelf_id: newShelfId
        }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Update copy error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật bản sao sách',
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  /**
   * Danh sách bản sao sách (kèm bộ lọc)
   * GET /api/v1/copies
   */
  async getAllCopies(req, res) {
    try {
      const { book_id, status, shelf_id } = req.query;
      let query = `
        SELECT bc.*, b.title AS book_title, b.isbn, b.code AS book_code,
               s.shelf_code, s.location AS shelf_location
        FROM book_copies bc
        JOIN books b ON bc.book_id = b.id
        LEFT JOIN shelves s ON bc.shelf_id = s.id
        WHERE 1=1
      `;
      const params = [];

      if (book_id) {
        query += ' AND bc.book_id = ?';
        params.push(book_id);
      }
      if (status) {
        query += ' AND bc.status = ?';
        params.push(status);
      }
      if (shelf_id) {
        query += ' AND bc.shelf_id = ?';
        params.push(shelf_id);
      }

      query += ' ORDER BY bc.id DESC';

      const [rows] = await pool.query(query, params);
      return res.status(200).json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Get all copies error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách bản sao sách',
        error: error.message
      });
    }
  },

  /**
   * Xóa bản sao sách
   * DELETE /api/v1/copies/:id
   */
  async deleteCopy(req, res) {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      await connection.beginTransaction();

      const [copyRows] = await connection.query('SELECT * FROM book_copies WHERE id = ?', [id]);
      if (copyRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bản sao sách'
        });
      }

      const copy = copyRows[0];
      if (copy.status === 'BORROWED' || copy.status === 'HOLDING') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa bản sao sách đang được mượn hoặc giữ chỗ'
        });
      }

      await connection.query('DELETE FROM book_copies WHERE id = ?', [id]);

      // Update book copy counts
      await connection.query(
        `UPDATE books b SET
           total_copies = (SELECT COUNT(id) FROM book_copies WHERE book_id = b.id),
           available_copies = (SELECT COUNT(id) FROM book_copies WHERE book_id = b.id AND status = 'AVAILABLE')
         WHERE b.id = ?`,
        [copy.book_id]
      );

      await AuditService.log({
        actorId: req.user.id,
        action: 'DELETE_BOOK_COPY',
        entityType: 'book_copies',
        entityId: id,
        details: { copy_code: copy.copy_code }
      }, connection);

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: 'Xóa bản sao sách thành công'
      });
    } catch (error) {
      await connection.rollback();
      console.error('Delete copy error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa bản sao sách',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }
};

module.exports = shelfController;

const pool = require('../config/database');
const AuditService = require('../services/auditService');

const bookController = {
  /**
   * Danh sách sách kèm bộ lọc tìm kiếm
   * GET /api/v1/books
   */
  async getAll(req, res) {
    try {
      const {
        search,
        category_id,
        author_id,
        status,
        page = 1,
        limit = 20,
        available_only
      } = req.query;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const offset = (pageNum - 1) * limitNum;

      let whereConditions = [];
      let queryParams = [];

      // Status filter: defaults to ACTIVE for regular queries unless specified
      if (status) {
        whereConditions.push('b.status = ?');
        queryParams.push(status);
      } else {
        whereConditions.push("b.status = 'ACTIVE'");
      }

      if (category_id) {
        whereConditions.push('b.category_id = ?');
        queryParams.push(category_id);
      }

      if (author_id) {
        whereConditions.push('b.author_id = ?');
        queryParams.push(author_id);
      }

      if (available_only === 'true') {
        whereConditions.push('b.available_copies > 0');
      }

      if (search) {
        const searchPattern = `%${search.trim()}%`;
        whereConditions.push('(b.title LIKE ? OR b.isbn LIKE ? OR b.code LIKE ? OR a.name LIKE ?)');
        queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Count query
      const countSql = `
        SELECT COUNT(b.id) AS total
        FROM books b
        JOIN authors a ON b.author_id = a.id
        JOIN categories c ON b.category_id = c.id
        ${whereClause}
      `;
      const [countResult] = await pool.query(countSql, queryParams);
      const totalItems = countResult[0].total;

      // Select query
      const selectSql = `
        SELECT
          b.id, b.code, b.isbn, b.title, b.publisher, b.publish_year,
          b.total_copies, b.available_copies, b.max_borrow_days, b.cover_image,
          b.status, b.version, b.created_at, b.updated_at,
          a.id AS author_id, a.name AS author_name, a.code AS author_code,
          c.id AS category_id, c.name AS category_name, c.code AS category_code
        FROM books b
        JOIN authors a ON b.author_id = a.id
        JOIN categories c ON b.category_id = c.id
        ${whereClause}
        ORDER BY b.id DESC
        LIMIT ? OFFSET ?
      `;
      const [books] = await pool.query(selectSql, [...queryParams, limitNum, offset]);

      return res.status(200).json({
        success: true,
        data: {
          items: books,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalItems / limitNum) || 1,
            totalItems,
            limit: limitNum
          }
        }
      });
    } catch (error) {
      console.error('Get books error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách sách',
        error: error.message
      });
    }
  },

  /**
   * Chi tiết sách kèm danh sách các bản sao và thông tin kệ sách
   * GET /api/v1/books/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const [bookRows] = await pool.query(
        `SELECT
           b.*,
           a.id AS author_id, a.name AS author_name, a.code AS author_code, a.bio AS author_bio,
           c.id AS category_id, c.name AS category_name, c.code AS category_code, c.description AS category_description
         FROM books b
         JOIN authors a ON b.author_id = a.id
         JOIN categories c ON b.category_id = c.id
         WHERE b.id = ?`,
        [id]
      );

      if (bookRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy sách'
        });
      }

      const book = bookRows[0];

      // Get copies
      const [copies] = await pool.query(
        `SELECT bc.id, bc.copy_code, bc.status, bc.condition_note, bc.created_at,
                s.id AS shelf_id, s.shelf_code, s.location AS shelf_location
         FROM book_copies bc
         LEFT JOIN shelves s ON bc.shelf_id = s.id
         WHERE bc.book_id = ?
         ORDER BY bc.copy_code ASC`,
        [id]
      );

      return res.status(200).json({
        success: true,
        data: {
          ...book,
          copies
        }
      });
    } catch (error) {
      console.error('Get book detail error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin chi tiết sách',
        error: error.message
      });
    }
  },

  /**
   * Tạo sách mới (Admin only)
   * POST /api/v1/books
   */
  async create(req, res) {
    try {
      const {
        code,
        isbn,
        title,
        author_id,
        category_id,
        publisher,
        publish_year,
        max_borrow_days,
        cover_image
      } = req.body;

      if (!code || !isbn || !title || !author_id || !category_id) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ: mã sách, ISBN, tên sách, tác giả và thể loại'
        });
      }

      // Check unique code & isbn
      const [existing] = await pool.query(
        'SELECT id FROM books WHERE code = ? OR isbn = ?',
        [code, isbn]
      );
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Mã sách hoặc mã ISBN đã tồn tại trên hệ thống'
        });
      }

      // Check author and category existence
      const [author] = await pool.query('SELECT id FROM authors WHERE id = ?', [author_id]);
      if (author.length === 0) {
        return res.status(400).json({ success: false, message: 'Tác giả không hợp lệ' });
      }

      const [category] = await pool.query('SELECT id FROM categories WHERE id = ?', [category_id]);
      if (category.length === 0) {
        return res.status(400).json({ success: false, message: 'Thể loại không hợp lệ' });
      }

      // File upload image path or provided cover_image
      let finalCoverImage = cover_image || null;
      if (req.file) {
        finalCoverImage = `/uploads/${req.file.filename}`;
      }

      const [result] = await pool.query(
        `INSERT INTO books
           (code, isbn, title, author_id, category_id, publisher, publish_year, max_borrow_days, cover_image, status, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1)`,
        [
          code,
          isbn,
          title,
          author_id,
          category_id,
          publisher || null,
          publish_year ? parseInt(publish_year, 10) : null,
          max_borrow_days ? parseInt(max_borrow_days, 10) : 14,
          finalCoverImage
        ]
      );

      await AuditService.log({
        actorId: req.user.id,
        action: 'CREATE_BOOK',
        entityType: 'books',
        entityId: result.insertId,
        details: { code, isbn, title }
      });

      return res.status(201).json({
        success: true,
        message: 'Thêm sách mới thành công',
        data: {
          id: result.insertId,
          code,
          isbn,
          title,
          author_id,
          category_id,
          publisher,
          publish_year,
          cover_image: finalCoverImage,
          total_copies: 0,
          available_copies: 0
        }
      });
    } catch (error) {
      console.error('Create book error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo sách',
        error: error.message
      });
    }
  },

  /**
   * Cập nhật sách (Admin only)
   * PUT /api/v1/books/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        code,
        isbn,
        title,
        author_id,
        category_id,
        publisher,
        publish_year,
        max_borrow_days,
        cover_image,
        status
      } = req.body;

      const [existing] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy sách'
        });
      }

      // Check unique code / isbn
      if (code || isbn) {
        const [conflict] = await pool.query(
          'SELECT id FROM books WHERE (code = ? OR isbn = ?) AND id != ?',
          [code || '', isbn || '', id]
        );
        if (conflict.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Mã sách hoặc ISBN đã được sử dụng bởi sách khác'
          });
        }
      }

      let finalCoverImage = cover_image !== undefined ? cover_image : existing[0].cover_image;
      if (req.file) {
        finalCoverImage = `/uploads/${req.file.filename}`;
      }

      await pool.query(
        `UPDATE books SET
           code = COALESCE(?, code),
           isbn = COALESCE(?, isbn),
           title = COALESCE(?, title),
           author_id = COALESCE(?, author_id),
           category_id = COALESCE(?, category_id),
           publisher = COALESCE(?, publisher),
           publish_year = COALESCE(?, publish_year),
           max_borrow_days = COALESCE(?, max_borrow_days),
           cover_image = ?,
           status = COALESCE(?, status),
           version = version + 1
         WHERE id = ?`,
        [
          code || null,
          isbn || null,
          title || null,
          author_id || null,
          category_id || null,
          publisher || null,
          publish_year ? parseInt(publish_year, 10) : null,
          max_borrow_days ? parseInt(max_borrow_days, 10) : null,
          finalCoverImage,
          status || null,
          id
        ]
      );

      await AuditService.log({
        actorId: req.user.id,
        action: 'UPDATE_BOOK',
        entityType: 'books',
        entityId: id,
        details: { title, code }
      });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin sách thành công'
      });
    } catch (error) {
      console.error('Update book error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật sách',
        error: error.message
      });
    }
  },

  /**
   * Xóa mềm sách (set status = 'DISABLED') (Admin only)
   * DELETE /api/v1/books/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const [result] = await pool.query(
        "UPDATE books SET status = 'DISABLED' WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy sách để xóa'
        });
      }

      await AuditService.log({
        actorId: req.user.id,
        action: 'DISABLE_BOOK',
        entityType: 'books',
        entityId: id
      });

      return res.status(200).json({
        success: true,
        message: 'Đã vô hiệu hóa sách thành công'
      });
    } catch (error) {
      console.error('Delete book error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa sách',
        error: error.message
      });
    }
  }
};

module.exports = bookController;

const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const AuditService = require('../services/auditService');

const userController = {
  /**
   * Danh sách người dùng (Admin)
   * GET /api/v1/users
   */
  async getAll(req, res) {
    try {
      const { search, role, status, page = 1, limit = 20 } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const offset = (pageNum - 1) * limitNum;

      let whereConditions = [];
      let queryParams = [];

      if (role) {
        whereConditions.push('r.name = ?');
        queryParams.push(role);
      }

      if (status) {
        whereConditions.push('u.status = ?');
        queryParams.push(status);
      }

      if (search) {
        const term = `%${search.trim()}%`;
        whereConditions.push('(u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
        queryParams.push(term, term, term, term);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const countSql = `
        SELECT COUNT(u.id) AS total
        FROM users u
        JOIN roles r ON u.role_id = r.id
        ${whereClause}
      `;
      const [countResult] = await pool.query(countSql, queryParams);
      const totalItems = countResult[0].total;

      const selectSql = `
        SELECT
          u.id, u.username, u.full_name, u.email, u.phone, u.status, u.created_at, u.updated_at,
          r.id AS role_id, r.name AS role_name,
          rc.id AS reader_card_id, rc.card_number, rc.status AS card_status
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN reader_cards rc ON rc.user_id = u.id
        ${whereClause}
        ORDER BY u.id DESC
        LIMIT ? OFFSET ?
      `;
      const [users] = await pool.query(selectSql, [...queryParams, limitNum, offset]);

      return res.status(200).json({
        success: true,
        data: {
          items: users,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalItems / limitNum) || 1,
            totalItems,
            limit: limitNum
          }
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách người dùng',
        error: error.message
      });
    }
  },

  /**
   * Chi tiết người dùng
   * GET /api/v1/users/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const [users] = await pool.query(
        `SELECT
           u.id, u.username, u.full_name, u.email, u.phone, u.status, u.created_at, u.updated_at,
           r.id AS role_id, r.name AS role_name,
           rc.id AS reader_card_id, rc.card_number, rc.issued_date, rc.expire_date, rc.status AS card_status, rc.max_borrow
         FROM users u
         JOIN roles r ON u.role_id = r.id
         LEFT JOIN reader_cards rc ON rc.user_id = u.id
         WHERE u.id = ?`,
        [id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      return res.status(200).json({
        success: true,
        data: users[0]
      });
    } catch (error) {
      console.error('Get user detail error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin người dùng',
        error: error.message
      });
    }
  },

  /**
   * Tạo tài khoản người dùng mới (Admin)
   * POST /api/v1/users
   */
  async create(req, res) {
    const connection = await pool.getConnection();
    try {
      const { username, password, full_name, email, phone, role_name = 'BORROWER' } = req.body;

      if (!username || !password || !full_name) {
        return res.status(400).json({
          success: false,
          message: 'Tên đăng nhập, mật khẩu và họ tên là bắt buộc'
        });
      }

      await connection.beginTransaction();

      // Check username exists
      const [existing] = await connection.query('SELECT id FROM users WHERE username = ?', [username]);
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Tên đăng nhập đã tồn tại'
        });
      }

      // Check role
      const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', [role_name]);
      if (roles.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Vai trò người dùng không hợp lệ'
        });
      }
      const roleId = roles[0].id;

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const [userResult] = await connection.query(
        `INSERT INTO users (username, password_hash, full_name, email, phone, role_id, status)
         VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [username, passwordHash, full_name, email || null, phone || null, roleId]
      );
      const newUserId = userResult.insertId;

      // If role is BORROWER, auto create reader card
      let readerCard = null;
      if (role_name === 'BORROWER') {
        const cardNumber = `CARD-${Date.now().toString().slice(-8)}`;
        const issuedDate = new Date().toISOString().split('T')[0];
        const expireDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const [cardResult] = await connection.query(
          `INSERT INTO reader_cards (user_id, card_number, issued_date, expire_date, status, max_borrow)
           VALUES (?, ?, ?, ?, 'ACTIVE', 5)`,
          [newUserId, cardNumber, issuedDate, expireDate]
        );
        readerCard = { id: cardResult.insertId, card_number: cardNumber };
      }

      await AuditService.log({
        actorId: req.user.id,
        action: 'CREATE_USER',
        entityType: 'users',
        entityId: newUserId,
        details: { username, role: role_name }
      }, connection);

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: 'Tạo tài khoản người dùng thành công',
        data: {
          id: newUserId,
          username,
          full_name,
          email,
          phone,
          role: role_name,
          reader_card: readerCard
        }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Create user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo người dùng',
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  /**
   * Cập nhật thông tin người dùng (Admin)
   * PUT /api/v1/users/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { full_name, email, phone, role_id, password } = req.body;

      const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      let passwordHash = null;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        passwordHash = await bcrypt.hash(password, salt);
      }

      await pool.query(
        `UPDATE users SET
           full_name = COALESCE(?, full_name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           role_id = COALESCE(?, role_id),
           password_hash = COALESCE(?, password_hash)
         WHERE id = ?`,
        [full_name || null, email || null, phone || null, role_id || null, passwordHash, id]
      );

      await AuditService.log({
        actorId: req.user.id,
        action: 'UPDATE_USER',
        entityType: 'users',
        entityId: id,
        details: { full_name, email, phone, role_id }
      });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin người dùng thành công'
      });
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật người dùng',
        error: error.message
      });
    }
  },

  /**
   * Khóa / Mở khóa tài khoản (Admin)
   * PUT /api/v1/users/:id/status
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['ACTIVE', 'LOCKED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ. Chỉ chấp nhận ACTIVE hoặc LOCKED'
        });
      }

      if (parseInt(id, 10) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Bạn không thể tự khóa tài khoản của chính mình'
        });
      }

      const [result] = await pool.query(
        'UPDATE users SET status = ? WHERE id = ?',
        [status, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      await AuditService.log({
        actorId: req.user.id,
        action: 'UPDATE_USER_STATUS',
        entityType: 'users',
        entityId: id,
        details: { newStatus: status }
      });

      return res.status(200).json({
        success: true,
        message: status === 'ACTIVE' ? 'Đã mở khóa tài khoản thành công' : 'Đã khóa tài khoản thành công',
        data: { id: Number(id), status }
      });
    } catch (error) {
      console.error('Update user status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi thay đổi trạng thái tài khoản',
        error: error.message
      });
    }
  }
};

module.exports = userController;

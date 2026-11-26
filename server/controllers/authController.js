const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const AuditService = require('../services/auditService');
const { escapeHtml } = require('../middlewares/securityMiddleware');

/**
 * Auth Controller
 */
const authController = {
  /**
   * Đăng nhập người dùng
   * POST /api/v1/auth/login
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu'
        });
      }

      // Query user with role and reader card
      const [users] = await pool.query(
        `SELECT u.id, u.username, u.password_hash, u.full_name, u.email, u.phone, u.status,
                r.name AS role,
                rc.id AS reader_card_id, rc.card_number, rc.status AS card_status, rc.expire_date, rc.max_borrow
         FROM users u
         JOIN roles r ON u.role_id = r.id
         LEFT JOIN reader_cards rc ON rc.user_id = u.id
         WHERE u.username = ?`,
        [username]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
        });
      }

      const user = users[0];

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
        });
      }

      // Check user account status
      if (user.status === 'LOCKED') {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
        });
      }

      // Generate JWT
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET || 'library_secret_key_2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Audit log
      await AuditService.log({
        actorId: user.id,
        action: 'LOGIN',
        entityType: 'users',
        entityId: user.id,
        details: { username: user.username, role: user.role }
      });

      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            reader_card: user.reader_card_id ? {
              id: user.reader_card_id,
              card_number: user.card_number,
              status: user.card_status,
              expire_date: user.expire_date,
              max_borrow: user.max_borrow
            } : null
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi đăng nhập',
        error: error.message
      });
    }
  },

  /**
   * Đăng ký tài khoản độc giả mới
   * POST /api/v1/auth/register
   */
  async register(req, res) {
    const connection = await pool.getConnection();
    try {
      const { username, password, full_name, email, phone } = req.body;

      if (!username || !password || !full_name) {
        return res.status(400).json({
          success: false,
          message: 'Tên đăng nhập, mật khẩu và họ tên là các trường bắt buộc'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu phải có ít nhất 6 ký tự'
        });
      }

      const cleanUsername = escapeHtml(username.trim());
      const cleanFullName = escapeHtml(full_name.trim());
      const cleanEmail = email ? escapeHtml(email.trim()) : null;
      const cleanPhone = phone ? escapeHtml(phone.trim()) : null;

      await connection.beginTransaction();

      // Check if username already exists
      const [existingUsers] = await connection.query(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );
      if (existingUsers.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Tên đăng nhập đã tồn tại trong hệ thống'
        });
      }

      // Check BORROWER role
      const [roleRows] = await connection.query(
        "SELECT id FROM roles WHERE name = 'BORROWER'"
      );
      if (roleRows.length === 0) {
        await connection.rollback();
        return res.status(500).json({
          success: false,
          message: 'Vai trò BORROWER chưa được thiết lập'
        });
      }
      const roleId = roleRows[0].id;

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const [userResult] = await connection.query(
        `INSERT INTO users (username, password_hash, full_name, email, phone, role_id, status)
         VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [cleanUsername, passwordHash, cleanFullName, cleanEmail, cleanPhone, roleId]
      );
      const userId = userResult.insertId;

      // Auto generate reader card for borrower
      const cardNumber = `CARD-${Date.now().toString().slice(-8)}`;
      const issuedDate = new Date().toISOString().split('T')[0];
      const expireDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [cardResult] = await connection.query(
        `INSERT INTO reader_cards (user_id, card_number, issued_date, expire_date, status, max_borrow)
         VALUES (?, ?, ?, ?, 'ACTIVE', 5)`,
        [userId, cardNumber, issuedDate, expireDate]
      );

      await AuditService.log({
        actorId: userId,
        action: 'REGISTER',
        entityType: 'users',
        entityId: userId,
        details: { username, cardNumber }
      }, connection);

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản độc giả thành công',
        data: {
          id: userId,
          username,
          full_name,
          email,
          phone,
          role: 'BORROWER',
          reader_card: {
            id: cardResult.insertId,
            card_number: cardNumber,
            issued_date: issuedDate,
            expire_date: expireDate,
            status: 'ACTIVE',
            max_borrow: 5
          }
        }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Register error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi đăng ký tài khoản',
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  /**
   * Lấy thông tin cá nhân
   * GET /api/v1/auth/profile
   */
  async getProfile(req, res) {
    try {
      const [rows] = await pool.query(
        `SELECT u.id, u.username, u.full_name, u.email, u.phone, u.status, u.created_at,
                r.name AS role,
                rc.id AS reader_card_id, rc.card_number, rc.issued_date, rc.expire_date,
                rc.status AS card_status, rc.max_borrow
         FROM users u
         JOIN roles r ON u.role_id = r.id
         LEFT JOIN reader_cards rc ON rc.user_id = u.id
         WHERE u.id = ?`,
        [req.user.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      const user = rows[0];
      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          created_at: user.created_at,
          reader_card: user.reader_card_id ? {
            id: user.reader_card_id,
            card_number: user.card_number,
            issued_date: user.issued_date,
            expire_date: user.expire_date,
            status: user.card_status,
            max_borrow: user.max_borrow
          } : null
        }
      });
    } catch (error) {
      console.error('Profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin người dùng',
        error: error.message
      });
    }
  },

  /**
   * Cập nhật thông tin cá nhân
   * PUT /api/v1/auth/profile
   */
  async updateProfile(req, res) {
    try {
      const { full_name, email, phone } = req.body;
      if (!full_name || !full_name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Họ tên không được để trống'
        });
      }

      const cleanFullName = escapeHtml(full_name.trim());
      const cleanEmail = email ? escapeHtml(email.trim()) : null;
      const cleanPhone = phone ? escapeHtml(phone.trim()) : null;

      await pool.query(
        'UPDATE users SET full_name = ?, email = ?, phone = ? WHERE id = ?',
        [cleanFullName, cleanEmail, cleanPhone, req.user.id]
      );

      await AuditService.log({
        actorId: req.user.id,
        action: 'UPDATE_PROFILE',
        entityType: 'users',
        entityId: req.user.id,
        details: { full_name: cleanFullName, email: cleanEmail, phone: cleanPhone }
      });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin cá nhân thành công',
        data: {
          id: req.user.id,
          full_name: cleanFullName,
          email: cleanEmail,
          phone: cleanPhone
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông tin cá nhân',
        error: error.message
      });
    }
  },

  /**
   * Đổi mật khẩu
   * POST /api/v1/auth/change-password
   */
  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        });
      }

      const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      }

      const isMatch = await bcrypt.compare(oldPassword, rows[0].password_hash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không chính xác'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

      await AuditService.log({
        actorId: req.user.id,
        action: 'CHANGE_PASSWORD',
        entityType: 'users',
        entityId: req.user.id
      });

      return res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi đổi mật khẩu',
        error: error.message
      });
    }
  }
};

module.exports = authController;

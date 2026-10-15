const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để truy cập tài nguyên này'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'library_secret_key_2026');

    // Query fresh user data along with role and reader card
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.email, u.phone, u.status,
              r.name AS role, rc.id AS reader_card_id, rc.card_number, rc.status AS card_status, rc.max_borrow
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN reader_cards rc ON rc.user_id = u.id
       WHERE u.id = ?`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại hoặc đã bị xóa'
      });
    }

    const user = rows[0];
    if (user.status === 'LOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ thủ thư.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token xác thực không hợp lệ'
    });
  }
};

module.exports = authenticate;

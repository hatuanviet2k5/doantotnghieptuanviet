const rateLimit = require('express-rate-limit');

/**
 * Escape HTML special characters to prevent Stored XSS
 * @param {*} unsafe
 * @returns {*}
 */
const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Middleware: Set standard security headers
 */
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

/**
 * Rate limiter cho đăng nhập / đăng ký (chống brute-force)
 */
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 15, // Tối đa 15 lần thử mỗi phút / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau 1 phút!'
  }
});

/**
 * Rate limiter cho giữ chỗ sách (chống spam giữ hết bản sao)
 */
const holdLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 5, // Tối đa 5 lượt giữ sách mỗi phút / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn thao tác giữ sách quá nhanh (Spam). Vui lòng thử lại sau 1 phút!'
  }
});

module.exports = {
  escapeHtml,
  securityHeaders,
  authLimiter,
  holdLimiter
};

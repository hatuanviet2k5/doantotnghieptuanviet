/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} roles Allowed roles (e.g. 'ADMIN', 'LIBRARIAN', 'BORROWER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa được xác thực'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    next();
  };
};

module.exports = {
  authorize
};

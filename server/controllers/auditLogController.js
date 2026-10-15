const pool = require('../config/database');

const auditLogController = {
  /**
   * Danh sách nhật ký kiểm toán hệ thống (Admin only)
   * GET /api/v1/audit-logs
   */
  async getAll(req, res) {
    try {
      const { action, entity_type, actor_id, page = 1, limit = 20 } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const offset = (pageNum - 1) * limitNum;

      let whereConditions = [];
      let queryParams = [];

      if (action) {
        whereConditions.push('al.action LIKE ?');
        queryParams.push(`%${action}%`);
      }

      if (entity_type) {
        whereConditions.push('al.entity_type = ?');
        queryParams.push(entity_type);
      }

      if (actor_id) {
        whereConditions.push('al.actor_id = ?');
        queryParams.push(actor_id);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const countSql = `SELECT COUNT(al.id) AS total FROM audit_logs al ${whereClause}`;
      const [countResult] = await pool.query(countSql, queryParams);
      const totalItems = countResult[0].total;

      const selectSql = `
        SELECT
          al.id, al.actor_id, al.action, al.entity_type, al.entity_id, al.details, al.created_at,
          u.username AS actor_username, u.full_name AS actor_name, r.name AS actor_role
        FROM audit_logs al
        LEFT JOIN users u ON al.actor_id = u.id
        LEFT JOIN roles r ON u.role_id = r.id
        ${whereClause}
        ORDER BY al.id DESC
        LIMIT ? OFFSET ?
      `;
      const [logs] = await pool.query(selectSql, [...queryParams, limitNum, offset]);

      return res.status(200).json({
        success: true,
        data: {
          items: logs,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalItems / limitNum) || 1,
            totalItems,
            limit: limitNum
          }
        }
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách nhật ký hệ thống',
        error: error.message
      });
    }
  }
};

module.exports = auditLogController;

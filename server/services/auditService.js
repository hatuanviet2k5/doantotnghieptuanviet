const pool = require('../config/database');

/**
 * Service to record system audit logs
 */
class AuditService {
  /**
   * Log an action to audit_logs
   * @param {object} params
   * @param {number|null} params.actorId
   * @param {string} params.action
   * @param {string} [params.entityType]
   * @param {number|null} [params.entityId]
   * @param {string|object} [params.details]
   * @param {object} [connection] Optional transaction connection
   */
  static async log({ actorId, action, entityType = null, entityId = null, details = null }, connection = null) {
    const db = connection || pool;
    const detailString = typeof details === 'object' && details !== null ? JSON.stringify(details) : details;
    try {
      await db.query(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?)`,
        [actorId || null, action, entityType, entityId, detailString]
      );
    } catch (err) {
      console.error('Audit log error:', err.message);
      // We don't want audit logging failure to crash main operations unless critical
    }
  }
}

module.exports = AuditService;

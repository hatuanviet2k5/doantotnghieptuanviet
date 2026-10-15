const pool = require('../config/database');

/**
 * Concurrency Control Service using Pessimistic Locking (SELECT ... FOR UPDATE)
 */
class LockService {
  /**
   * Execute operations within a database transaction with automatic commit/rollback
   * @param {Function} callback - Async function that receives a connection
   */
  static async withTransaction(callback) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Lock a single book copy for update
   * @param {object} connection - MySQL transaction connection
   * @param {number|string} copyId
   * @returns {Promise<object|null>}
   */
  static async lockBookCopy(connection, copyId) {
    const [rows] = await connection.query(
      `SELECT bc.*, b.title AS book_title, b.max_borrow_days
       FROM book_copies bc
       JOIN books b ON bc.book_id = b.id
       WHERE bc.id = ?
       FOR UPDATE`,
      [copyId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Lock multiple book copies for update
   * @param {object} connection - MySQL transaction connection
   * @param {Array<number|string>} copyIds
   * @returns {Promise<Array<object>>}
   */
  static async lockBookCopies(connection, copyIds) {
    if (!copyIds || copyIds.length === 0) return [];
    const placeholders = copyIds.map(() => '?').join(',');
    const [rows] = await connection.query(
      `SELECT bc.*, b.title AS book_title, b.max_borrow_days
       FROM book_copies bc
       JOIN books b ON bc.book_id = b.id
       WHERE bc.id IN (${placeholders})
       FOR UPDATE`,
      copyIds
    );
    return rows;
  }

  /**
   * Lock a book record for update (e.g. when updating inventory counts or version)
   * @param {object} connection
   * @param {number|string} bookId
   */
  static async lockBook(connection, bookId) {
    const [rows] = await connection.query(
      `SELECT * FROM books WHERE id = ? FOR UPDATE`,
      [bookId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Lock a borrow ticket for update
   * @param {object} connection
   * @param {number|string} ticketId
   */
  static async lockTicket(connection, ticketId) {
    const [rows] = await connection.query(
      `SELECT * FROM borrow_tickets WHERE id = ? FOR UPDATE`,
      [ticketId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Lock a borrow ticket by ticket_code for update
   * @param {object} connection
   * @param {string} ticketCode
   */
  static async lockTicketByCode(connection, ticketCode) {
    const [rows] = await connection.query(
      `SELECT * FROM borrow_tickets WHERE ticket_code = ? FOR UPDATE`,
      [ticketCode]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Lock reader card for update
   * @param {object} connection
   * @param {number|string} readerCardId
   */
  static async lockReaderCard(connection, readerCardId) {
    const [rows] = await connection.query(
      `SELECT * FROM reader_cards WHERE id = ? FOR UPDATE`,
      [readerCardId]
    );
    return rows.length > 0 ? rows[0] : null;
  }
}

module.exports = LockService;

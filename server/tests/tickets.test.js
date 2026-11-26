const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';

jest.mock('../config/database', () => {
  const mockConnection = {
    beginTransaction: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    release: jest.fn(),
    query: jest.fn()
  };
  return {
    query: jest.fn(),
    getConnection: jest.fn().mockResolvedValue(mockConnection),
    __mockConnection: mockConnection
  };
});

const pool = require('../config/database');
const app = require('../server');

const JWT_SECRET = process.env.JWT_SECRET || 'library_secret_key_2026';

describe('Borrow Tickets API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/v1/tickets/hold - giữ sách thất bại khi thiếu copy_id', async () => {
    const token = jwt.sign({ id: 3, username: '523100126', role: 'BORROWER' }, JWT_SECRET);
    pool.query.mockResolvedValueOnce([[{
      id: 3,
      username: '523100126',
      status: 'ACTIVE',
      role: 'BORROWER',
      reader_card_id: 1
    }]]);

    const res = await request(app)
      .post('/api/v1/tickets/hold')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/tickets/hold - độc giả bị chặn nếu nợ phạt > 50,000 VND', async () => {
    const token = jwt.sign({ id: 3, username: '523100126', role: 'BORROWER' }, JWT_SECRET);
    pool.query.mockResolvedValueOnce([[{
      id: 3,
      username: '523100126',
      status: 'ACTIVE',
      role: 'BORROWER',
      reader_card_id: 1
    }]]);

    const conn = pool.__mockConnection;
    conn.query
      .mockResolvedValueOnce([{}]) // cleanup 1
      .mockResolvedValueOnce([{}]) // cleanup 2
      .mockResolvedValueOnce([{}]) // cleanup 3
      .mockResolvedValueOnce([[{ id: 1, status: 'ACTIVE', expire_date: '2099-12-31', max_borrow: 5 }]]) // reader card
      .mockResolvedValueOnce([[{ total_unpaid: 75000 }]]); // unpaid fines > 50,000

    const res = await request(app)
      .post('/api/v1/tickets/hold')
      .set('Authorization', `Bearer ${token}`)
      .send({ copy_id: 1 });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('50.000');
  });

  test('POST /api/v1/tickets/return - trả sách quá hạn 2 ngày tính phạt 10,000 VND', async () => {
    const libToken = jwt.sign({ id: 2, username: 'librarian', role: 'LIBRARIAN' }, JWT_SECRET);
    pool.query.mockResolvedValueOnce([[{
      id: 2,
      username: 'librarian',
      status: 'ACTIVE',
      role: 'LIBRARIAN'
    }]]);

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const conn = pool.__mockConnection;
    conn.query
      .mockResolvedValueOnce([[{ id: 5, ticket_code: 'TK123', status: 'BORROWED', due_date: twoDaysAgo }]]) // lockTicket
      .mockResolvedValueOnce([[{ copy_id: 11, book_id: 1 }]]) // details (1 copy)
      .mockResolvedValueOnce([{ insertId: 99 }]) // insert fine
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // update ticket RETURNED
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // release copy AVAILABLE
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // update book available_copies
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // update borrow_history
      .mockResolvedValueOnce([{ insertId: 1 }]); // audit log

    const res = await request(app)
      .post('/api/v1/tickets/return')
      .set('Authorization', `Bearer ${libToken}`)
      .send({ ticket_id: 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('RETURNED');
    expect(res.body.data.overdue_days).toBeGreaterThanOrEqual(2);
    expect(res.body.data.fine).not.toBeNull();
    expect(res.body.data.fine.fine_amount).toBeGreaterThanOrEqual(10000);
  });
});

const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';

jest.mock('../config/database', () => ({
  query: jest.fn(),
  getConnection: jest.fn()
}));

const pool = require('../config/database');
const app = require('../server');

const JWT_SECRET = process.env.JWT_SECRET || 'library_secret_key_2026';

describe('Books API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/v1/books - lấy danh sách sách kèm phân trang', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 1 }]])
      .mockResolvedValueOnce([[{
        id: 1,
        code: 'BOOK-001',
        isbn: '978-604-01-001',
        title: 'Clean Code',
        author_id: 2,
        author_name: 'Robert C. Martin',
        category_id: 1,
        category_name: 'CNTT',
        total_copies: 25,
        available_copies: 25,
        status: 'ACTIVE'
      }]]);

    const res = await request(app).get('/api/v1/books');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].title).toBe('Clean Code');
  });

  test('GET /api/v1/books/:id - không tìm thấy sách trả về 404', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/v1/books/9999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/books - chỉ ADMIN được phép tạo sách', async () => {
    const librarianToken = jwt.sign({ id: 2, username: 'librarian', role: 'LIBRARIAN' }, JWT_SECRET);
    pool.query.mockResolvedValueOnce([[{
      id: 2,
      username: 'librarian',
      status: 'ACTIVE',
      role: 'LIBRARIAN'
    }]]);

    const res = await request(app)
      .post('/api/v1/books')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ isbn: '978-000', title: 'Test Book', author_id: 1, category_id: 1 });

    expect(res.status).toBe(403);
  });

  test('POST /api/v1/books - ADMIN tạo sách thành công (tự sinh code nếu thiếu)', async () => {
    const adminToken = jwt.sign({ id: 1, username: 'admin', role: 'ADMIN' }, JWT_SECRET);
    pool.query
      .mockResolvedValueOnce([[{ id: 1, username: 'admin', status: 'ACTIVE', role: 'ADMIN' }]]) // auth
      .mockResolvedValueOnce([[]]) // check unique code/isbn
      .mockResolvedValueOnce([[{ id: 1 }]]) // check author
      .mockResolvedValueOnce([[{ id: 1 }]]) // check category
      .mockResolvedValueOnce([{ insertId: 10 }]) // insert book
      .mockResolvedValueOnce([{ insertId: 1 }]); // audit log

    const res = await request(app)
      .post('/api/v1/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        isbn: '978-604-99-999',
        title: 'Thiết Kế Hệ Thống',
        author_id: 1,
        category_id: 1
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(10);
    expect(res.body.data.code).toMatch(/^BOOK-/);
  });
});

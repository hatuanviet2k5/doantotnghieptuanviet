const request = require('supertest');
const bcrypt = require('bcryptjs');
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

describe('Auth & RBAC API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/v1/auth/login - thiếu username hoặc password trả về 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ username: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/login - đăng nhập thành công trả về token và thông tin user', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    pool.query
      .mockResolvedValueOnce([[{
        id: 1,
        username: 'admin',
        password_hash: hash,
        full_name: 'Admin',
        email: 'admin@library.vn',
        phone: '0901234567',
        status: 'ACTIVE',
        role: 'ADMIN',
        reader_card_id: null
      }]])
      .mockResolvedValueOnce([{ insertId: 1 }]); // audit log

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe('admin');
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  test('POST /api/v1/auth/login - tài khoản bị khóa trả về 403', async () => {
    const hash = await bcrypt.hash('pass123', 10);
    pool.query.mockResolvedValueOnce([[{
      id: 3,
      username: 'lockeduser',
      password_hash: hash,
      full_name: 'Locked',
      status: 'LOCKED',
      role: 'BORROWER'
    }]]);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'lockeduser', password: 'pass123' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/register - mật khẩu < 6 ký tự trả về 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'sv01', password: '123', full_name: 'Sinh Viên' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/v1/auth/profile - không có token trả về 401', async () => {
    const res = await request(app).get('/api/v1/auth/profile');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/users - BORROWER truy cập route ADMIN bị chặn 403', async () => {
    const borrowerToken = jwt.sign({ id: 3, username: '523100126', role: 'BORROWER' }, JWT_SECRET);
    pool.query.mockResolvedValueOnce([[{
      id: 3,
      username: '523100126',
      full_name: 'Hà Tuấn Việt',
      status: 'ACTIVE',
      role: 'BORROWER',
      reader_card_id: 1
    }]]);

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${borrowerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/change-password - đổi mật khẩu thành công', async () => {
    const oldHash = await bcrypt.hash('oldpass123', 10);
    const token = jwt.sign({ id: 3, username: '523100126', role: 'BORROWER' }, JWT_SECRET);

    pool.query
      .mockResolvedValueOnce([[{ id: 3, username: '523100126', status: 'ACTIVE', role: 'BORROWER' }]]) // authMiddleware
      .mockResolvedValueOnce([[{ password_hash: oldHash }]]) // select old hash
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // update password
      .mockResolvedValueOnce([{ insertId: 1 }]); // audit log

    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'oldpass123', newPassword: 'newpass123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

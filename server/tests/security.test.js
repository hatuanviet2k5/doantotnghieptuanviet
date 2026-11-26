const request = require('supertest');
const bcrypt = require('bcryptjs');

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
const { escapeHtml } = require('../middlewares/securityMiddleware');

describe('Security & Protection Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('XSS Prevention: escapeHtml loại bỏ thẻ HTML nguy hiểm', () => {
    const dirty = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
    const clean = escapeHtml(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('<img');
    expect(clean).toContain('&lt;script&gt;');
  });

  test('HTTP Security Headers được thiết lập đầy đủ', async () => {
    pool.query.mockResolvedValueOnce([[{ status: 1 }]]);
    const res = await request(app).get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-xss-protection']).toBe('1; mode=block');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('Mật khẩu đăng ký được hash bằng bcrypt và dữ liệu XSS bị escape', async () => {
    const conn = pool.__mockConnection;
    conn.query
      .mockResolvedValueOnce([[]]) // username not exists
      .mockResolvedValueOnce([[{ id: 3 }]]) // BORROWER role
      .mockResolvedValueOnce([{ insertId: 100 }]) // insert user
      .mockResolvedValueOnce([{ insertId: 50 }]) // insert reader_card
      .mockResolvedValueOnce([{ insertId: 1 }]); // audit log

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'svtest99',
        password: 'MySecretPassword123',
        full_name: '<script>alert(1)</script>Nguyễn Văn Test'
      });

    expect(res.status).toBe(201);
    const insertUserCall = conn.query.mock.calls.find(c => c[0].includes('INSERT INTO users'));
    expect(insertUserCall).toBeDefined();

    const [, params] = insertUserCall;
    const savedHash = params[1];
    const savedName = params[2];

    // Mật khẩu phải là bcrypt hash
    expect(savedHash).not.toBe('MySecretPassword123');
    expect(savedHash).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare('MySecretPassword123', savedHash)).toBe(true);

    // Tên phải được escape chống XSS
    expect(savedName).not.toContain('<script>');
    expect(savedName).toContain('&lt;script&gt;');
  });

  test('Rate Limiting: Chặn brute-force đăng nhập quá 15 lần/phút', async () => {
    pool.query.mockResolvedValue([[]]);

    let lastRes;
    for (let i = 0; i < 16; i++) {
      lastRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'nobody', password: 'wrong' });
    }

    expect(lastRes.status).toBe(429);
    expect(lastRes.body.success).toBe(false);
  });
});

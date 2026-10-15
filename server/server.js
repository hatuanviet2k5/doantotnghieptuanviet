const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const apiRoutes = require('./routes');
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1 AS status');
    return res.status(200).json({
      success: true,
      message: 'Tuanvietlibrary Server is running normally',
      database: result[0].status === 1 ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: err.message
    });
  }
});

// API Routes
app.use('/api/v1', apiRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Đường dẫn ${req.originalUrl} không tồn tại trên hệ thống`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Đã có lỗi xảy ra phía máy chủ',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` Tuanvietlibrary Server running on port ${PORT}`);
    console.log(` API Endpoint: http://localhost:${PORT}/api/v1`);
    console.log(` Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });
}

module.exports = app;

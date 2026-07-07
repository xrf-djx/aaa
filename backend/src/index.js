const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { initDb } = require('./db');

async function main() {
  await initDb();
  console.log('Database initialized');

  const app = express();
  const PORT = 3000;

  // 中间件
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 静态文件服务 - uploads 目录
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  // 路由
  const authRoutes = require('./routes/auth');
  const photoRoutes = require('./routes/photo');
  const adminRoutes = require('./routes/admin');

  app.use('/api/auth', authRoutes);
  app.use('/api/photo', photoRoutes);
  app.use('/api/admin', adminRoutes);

  // 健康检查
  app.get('/api/health', (req, res) => {
    res.json({ code: 200, message: 'ok', data: null });
  });

  // 全局错误处理
  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.json({ code: 400, message: '文件上传错误: ' + err.message, data: null });
    }
    if (err.message && err.message.includes('仅支持')) {
      return res.json({ code: 400, message: err.message, data: null });
    }
    console.error(err);
    res.json({ code: 500, message: '服务器内部错误', data: null });
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, queryAll, run } = require('../db');
const { auth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const TOKEN_EXPIRES_IN = '7d';

/**
 * POST /api/auth/register
 * Body: { username, password, nickname }
 */
router.post('/register', async (req, res) => {
  const { username, password, nickname } = req.body;

  if (!username || !password || !nickname) {
    return res.json({ code: 400, message: '参数错误', data: null });
  }

  const existing = queryOne('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) {
    return res.json({ code: 400, message: '用户名已存在', data: null });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = run(
    'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
    [username, hashedPassword, nickname]
  );

  const user = queryOne(
    'SELECT id, username, nickname, avatar, role, created_at FROM users WHERE id = ?',
    [result.lastInsertRowid]
  );

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );

  res.json({ code: 200, message: 'success', data: { token, user } });
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ code: 400, message: '参数错误', data: null });
  }

  const user = queryOne('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) {
    return res.json({ code: 400, message: '用户名或密码错误', data: null });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.json({ code: 400, message: '用户名或密码错误', data: null });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );

  const { password: _, ...userInfo } = user;
    res.json({ code: 200, message: 'success', data: { token, user: userInfo } });
  } catch(e) {
    console.error('Login error:', e);
    res.json({ code: 500, message: '服务器内部错误: ' + e.message, data: null });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', auth, (req, res) => {
  const user = queryOne(
    'SELECT id, username, nickname, avatar, role, created_at, updated_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!user) {
    return res.json({ code: 401, message: '用户不存在', data: null });
  }
  res.json({ code: 200, message: 'success', data: user });
});

module.exports = router;

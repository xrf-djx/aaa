const express = require('express');
const { queryAll, queryCount, run, queryOne } = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// 所有路由需要 auth + admin 权限
router.use(auth, adminOnly);

/**
 * GET /api/admin/photo/list
 */
router.get('/photo/list', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
  const status = req.query.status;

  let whereClause = 'WHERE p.deleted_at IS NULL';
  const params = [];

  if (status && ['pending', 'approved', 'rejected', 'draft'].includes(status)) {
    whereClause += ' AND p.status = ?';
    params.push(status);
  }

  const total = queryCount(`SELECT COUNT(*) as total FROM photos p ${whereClause}`, params);

  const offset = (page - 1) * pageSize;
  const list = queryAll(
    `SELECT p.*, u.username, u.nickname, u.avatar
     FROM photos p
     JOIN users u ON p.user_id = u.id
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const data = list.map(item => ({
    ...item,
    images: JSON.parse(item.images || '[]')
  }));

  res.json({ code: 200, message: 'success', data: { total, page, pageSize, list: data } });
});

/**
 * PUT /api/admin/photo/approve/:id
 */
router.put('/photo/approve/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) {
    return res.json({ code: 400, message: '参数错误', data: null });
  }

  const photo = queryOne('SELECT id FROM photos WHERE id = ? AND deleted_at IS NULL', [id]);
  if (!photo) {
    return res.json({ code: 400, message: '游记不存在', data: null });
  }

  run(
    "UPDATE photos SET status = 'approved', reject_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [id]
  );

  res.json({ code: 200, message: 'success', data: null });
});

/**
 * PUT /api/admin/photo/reject/:id
 */
router.put('/photo/reject/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) {
    return res.json({ code: 400, message: '参数错误', data: null });
  }

  const { reject_reason } = req.body;
  if (!reject_reason) {
    return res.json({ code: 400, message: '请填写驳回原因', data: null });
  }

  const photo = queryOne('SELECT id FROM photos WHERE id = ? AND deleted_at IS NULL', [id]);
  if (!photo) {
    return res.json({ code: 400, message: '游记不存在', data: null });
  }

  run(
    "UPDATE photos SET status = 'rejected', reject_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [reject_reason, id]
  );

  res.json({ code: 200, message: 'success', data: null });
});

/**
 * GET /api/admin/user/list
 */
router.get('/user/list', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
  const search = req.query.search || '';

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (search) {
    whereClause += ' AND (username LIKE ? OR nickname LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const total = queryCount(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);

  const offset = (page - 1) * pageSize;
  const list = queryAll(
    `SELECT id, username, nickname, avatar, role, created_at, updated_at
     FROM users ${whereClause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  res.json({ code: 200, message: 'success', data: { total, page, pageSize, list } });
});

module.exports = router;

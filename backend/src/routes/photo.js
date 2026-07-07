const express = require('express');
const multer = require('multer');
const path = require('path');
const { queryOne, queryAll, run, queryCount } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 jpg/png/gif/webp 格式图片'));
    }
  }
});

/**
 * GET /api/photo/list
 */
router.get('/list', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
  const search = req.query.search || '';

  let whereSql = "WHERE p.status = 'approved' AND p.deleted_at IS NULL";
  const params = [];

  if (search) {
    whereSql += ' AND (p.title LIKE ? OR p.content LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const total = queryCount(`SELECT COUNT(*) as total FROM photos p ${whereSql}`, params);

  const offset = (page - 1) * pageSize;
  const list = queryAll(
    `SELECT p.*, u.username, u.nickname, u.avatar
     FROM photos p
     JOIN users u ON p.user_id = u.id
     ${whereSql}
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
 * GET /api/photo/detail/:id
 */
router.get('/detail/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) {
    return res.json({ code: 400, message: '参数错误', data: null });
  }

  const photo = queryOne(
    `SELECT p.*, u.username, u.nickname, u.avatar
     FROM photos p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = ? AND p.deleted_at IS NULL`,
    [id]
  );

  if (!photo) {
    return res.json({ code: 400, message: '游记不存在', data: null });
  }

  photo.images = JSON.parse(photo.images || '[]');
  photo.likeCount = queryCount('SELECT COUNT(*) as count FROM likes WHERE photo_id = ?', [id]);

  res.json({ code: 200, message: 'success', data: photo });
});

/**
 * POST /api/photo/create
 */
router.post('/create', auth, upload.array('images', 9), (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.json({ code: 400, message: '参数错误', data: null });
  }

  const images = (req.files || []).map(f => '/uploads/' + f.filename);
  const imagesStr = JSON.stringify(images);

  const result = run(
    'INSERT INTO photos (user_id, title, content, images, status) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, title, content, imagesStr, 'pending']
  );

  const photo = queryOne('SELECT * FROM photos WHERE id = ?', [result.lastInsertRowid]);
  photo.images = JSON.parse(photo.images || '[]');

  res.json({ code: 200, message: 'success', data: photo });
});

/**
 * PUT /api/photo/update/:id
 */
router.put('/update/:id', auth, upload.array('images', 9), (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) {
    return res.json({ code: 400, message: '参数错误', data: null });
  }

  const photo = queryOne('SELECT * FROM photos WHERE id = ? AND deleted_at IS NULL', [id]);
  if (!photo) {
    return res.json({ code: 400, message: '游记不存在', data: null });
  }
  if (photo.user_id !== req.user.id) {
    return res.json({ code: 403, message: '无权限', data: null });
  }

  const { title, content } = req.body;
  const updates = [];
  const params = [];

  if (title) {
    updates.push('title = ?');
    params.push(title);
  }
  if (content) {
    updates.push('content = ?');
    params.push(content);
  }
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map(f => '/uploads/' + f.filename);
    const existingImages = JSON.parse(photo.images || '[]');
    updates.push('images = ?');
    params.push(JSON.stringify([...existingImages, ...newImages]));
  }

  if (updates.length === 0) {
    return res.json({ code: 400, message: '无更新内容', data: null });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  run(`UPDATE photos SET ${updates.join(', ')} WHERE id = ?`, params);

  const updated = queryOne('SELECT * FROM photos WHERE id = ?', [id]);
  updated.images = JSON.parse(updated.images || '[]');

  res.json({ code: 200, message: 'success', data: updated });
});

/**
 * DELETE /api/photo/delete/:id
 */
router.delete('/delete/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) {
    return res.json({ code: 400, message: '参数错误', data: null });
  }

  const photo = queryOne('SELECT * FROM photos WHERE id = ? AND deleted_at IS NULL', [id]);
  if (!photo) {
    return res.json({ code: 400, message: '游记不存在', data: null });
  }

  if (photo.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.json({ code: 403, message: '无权限', data: null });
  }

  run("UPDATE photos SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);

  res.json({ code: 200, message: 'success', data: null });
});

/**
 * POST /api/photo/like/:id
 */
router.post('/like/:id', auth, (req, res) => {
  const photoId = parseInt(req.params.id);
  if (!photoId) {
    return res.json({ code: 400, message: '参数错误', data: null });
  }

  const photo = queryOne('SELECT id FROM photos WHERE id = ? AND deleted_at IS NULL', [photoId]);
  if (!photo) {
    return res.json({ code: 400, message: '游记不存在', data: null });
  }

  const existing = queryOne('SELECT id FROM likes WHERE user_id = ? AND photo_id = ?', [req.user.id, photoId]);

  if (existing) {
    run('DELETE FROM likes WHERE id = ?', [existing.id]);
    const count = queryCount('SELECT COUNT(*) as count FROM likes WHERE photo_id = ?', [photoId]);
    res.json({ code: 200, message: 'success', data: { liked: false, likeCount: count } });
  } else {
    run('INSERT INTO likes (user_id, photo_id) VALUES (?, ?)', [req.user.id, photoId]);
    const count = queryCount('SELECT COUNT(*) as count FROM likes WHERE photo_id = ?', [photoId]);
    res.json({ code: 200, message: 'success', data: { liked: true, likeCount: count } });
  }
});

module.exports = router;

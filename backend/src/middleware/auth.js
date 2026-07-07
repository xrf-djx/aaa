const jwt = require('jsonwebtoken');

const JWT_SECRET = 'wudong-jwt-secret';

/**
 * JWT 认证中间件
 * 从 Authorization header 提取 token，验证后将用户信息挂载到 req.user
 */
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(200).json({ code: 401, message: '未登录', data: null });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(200).json({ code: 401, message: '未登录', data: null });
  }
}

/**
 * 管理员权限中间件（需在 auth 之后使用）
 */
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(200).json({ code: 403, message: '无权限', data: null });
  }
  next();
}

module.exports = { auth, adminOnly, JWT_SECRET };

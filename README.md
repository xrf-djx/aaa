# 乌东文旅平台 - 社区·照片分享模块

## 项目结构
\\\
wudong/
├── backend/       # 后端接口 (Express + SQLite)
├── web/           # PC Web端 (React + Vite)
├── admin/         # 后台管理端 (React + Vite)
└── README.md
\\\

## 快速启动

### 1. 启动后端 (端口 3000)
\\\ash
cd backend
npm install
npm run dev
\\\

### 2. 启动 Web端 (端口 5173)
\\\ash
cd web
npm install
npm run dev
\\\

### 3. 启动后台管理端 (端口 5174)
\\\ash
cd admin
npm install
npm run dev
\\\

## 管理员账号
- 用户名: admin
- 密码: admin123
- 普通测试账号: user / user123

## 接口文档

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 {username, password, nickname} |
| POST | /api/auth/login | 登录 {username, password} |
| GET  | /api/auth/me | 当前用户信息 (需token) |

### 游记
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/photo/list | 已发布游记列表 (?page=1&pageSize=20&search=) |
| GET  | /api/photo/detail/:id | 游记详情 |
| POST | /api/photo/create | 发布游记 (multipart, 需token) |
| PUT  | /api/photo/update/:id | 更新游记 (需token) |
| DELETE | /api/photo/delete/:id | 删除游记 (需token) |
| POST | /api/photo/like/:id | 点赞/取消 (需token) |

### 管理后台
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/admin/photo/list | 游记列表 (?status=pending) |
| PUT  | /api/admin/photo/approve/:id | 审核通过 |
| PUT  | /api/admin/photo/reject/:id | 审核驳回 {reject_reason} |
| GET  | /api/admin/user/list | 用户列表 (?search=) |

## 成员分工
- 谢荣峰: 后端 + Web端 + 后台管理端

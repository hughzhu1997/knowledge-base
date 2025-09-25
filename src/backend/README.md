# Knowledge Base Backend API

基于 Node.js + Express + MongoDB 的知识库后端 API 服务。

## 📁 项目结构

```
src/backend/
├── server.js              # 主服务器入口文件
├── config/                # 配置文件
│   ├── app.js            # 应用配置
│   └── database.js       # 数据库配置
├── routes/               # 路由文件
│   ├── auth.js          # 认证路由
│   ├── docs.js          # 文档管理路由
│   ├── search.js        # 搜索路由
│   ├── admin.js         # 管理员路由
│   └── nlp.js           # NLP 路由
├── controllers/          # 控制器
│   ├── authController.js
│   ├── docsController.js
│   ├── searchController.js
│   ├── adminController.js
│   └── nlpController.js
├── models/              # 数据模型
│   ├── User.js
│   ├── Document.js
│   ├── Role.js
│   ├── Revision.js
│   └── index.js
├── middleware/          # 中间件
│   ├── auth.js         # JWT 认证中间件
│   ├── admin.js        # 管理员权限中间件
│   └── validation.js   # 请求验证中间件
└── .env.example        # 环境变量示例
```

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 环境配置

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的环境变量：

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/knowledge-base
JWT_SECRET=your-super-secret-jwt-key
```

### 3. 启动服务

```bash
# 开发模式
node server.js

# 或使用 pnpm
pnpm start
```

## 📚 API 接口

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取用户信息

### 文档管理

- `GET /api/docs` - 获取所有文档
- `GET /api/docs/:id` - 获取单个文档
- `POST /api/docs` - 创建文档
- `PUT /api/docs/:id` - 更新文档
- `DELETE /api/docs/:id` - 删除文档

### 搜索功能

- `GET /api/search?q=keyword` - 全文搜索

### 管理员功能

- `GET /api/admin/users` - 获取用户列表
- `PUT /api/admin/users/:id/role` - 修改用户权限

### NLP 功能

- `POST /api/nlp/query` - 问答接口

## 🗄️ 数据库模型

### User (用户)
- `username` - 用户名
- `email` - 邮箱 (唯一)
- `password` - 密码 (加密)
- `role` - 角色 (admin/developer/user)

### Document (文档)
- `title` - 文档标题
- `category` - 文档分类
- `content` - 文档内容 (Markdown)
- `authorId` - 作者ID
- `version` - 版本号

### Role (角色)
- `roleName` - 角色名称
- `permissions` - 权限列表

### Revision (版本记录)
- `documentId` - 文档ID
- `version` - 版本号
- `content` - 文档快照
- `updatedBy` - 修改人ID

## 🔧 开发说明

### 中间件

- **auth.js**: JWT 认证中间件，验证用户身份
- **admin.js**: 管理员权限中间件，检查管理员权限
- **validation.js**: 请求验证中间件，验证请求参数

### 错误处理

API 使用统一的错误响应格式：

```json
{
  "error": "错误类型",
  "message": "错误描述"
}
```

### 状态码

- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未授权访问
- `403` - 权限不足
- `404` - 资源不存在
- `500` - 服务器错误

## 📝 待办事项

- [ ] 实现完整的 CRUD 操作
- [ ] 添加数据验证
- [ ] 实现文件上传功能
- [ ] 添加 API 文档 (Swagger)
- [ ] 实现缓存机制
- [ ] 添加单元测试
- [ ] 实现日志记录
- [ ] 添加性能监控

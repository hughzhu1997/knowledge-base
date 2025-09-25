# 用户管理 API 文档

基于 `/docs/db-schema.md` 中 User 表字段实现的完整 CRUD 功能。

## 字段说明

| 字段名    | 类型     | 说明                    |
|-----------|----------|-------------------------|
| id        | UUID     | 用户唯一标识            |
| username  | String   | 用户名                  |
| email     | String   | 邮箱地址（唯一）        |
| password  | String   | 密码（加密存储）        |
| role      | String   | 用户角色                |
| createdAt | DateTime | 创建时间                |
| updatedAt | DateTime | 更新时间                |

**角色类型**: `admin`, `developer`, `user`

---

## API 接口

### 1. 获取所有用户（分页）

**请求**
```http
GET /api/users?page=1&limit=10&search=keyword&role=admin&sortBy=createdAt&sortOrder=DESC
Authorization: Bearer <token>
```

**查询参数**
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 10
- `search` (可选): 搜索关键字（用户名或邮箱）
- `role` (可选): 角色筛选
- `sortBy` (可选): 排序字段，默认 createdAt
- `sortOrder` (可选): 排序方向，ASC/DESC，默认 DESC

**响应**
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2025-09-26T10:00:00Z",
      "updatedAt": "2025-09-26T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 2. 获取单个用户

**请求**
```http
GET /api/users/:id
Authorization: Bearer <token>
```

**响应**
```json
{
  "id": "uuid",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "user",
  "createdAt": "2025-09-26T10:00:00Z",
  "updatedAt": "2025-09-26T10:00:00Z"
}
```

### 3. 创建用户（仅管理员）

**请求**
```http
POST /api/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "username": "new_user",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user"
}
```

**响应**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "username": "new_user",
    "email": "newuser@example.com",
    "role": "user",
    "createdAt": "2025-09-26T10:00:00Z",
    "updatedAt": "2025-09-26T10:00:00Z"
  }
}
```

### 4. 更新用户

**请求**
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "updated_username",
  "email": "updated@example.com",
  "role": "developer"
}
```

**响应**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "uuid",
    "username": "updated_username",
    "email": "updated@example.com",
    "role": "developer",
    "createdAt": "2025-09-26T10:00:00Z",
    "updatedAt": "2025-09-26T10:05:00Z"
  }
}
```

### 5. 删除用户（仅管理员）

**请求**
```http
DELETE /api/users/:id
Authorization: Bearer <admin_token>
```

**响应**
```json
{
  "message": "User deleted successfully"
}
```

### 6. 更新用户角色（仅管理员）

**请求**
```http
PATCH /api/users/:id/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "admin"
}
```

**响应**
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "admin",
    "createdAt": "2025-09-26T10:00:00Z",
    "updatedAt": "2025-09-26T10:05:00Z"
  }
}
```

### 7. 更新用户密码

**请求**
```http
PATCH /api/users/:id/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password123"
}
```

**响应**
```json
{
  "message": "Password updated successfully"
}
```

### 8. 获取用户统计信息（仅管理员）

**请求**
```http
GET /api/users/stats
Authorization: Bearer <admin_token>
```

**响应**
```json
{
  "totalUsers": 100,
  "roleDistribution": {
    "admin": 5,
    "developer": 15,
    "user": 80
  },
  "recentUsers": [
    {
      "id": "uuid",
      "username": "new_user",
      "email": "new@example.com",
      "role": "user",
      "createdAt": "2025-09-26T10:00:00Z"
    }
  ]
}
```

---

## 错误响应

### 400 Bad Request
```json
{
  "error": "Missing required fields",
  "message": "Username, email, and password are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Access denied",
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied",
  "message": "Admin privileges required"
}
```

### 404 Not Found
```json
{
  "error": "User not found",
  "message": "The requested user does not exist"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create user",
  "message": "An error occurred while creating the user"
}
```

---

## 权限说明

- **所有用户**: 可以查看用户列表、获取单个用户信息、更新自己的信息、修改自己的密码
- **管理员**: 可以创建用户、删除用户、修改任何用户的角色、查看用户统计信息

---

## 验证规则

- **用户名**: 2-50 个字符
- **邮箱**: 必须符合邮箱格式，且唯一
- **密码**: 至少 6 个字符
- **角色**: 必须是 `admin`、`developer` 或 `user` 之一
- **用户ID**: 必须是有效的 UUID 格式

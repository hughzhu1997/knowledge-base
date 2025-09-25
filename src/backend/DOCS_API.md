# 文档管理 API 文档

基于 `/docs/db-schema.md` 中 Document 表字段实现的完整 CRUD 功能。

## 字段说明

| 字段名    | 类型     | 说明                    |
|-----------|----------|-------------------------|
| id        | UUID     | 文档唯一标识            |
| title     | String   | 文档标题（最多200字符） |
| category  | String   | 文档分类                |
| content   | Text     | 文档内容（Markdown）    |
| authorId  | UUID     | 作者用户ID（外键）      |
| version   | Integer  | 当前版本号              |
| createdAt | DateTime | 创建时间                |
| updatedAt | DateTime | 更新时间                |

**分类类型**: `prd`, `architecture`, `api`, `db`, `code`, `dependency`

---

## API 接口

### 1. 获取所有文档（分页、搜索、筛选）

**请求**
```http
GET /api/docs?page=1&limit=10&search=keyword&category=api&authorId=uuid&sortBy=updatedAt&sortOrder=DESC
Authorization: Bearer <token>
```

**查询参数**
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 10
- `search` (可选): 搜索关键字（标题或内容）
- `category` (可选): 分类筛选
- `authorId` (可选): 作者筛选
- `sortBy` (可选): 排序字段，默认 updatedAt
- `sortOrder` (可选): 排序方向，ASC/DESC，默认 DESC

**响应**
```json
{
  "documents": [
    {
      "id": "uuid",
      "title": "API 设计规范",
      "category": "api",
      "version": 2,
      "createdAt": "2025-09-26T10:00:00Z",
      "updatedAt": "2025-09-26T10:30:00Z",
      "author": {
        "id": "uuid",
        "username": "john_doe",
        "email": "john@example.com"
      }
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

### 2. 获取单个文档

**请求**
```http
GET /api/docs/:id
Authorization: Bearer <token>
```

**响应**
```json
{
  "id": "uuid",
  "title": "API 设计规范",
  "category": "api",
  "content": "# API 设计规范\n\n## 概述\n...",
  "version": 2,
  "authorId": "uuid",
  "createdAt": "2025-09-26T10:00:00Z",
  "updatedAt": "2025-09-26T10:30:00Z",
  "author": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### 3. 创建文档

**请求**
```http
POST /api/docs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "新文档标题",
  "category": "api",
  "content": "# 文档内容\n\nMarkdown 格式的内容..."
}
```

**响应**
```json
{
  "message": "Document created successfully",
  "document": {
    "id": "uuid",
    "title": "新文档标题",
    "category": "api",
    "content": "# 文档内容\n\nMarkdown 格式的内容...",
    "version": 1,
    "authorId": "uuid",
    "createdAt": "2025-09-26T10:00:00Z",
    "updatedAt": "2025-09-26T10:00:00Z",
    "author": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com"
    }
  }
}
```

### 4. 更新文档

**请求**
```http
PUT /api/docs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "更新后的标题",
  "category": "architecture",
  "content": "更新后的内容"
}
```

**响应**
```json
{
  "message": "Document updated successfully",
  "document": {
    "id": "uuid",
    "title": "更新后的标题",
    "category": "architecture",
    "content": "更新后的内容",
    "version": 3,
    "authorId": "uuid",
    "createdAt": "2025-09-26T10:00:00Z",
    "updatedAt": "2025-09-26T11:00:00Z",
    "author": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com"
    }
  }
}
```

### 5. 删除文档

**请求**
```http
DELETE /api/docs/:id
Authorization: Bearer <token>
```

**响应**
```json
{
  "message": "Document deleted successfully"
}
```

### 6. 获取文档分类列表

**请求**
```http
GET /api/docs/categories
Authorization: Bearer <token>
```

**响应**
```json
[
  { "value": "prd", "label": "PRD (产品需求文档)" },
  { "value": "architecture", "label": "Architecture (架构设计)" },
  { "value": "api", "label": "API (接口文档)" },
  { "value": "db", "label": "Database (数据库设计)" },
  { "value": "code", "label": "Code (代码规范)" },
  { "value": "dependency", "label": "Dependency (依赖管理)" }
]
```

### 7. 获取文档统计信息

**请求**
```http
GET /api/docs/stats
Authorization: Bearer <token>
```

**响应**
```json
{
  "totalDocs": 100,
  "docsByCategory": [
    { "category": "api", "count": "25" },
    { "category": "prd", "count": "20" },
    { "category": "architecture", "count": "15" }
  ],
  "recentDocs": [
    {
      "id": "uuid",
      "title": "最新文档",
      "category": "api",
      "createdAt": "2025-09-26T10:00:00Z",
      "author": {
        "username": "john_doe"
      }
    }
  ]
}
```

### 8. 获取当前用户的文档

**请求**
```http
GET /api/docs/my?page=1&limit=10&search=keyword&category=api&sortBy=updatedAt&sortOrder=DESC
Authorization: Bearer <token>
```

**响应**
```json
{
  "documents": [
    {
      "id": "uuid",
      "title": "我的文档",
      "category": "api",
      "version": 1,
      "createdAt": "2025-09-26T10:00:00Z",
      "updatedAt": "2025-09-26T10:00:00Z",
      "author": {
        "id": "uuid",
        "username": "john_doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 权限说明

- **所有用户**: 可以查看所有文档、创建文档、查看分类和统计信息
- **文档作者**: 可以编辑和删除自己的文档
- **管理员**: 可以编辑和删除任何文档

---

## 验证规则

- **标题**: 必填，最多200个字符
- **分类**: 必填，必须是预定义分类之一
- **内容**: 必填，支持Markdown格式
- **文档ID**: 必须是有效的UUID格式

---

## 错误响应

### 400 Bad Request
```json
{
  "error": "Missing required fields",
  "message": "Title, category, and content are required"
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
  "message": "You can only edit your own documents"
}
```

### 404 Not Found
```json
{
  "error": "Document not found",
  "message": "The requested document does not exist"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create document",
  "message": "An error occurred while creating the document"
}
```

---

## 特殊功能

### 版本管理
- 每次更新文档内容时，版本号自动递增
- 更新标题或分类不会增加版本号

### 搜索功能
- 支持按标题和内容进行模糊搜索
- 支持按分类和作者筛选
- 支持多字段排序

### 分页功能
- 支持自定义每页数量
- 提供完整的分页信息
- 支持前后页导航

### 关联查询
- 自动包含作者信息
- 支持按作者筛选文档

好的 👍 我来帮你生成一份 **第一版 api-spec.md**，保持清晰的接口文档风格，方便你直接复制到 Cursor 的 `/docs/api-spec.md` 文件保存。

------

~~~markdown
# 🔌 api-spec.md  
**项目名称**：知识库软件（Knowledge Base System）  
**版本**：v1.0  
**日期**：2025-09-26  
**作者**：Xiaohua Zhu  

---

## 1. 概述
本文件定义了知识库软件的 **API 规范**，包括文档管理、用户认证、搜索功能以及后续扩展接口。  
所有接口遵循 **RESTful 风格**，返回数据格式为 **JSON**。  
认证方式采用 **JWT (Bearer Token)**。  

---

## 2. 认证与权限
### 2.1 用户注册
- **URL**: `/api/auth/register`  
- **方法**: `POST`  
- **请求参数**:
```json
{
  "username": "hugh",
  "email": "hugh@example.com",
  "password": "123456"
}
~~~

- **响应**:

```json
{
  "message": "User registered successfully"
}
```

### 2.2 用户登录

- **URL**: `/api/auth/login`
- **方法**: `POST`
- **请求参数**:

```json
{
  "email": "hugh@example.com",
  "password": "123456"
}
```

- **响应**:

```json
{
  "token": "jwt_token_string",
  "expiresIn": 3600
}
```

------

## 3. 文档管理 API

### 3.1 获取所有文档

- **URL**: `/api/docs`
- **方法**: `GET`
- **权限**: 用户登录后可访问
- **响应**:

```json
[
  {
    "id": "123",
    "title": "PRD 文档",
    "category": "需求",
    "updatedAt": "2025-09-26T12:00:00Z"
  }
]
```

### 3.2 获取单个文档

- **URL**: `/api/docs/:id`
- **方法**: `GET`
- **响应**:

```json
{
  "id": "123",
  "title": "PRD 文档",
  "content": "# 内容",
  "updatedAt": "2025-09-26T12:00:00Z"
}
```

### 3.3 创建文档

- **URL**: `/api/docs`
- **方法**: `POST`
- **请求参数**:

```json
{
  "title": "新文档",
  "category": "架构",
  "content": "Markdown 格式内容"
}
```

- **响应**:

```json
{
  "id": "456",
  "message": "Document created successfully"
}
```

### 3.4 更新文档

- **URL**: `/api/docs/:id`
- **方法**: `PUT`
- **请求参数**:

```json
{
  "title": "更新后的文档",
  "content": "新内容"
}
```

- **响应**:

```json
{
  "message": "Document updated successfully"
}
```

### 3.5 删除文档

- **URL**: `/api/docs/:id`
- **方法**: `DELETE`
- **响应**:

```json
{
  "message": "Document deleted successfully"
}
```

------

## 4. 搜索 API

### 4.1 全文搜索

- **URL**: `/api/search`
- **方法**: `GET`
- **参数**:
  - `q`: 搜索关键字
- **示例**:
   `/api/search?q=API`
- **响应**:

```json
[
  {
    "id": "123",
    "title": "API 规范",
    "snippet": "本文件定义了知识库软件的 API 规范",
    "updatedAt": "2025-09-26T12:00:00Z"
  }
]
```

------

## 5. 管理员 API

### 5.1 用户列表

- **URL**: `/api/admin/users`
- **方法**: `GET`
- **权限**: 仅管理员可访问
- **响应**:

```json
[
  {
    "id": "u001",
    "username": "hugh",
    "role": "admin"
  }
]
```

### 5.2 修改用户权限

- **URL**: `/api/admin/users/:id/role`
- **方法**: `PUT`
- **请求参数**:

```json
{
  "role": "developer"
}
```

- **响应**:

```json
{
  "message": "User role updated successfully"
}
```

------

## 6. NLP 模块 API（预留）

### 6.1 问答接口

- **URL**: `/api/nlp/query`
- **方法**: `POST`
- **请求参数**:

```json
{
  "question": "如何创建新文档？"
}
```

- **响应**:

```json
{
  "answer": "在 /api/docs 使用 POST 请求创建新文档"
}
```

------

## 7. 错误码定义

| 错误码 | 描述         |
| ------ | ------------ |
| 400    | 请求参数错误 |
| 401    | 未授权访问   |
| 403    | 权限不足     |
| 404    | 资源不存在   |
| 500    | 服务器错误   |

------

## 8. 附录

- `PRD.md` → 产品需求文档
- `architecture.md` → 系统架构
- `db-schema.md` → 数据库设计
- `CODESTYLE.md` → 编码规范
- `dependencies.md` → 依赖说明

------

✅ **说明**：此 API 规范为第一版，后续会在开发过程中逐步扩展。

```
---

要不要我接着帮你生成 **db-schema.md 的第一版**？这样 `/docs` 里的四大核心文档就齐了。
```
# 🔌 知识库系统 API 规范 v2.0

**项目名称**：知识库软件（Knowledge Base System）  
**版本**：v2.0  
**日期**：2025-10-02  
**作者**：Xiaohua Zhu  
**Base URL**：`http://localhost:3000/api`

---

## 📋 目录

1. [概述](#1-概述)
2. [认证与授权](#2-认证与授权)
3. [用户管理 API](#3-用户管理-api)
4. [文档管理 API](#4-文档管理-api)
5. [IAM 权限系统 API](#5-iam-权限系统-api)
6. [工作组协作 API](#6-工作组协作-api)
7. [搜索 API](#7-搜索-api)
8. [标签管理 API](#8-标签管理-api)
9. [审计日志 API](#9-审计日志-api)
10. [NLP 模块 API](#10-nlp-模块-api)
11. [错误处理](#11-错误处理)
12. [响应格式](#12-响应格式)

---

## 1. 概述

本 API 规范定义了知识库系统的 RESTful 接口，支持：

- ✅ **JWT 认证**：基于 Token 的用户认证
- ✅ **IAM 权限控制**：AWS 风格的细粒度权限管理
- ✅ **工作组协作**：团队协作和文档共享
- ✅ **全文搜索**：基于 PostgreSQL FTS 的文档搜索
- ✅ **审计日志**：完整的操作记录和追踪

### 1.1 认证方式

所有需要认证的接口都需要在请求头中包含 JWT Token：

```http
Authorization: Bearer <jwt_token>
```

### 1.2 响应格式

所有 API 响应都遵循统一的 JSON 格式：

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "timestamp": "2025-10-02T10:30:00Z"
}
```

---

## 2. 认证与授权

### 2.1 用户注册

**POST** `/auth/register`

注册新用户账户。

**请求体：**
```json
{
  "username": "hugh",
  "email": "hugh@example.com",
  "password": "password123"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "username": "hugh",
      "email": "hugh@example.com",
      "role": "user",
      "createdAt": "2025-10-02T10:30:00Z"
    }
  },
  "message": "用户注册成功"
}
```

### 2.2 用户登录

**POST** `/auth/login`

用户登录获取 JWT Token。

**请求体：**
```json
{
  "email": "hugh@example.com",
  "password": "password123"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "username": "hugh",
      "email": "hugh@example.com",
      "role": "user",
      "lastLoginAt": "2025-10-02T10:30:00Z"
    }
  },
  "message": "登录成功"
}
```

### 2.3 增强注册（自动分配权限）

**POST** `/enhanced-auth/register`

注册用户并自动分配默认角色和创建个人工作组。

**请求体：**
```json
{
  "username": "hugh",
  "email": "hugh@example.com",
  "password": "password123"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "username": "hugh",
      "email": "hugh@example.com",
      "role": "user",
      "personalWorkspaceId": "uuid"
    }
  },
  "message": "用户注册成功，已分配默认权限和个人工作空间"
}
```

---

## 3. 用户管理 API

### 3.1 获取用户列表

**GET** `/users`

获取所有用户列表（需要管理员权限）。

**查询参数：**
- `page` (number): 页码，默认 1
- `pageSize` (number): 每页数量，默认 10
- `search` (string): 搜索关键词
- `role` (string): 角色筛选
- `isActive` (boolean): 活跃状态筛选

**响应：**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "username": "hugh",
        "email": "hugh@example.com",
        "role": "user",
        "isActive": true,
        "createdAt": "2025-10-02T10:30:00Z",
        "lastLoginAt": "2025-10-02T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 3.2 获取用户详情

**GET** `/users/:id`

获取指定用户的详细信息。

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "hugh",
    "email": "hugh@example.com",
    "role": "user",
    "isActive": true,
    "roles": [
      {
        "id": "uuid",
        "name": "User",
        "description": "普通用户角色"
      }
    ],
    "createdAt": "2025-10-02T10:30:00Z",
    "updatedAt": "2025-10-02T10:30:00Z"
  }
}
```

### 3.3 创建用户

**POST** `/users`

创建新用户（需要管理员权限）。

**请求体：**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user"
}
```

### 3.4 更新用户

**PUT** `/users/:id`

更新用户信息。

**请求体：**
```json
{
  "username": "updateduser",
  "email": "updated@example.com",
  "role": "editor"
}
```

### 3.5 删除用户

**DELETE** `/users/:id`

删除用户（需要管理员权限）。

---

## 4. 文档管理 API

### 4.1 获取文档列表

**GET** `/docs`

获取文档列表，支持分页、搜索和筛选。

**查询参数：**
- `page` (number): 页码，默认 1
- `pageSize` (number): 每页数量，默认 10
- `search` (string): 搜索关键词
- `category` (string): 分类筛选
- `docType` (string): 文档类型筛选
- `status` (string): 状态筛选
- `author` (string): 作者筛选
- `sortBy` (string): 排序字段
- `sortOrder` (string): 排序方向 (asc/desc)

**响应：**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "uuid",
        "title": "API 规范文档",
        "content": "# API 规范...",
        "summary": "本文档定义了知识库系统的 API 规范",
        "category": "api",
        "docType": "SOP",
        "status": "published",
        "author": {
          "id": "uuid",
          "username": "hugh",
          "email": "hugh@example.com"
        },
        "tags": [
          {
            "id": "uuid",
            "name": "API",
            "color": "#3B82F6"
          }
        ],
        "version": 1,
        "publishedAt": "2025-10-02T10:30:00Z",
        "createdAt": "2025-10-02T10:30:00Z",
        "updatedAt": "2025-10-02T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 4.2 获取文档详情

**GET** `/docs/:id`

获取指定文档的详细信息。

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "API 规范文档",
    "content": "# API 规范\n\n本文档定义了...",
    "summary": "本文档定义了知识库系统的 API 规范",
    "category": "api",
    "docType": "SOP",
    "status": "published",
    "author": {
      "id": "uuid",
      "username": "hugh",
      "email": "hugh@example.com"
    },
    "tags": [
      {
        "id": "uuid",
        "name": "API",
        "color": "#3B82F6"
      }
    ],
    "version": 1,
    "publishedAt": "2025-10-02T10:30:00Z",
    "createdAt": "2025-10-02T10:30:00Z",
    "updatedAt": "2025-10-02T10:30:00Z",
    "permissions": {
      "canEdit": true,
      "canDelete": false,
      "canPublish": false
    }
  }
}
```

### 4.3 创建文档

**POST** `/docs`

创建新文档。

**请求体：**
```json
{
  "title": "新文档标题",
  "content": "# 文档内容\n\n这是文档的 Markdown 内容",
  "summary": "文档摘要",
  "category": "api",
  "docType": "SOP",
  "status": "draft",
  "tagIds": ["uuid1", "uuid2"]
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "新文档标题",
    "status": "draft",
    "version": 1,
    "createdAt": "2025-10-02T10:30:00Z"
  },
  "message": "文档创建成功"
}
```

### 4.4 更新文档

**PUT** `/docs/:id`

更新文档内容。

**请求体：**
```json
{
  "title": "更新后的标题",
  "content": "# 更新后的内容",
  "summary": "更新后的摘要",
  "category": "architecture",
  "docType": "Review",
  "status": "published",
  "tagIds": ["uuid1", "uuid3"]
}
```

### 4.5 删除文档

**DELETE** `/docs/:id`

删除文档（需要相应权限）。

### 4.6 发布文档

**POST** `/docs/:id/publish`

发布文档。

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "published",
    "publishedAt": "2025-10-02T10:30:00Z"
  },
  "message": "文档发布成功"
}
```

### 4.7 归档文档

**POST** `/docs/:id/archive`

归档文档。

### 4.8 获取文档分类

**GET** `/docs/categories`

获取所有可用的文档分类。

**响应：**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "value": "prd",
        "label": "产品需求文档",
        "description": "产品功能需求和技术规格"
      },
      {
        "value": "architecture",
        "label": "架构设计",
        "description": "系统架构和技术选型"
      },
      {
        "value": "api",
        "label": "API 文档",
        "description": "接口规范和调用说明"
      }
    ]
  }
}
```

---

## 5. IAM 权限系统 API

### 5.1 角色管理

#### 获取角色列表

**GET** `/roles`

获取所有角色列表。

**查询参数：**
- `page` (number): 页码
- `pageSize` (number): 每页数量
- `search` (string): 搜索关键词
- `isSystemRole` (boolean): 是否系统角色

**响应：**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "uuid",
        "name": "Administrator",
        "description": "系统管理员，拥有所有权限",
        "isSystemRole": true,
        "policies": [
          {
            "id": "uuid",
            "name": "AdminFullAccess",
            "description": "管理员全权限策略"
          }
        ],
        "userCount": 1,
        "createdAt": "2025-10-02T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 4,
      "totalPages": 1
    }
  }
}
```

#### 创建角色

**POST** `/roles`

创建新角色。

**请求体：**
```json
{
  "name": "ProjectManager",
  "description": "项目经理角色",
  "policyIds": ["uuid1", "uuid2"]
}
```

#### 更新角色

**PUT** `/roles/:id`

更新角色信息。

#### 删除角色

**DELETE** `/roles/:id`

删除角色（不能删除系统角色）。

### 5.2 策略管理

#### 获取策略列表

**GET** `/policies`

获取所有策略列表。

**响应：**
```json
{
  "success": true,
  "data": {
    "policies": [
      {
        "id": "uuid",
        "name": "UserSelfDocPolicy",
        "description": "用户自文档管理策略",
        "document": {
          "Version": "2025-10-02",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": ["docs:Create", "docs:Read", "docs:Update", "docs:Delete"],
              "Resource": ["doc:${user.id}/*"]
            }
          ]
        },
        "isSystemPolicy": true,
        "roleCount": 1,
        "createdAt": "2025-10-02T10:30:00Z"
      }
    ]
  }
}
```

#### 创建策略

**POST** `/policies`

创建新策略。

**请求体：**
```json
{
  "name": "CustomPolicy",
  "description": "自定义策略",
  "document": {
    "Version": "2025-10-02",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["docs:Read"],
        "Resource": ["doc:public/*"]
      }
    ]
  }
}
```

#### 更新策略

**PUT** `/policies/:id`

更新策略内容。

#### 删除策略

**DELETE** `/policies/:id`

删除策略（不能删除系统策略）。

### 5.3 用户角色管理

#### 分配角色给用户

**POST** `/users/:userId/roles`

为用户分配角色。

**请求体：**
```json
{
  "roleId": "uuid",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

#### 移除用户角色

**DELETE** `/users/:userId/roles/:roleId`

移除用户的角色。

---

## 6. 工作组协作 API

### 6.1 工作组管理

#### 获取工作组列表

**GET** `/work-groups`

获取工作组列表。

**查询参数：**
- `page` (number): 页码
- `pageSize` (number): 每页数量
- `search` (string): 搜索关键词
- `isPublic` (boolean): 是否公开
- `status` (string): 状态筛选

**响应：**
```json
{
  "success": true,
  "data": {
    "workGroups": [
      {
        "id": "uuid",
        "name": "开发团队",
        "description": "前端开发团队",
        "creator": {
          "id": "uuid",
          "username": "hugh",
          "email": "hugh@example.com"
        },
        "isPublic": false,
        "status": "active",
        "memberCount": 5,
        "settings": {
          "allowMemberInvite": true,
          "requireApproval": true,
          "defaultPermission": "reader"
        },
        "createdAt": "2025-10-02T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### 创建工作组

**POST** `/work-groups`

创建新工作组。

**请求体：**
```json
{
  "name": "新团队",
  "description": "团队描述",
  "isPublic": false,
  "settings": {
    "allowMemberInvite": true,
    "requireApproval": true,
    "defaultPermission": "reader"
  }
}
```

#### 更新工作组

**PUT** `/work-groups/:id`

更新工作组信息。

#### 删除工作组

**DELETE** `/work-groups/:id`

删除工作组。

### 6.2 成员管理

#### 获取工作组成员

**GET** `/work-groups/:id/members`

获取工作组的所有成员。

**响应：**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "username": "hugh",
          "email": "hugh@example.com"
        },
        "role": "leader",
        "status": "active",
        "joinedAt": "2025-10-02T10:30:00Z",
        "invitedBy": {
          "id": "uuid",
          "username": "admin"
        }
      }
    ]
  }
}
```

#### 邀请成员

**POST** `/work-groups/:id/members`

邀请用户加入工作组。

**请求体：**
```json
{
  "userId": "uuid",
  "role": "member"
}
```

#### 更新成员角色

**PUT** `/work-groups/:id/members/:userId`

更新成员在工作组中的角色。

#### 移除成员

**DELETE** `/work-groups/:id/members/:userId`

从工作组中移除成员。

### 6.3 权限申请

#### 获取权限申请列表

**GET** `/permission-requests`

获取权限申请列表。

**查询参数：**
- `page` (number): 页码
- `pageSize` (number): 每页数量
- `status` (string): 状态筛选
- `requestType` (string): 申请类型筛选

**响应：**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "username": "hugh",
          "email": "hugh@example.com"
        },
        "requestType": "join_group",
        "targetId": "uuid",
        "targetType": "work_group",
        "reason": "希望加入开发团队",
        "status": "pending",
        "reviewedBy": null,
        "reviewedAt": null,
        "reviewNotes": null,
        "createdAt": "2025-10-02T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### 提交权限申请

**POST** `/permission-requests`

提交权限申请。

**请求体：**
```json
{
  "requestType": "join_group",
  "targetId": "uuid",
  "targetType": "work_group",
  "reason": "希望加入开发团队"
}
```

#### 审批权限申请

**PUT** `/permission-requests/:id/review`

审批权限申请。

**请求体：**
```json
{
  "status": "approved",
  "reviewNotes": "申请通过"
}
```

---

## 7. 搜索 API

### 7.1 全文搜索

**GET** `/search`

执行全文搜索。

**查询参数：**
- `q` (string): 搜索关键词
- `page` (number): 页码
- `pageSize` (number): 每页数量
- `category` (string): 分类筛选
- `author` (string): 作者筛选
- `dateFrom` (string): 开始日期
- `dateTo` (string): 结束日期

**响应：**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "title": "API 规范文档",
        "content": "本文档定义了知识库系统的 API 规范...",
        "snippet": "本文档定义了知识库系统的 <mark>API</mark> 规范...",
        "category": "api",
        "author": {
          "id": "uuid",
          "username": "hugh"
        },
        "tags": [
          {
            "id": "uuid",
            "name": "API"
          }
        ],
        "score": 0.95,
        "createdAt": "2025-10-02T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    },
    "searchInfo": {
      "query": "API",
      "totalResults": 1,
      "searchTime": 45
    }
  }
}
```

---

## 8. 标签管理 API

### 8.1 获取标签列表

**GET** `/tags`

获取所有标签列表。

**查询参数：**
- `page` (number): 页码
- `pageSize` (number): 每页数量
- `search` (string): 搜索关键词

**响应：**
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": "uuid",
        "name": "API",
        "description": "API 相关文档",
        "color": "#3B82F6",
        "documentCount": 5,
        "createdBy": {
          "id": "uuid",
          "username": "hugh"
        },
        "createdAt": "2025-10-02T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 8.2 创建标签

**POST** `/tags`

创建新标签。

**请求体：**
```json
{
  "name": "新标签",
  "description": "标签描述",
  "color": "#FF6B6B"
}
```

### 8.3 更新标签

**PUT** `/tags/:id`

更新标签信息。

### 8.4 删除标签

**DELETE** `/tags/:id`

删除标签。

---

## 9. 审计日志 API

### 9.1 获取审计日志

**GET** `/audit-logs`

获取审计日志列表。

**查询参数：**
- `page` (number): 页码
- `pageSize` (number): 每页数量
- `action` (string): 操作类型筛选
- `userId` (string): 用户筛选
- `resourceType` (string): 资源类型筛选
- `dateFrom` (string): 开始日期
- `dateTo` (string): 结束日期

**响应：**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "username": "hugh",
          "email": "hugh@example.com"
        },
        "action": "CREATE_DOCUMENT",
        "resourceType": "document",
        "resourceId": "uuid",
        "details": {
          "title": "新文档",
          "category": "api"
        },
        "ipAddress": "127.0.0.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2025-10-02T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## 10. NLP 模块 API

### 10.1 智能问答

**POST** `/nlp/query`

使用 NLP 技术回答用户问题。

**请求体：**
```json
{
  "question": "如何创建新文档？",
  "context": "用户想要了解文档创建流程"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "answer": "您可以通过以下步骤创建新文档：\n1. 登录系统\n2. 点击'创建文档'按钮\n3. 填写文档标题和内容\n4. 选择分类和标签\n5. 保存文档",
    "confidence": 0.95,
    "sources": [
      {
        "id": "uuid",
        "title": "文档创建指南",
        "relevance": 0.9
      }
    ],
    "processingTime": 1200
  }
}
```

---

## 11. 错误处理

### 11.1 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": {
      "field": "email",
      "reason": "邮箱格式不正确"
    },
    "timestamp": "2025-10-02T10:30:00Z",
    "path": "/api/users",
    "method": "POST"
  }
}
```

### 11.2 错误码定义

| 错误码 | HTTP 状态码 | 描述 |
|--------|-------------|------|
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `UNAUTHORIZED` | 401 | 未授权访问 |
| `FORBIDDEN` | 403 | 权限不足 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 资源冲突 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

### 11.3 常见错误示例

#### 认证失败
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "无效的认证令牌",
    "timestamp": "2025-10-02T10:30:00Z"
  }
}
```

#### 权限不足
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "您没有权限执行此操作",
    "details": {
      "requiredPermission": "docs:Delete",
      "resource": "doc:uuid"
    },
    "timestamp": "2025-10-02T10:30:00Z"
  }
}
```

#### 资源不存在
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "文档不存在",
    "details": {
      "resourceType": "document",
      "resourceId": "uuid"
    },
    "timestamp": "2025-10-02T10:30:00Z"
  }
}
```

---

## 12. 响应格式

### 12.1 成功响应

所有成功的 API 响应都遵循以下格式：

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "timestamp": "2025-10-02T10:30:00Z"
}
```

### 12.2 分页响应

对于支持分页的接口，响应格式如下：

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "查询成功"
}
```

### 12.3 统计响应

对于统计类接口，响应格式如下：

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 100,
      "totalDocuments": 500,
      "totalGroups": 10,
      "activeUsers": 80
    },
    "trends": {
      "userGrowth": [ ... ],
      "documentGrowth": [ ... ]
    }
  },
  "message": "统计数据获取成功"
}
```

---

## 📚 相关文档

- [PRD v2.0](./PRD-v2.md) - 产品需求文档
- [架构设计 v2.0](./architecture-v2.md) - 系统架构文档
- [数据库设计 v2.0](./db-schema-v2.md) - 数据库设计文档
- [部署指南](./deployment.md) - 部署和运维指南

---

✅ **说明**：本 API 规范 v2.0 基于已实施的 IAM 权限系统，反映了当前系统的所有 API 接口和功能。

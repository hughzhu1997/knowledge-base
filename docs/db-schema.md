

------

```markdown
# 🗄 db-schema.md  
**项目名称**：知识库软件（Knowledge Base System）  
**版本**：v1.0  
**日期**：2025-09-26  
**作者**：Xiaohua Zhu  

---

## 1. 概述
本文件定义了知识库软件的数据库设计，包括 **用户、文档、权限、版本记录** 等核心表。  
数据库支持 **MongoDB（文档型存储）** 或 **PostgreSQL（关系型存储）** 两种实现，具体可根据部署需求选择。  

---

## 2. 数据库实体
### 2.1 用户表（Users）
- **集合 / 表名**: `users`  
- **字段定义**:  

| 字段名       | 类型            | 说明 |
|--------------|----------------|------|
| id           | ObjectId / UUID | 用户唯一标识 |
| username     | String         | 用户名 |
| email        | String (唯一)  | 邮箱地址 |
| password     | String (Hash)  | 密码（加密存储） |
| role         | String         | 用户角色（admin / developer / user） |
| createdAt    | DateTime       | 创建时间 |
| updatedAt    | DateTime       | 更新时间 |

---

### 2.2 文档表（Documents）
- **集合 / 表名**: `documents`  
- **字段定义**:  

| 字段名       | 类型            | 说明 |
|--------------|----------------|------|
| id           | ObjectId / UUID | 文档唯一标识 |
| title        | String         | 文档标题 |
| category     | String         | 文档分类（prd / architecture / api / db / code / dependency） |
| content      | Text (Markdown) | 文档内容 |
| authorId     | ObjectId / UUID | 作者用户 ID（外键） |
| version      | Integer        | 当前版本号 |
| createdAt    | DateTime       | 创建时间 |
| updatedAt    | DateTime       | 更新时间 |

---

### 2.3 权限表（Roles / Permissions）
- **集合 / 表名**: `roles`  
- **字段定义**:  

| 字段名       | 类型            | 说明 |
|--------------|----------------|------|
| id           | ObjectId / UUID | 唯一标识 |
| roleName     | String         | 角色名称（admin / developer / user） |
| permissions  | Array[String]  | 权限列表（如：`read`, `write`, `delete`, `manageUsers`） |

---

### 2.4 版本记录表（Revisions / History）
- **集合 / 表名**: `revisions`  
- **字段定义**:  

| 字段名       | 类型            | 说明 |
|--------------|----------------|------|
| id           | ObjectId / UUID | 唯一标识 |
| documentId   | ObjectId / UUID | 文档 ID（外键） |
| version      | Integer        | 版本号 |
| content      | Text (Markdown) | 文档快照内容 |
| updatedBy    | ObjectId / UUID | 修改人 ID |
| updatedAt    | DateTime       | 修改时间 |

---

## 3. 关系图（逻辑模型）
```

Users (1) -------- (N) Documents
 |                    |
 |                    |
 |                 (N) Revisions
 |
 +---- (N) Roles (permissions)

```
---

## 4. 索引与优化
- **Users**
  - `email` 唯一索引  
- **Documents**
  - `title` 普通索引  
  - `category` 普通索引  
- **Revisions**
  - `documentId` 外键索引  
  - `updatedAt` 时间索引  

---

## 5. 未来扩展
- **标签表（Tags）**：支持给文档添加多个标签。  
- **评论表（Comments）**：支持用户在文档下评论。  
- **审计日志（AuditLogs）**：记录用户的关键操作（登录、删除、修改权限）。  

---

## 6. 附录
- `PRD.md` → 产品需求文档  
- `architecture.md` → 系统架构  
- `api-spec.md` → API 规范  
- `CODESTYLE.md` → 编码规范  
- `dependencies.md` → 依赖说明  

---

✅ **说明**：本数据库设计为第一版，后续会根据实际开发需求逐步完善。  
```

------


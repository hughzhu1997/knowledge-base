# 知识库软件 PRD v2.0（IAM 权限系统）

**版本**：v2.0  
**日期**：2025-10-02  
**Owner**：Hugh（产品/验收）  
**Editor**：AI Assistant（文档整理）  
**状态**：已实施（IAM v2.0 权限系统）

---

## 1. 背景 & 目标

- **背景**：搭建一套轻量、可扩展的知识库系统，面向个人与小团队，支持文档的创建/管理/搜索，提供现代化的权限管理系统。
- **本方案**：后端 Node.js + Express，**数据库 PostgreSQL**，ORM 选 **Sequelize**。权限系统采用 **AWS IAM 模型**，支持细粒度权限控制。前端用户界面采用 **React + Vite + TailwindCSS**。
- **目标**：
  1. MVP 内完成文档 CRUD、标签、基础搜索、用户认证与 IAM 权限系统；
  2. 通过现代化前端界面提供「网页管理」；
  3. 为后续语义检索/NLP 预留接口；
  4. 支持工作组协作和权限申请系统。
- **非目标（MVP 不包含）**：富文本协同编辑、外部 SSO、多级审核流、全文检索引擎（可用 Postgres FTS 代替）。

---

## 2. 术语

- **知识条目（Document）**：一篇可被搜索与分类的文档内容。
- **标签（Tag）**：用于聚合与过滤文档的关键词。
- **角色（Role）**：`Administrator`、`Editor`、`User`、`Auditor` 等。
- **策略（Policy）**：IAM 风格的 JSON 权限策略文档。
- **工作组（WorkGroup）**：用户协作的团队单位。
- **权限申请（PermissionRequest）**：用户申请权限提升或加入工作组的流程。

---

## 3. 用户与角色

### 3.1 系统角色
- **Administrator**：系统管理员。拥有所有权限，可管理用户、角色、策略。
- **Editor**：内容编辑者。可创建/更新/删除所有文档；不可访问系统级设置。
- **User**：普通用户。可创建/修改自己的文档；可申请权限提升。
- **Auditor**：审计员。只读权限，可查看所有数据和审计日志。

### 3.2 工作组角色
- **Leader**：工作组负责人，可管理组成员和组内文档。
- **Editor**：组内编辑者，可编辑组内文档。
- **Member**：普通成员，可查看组内文档。

---

## 4. 核心用例（MVP）

### 4.1 用户管理
1. 作为 User，我可以注册账户并获得默认权限（User + PublicReader 角色）。
2. 作为 User，我可以申请加入工作组或申请角色提升。
3. 作为 Administrator，我可以审批权限申请和管理用户角色。

### 4.2 文档管理
1. 作为 Editor，我可以创建/编辑/删除文档，并为其添加多个标签。
2. 作为 User，我可以按关键词/标签/作者搜索文档。
3. 作为任何用户，我可以查看文档详情（若文档为 `published` 或我有权限）。

### 4.3 协作功能
1. 作为 User，我可以创建工作组并邀请其他用户。
2. 作为工作组 Leader，我可以管理组成员和组内文档权限。
3. 作为组成员，我可以查看和编辑组内共享文档。

### 4.4 权限管理
1. 作为 Administrator，我可以创建自定义角色和策略。
2. 作为 Administrator，我可以为用户分配角色和查看权限申请。
3. 作为 User，我可以查看自己的权限和申请状态。

---

## 5. 功能范围

### 5.1 公开 API（REST）

#### 认证与用户管理
- **认证**：注册/登录（邮箱+密码，JWT），刷新 Token。
- **用户管理**：用户信息查看、角色管理、权限申请。

#### 文档管理
- **文档 CRUD**：创建/读取/更新/删除；分页列表；按 `q`/`tag`/`author`/`createdAt` 排序与筛选。
- **文档状态**：`draft`/`published`/`archived`。
- **文档权限**：私有/组内/公开文档权限控制。

#### 标签管理
- **标签 CRUD**：创建/读取/删除；与文档多对多关联。

#### 搜索功能
- **全文搜索**：基于 PostgreSQL FTS 的文档搜索。
- **高级搜索**：按分类、标签、作者、时间范围筛选。

#### IAM 权限系统
- **角色管理**：创建/更新/删除角色。
- **策略管理**：创建/更新/删除 IAM 风格策略。
- **权限检查**：基于策略的细粒度权限验证。

#### 工作组协作
- **工作组管理**：创建/更新/删除工作组。
- **成员管理**：邀请/移除成员，角色分配。
- **权限申请**：申请加入工作组、角色提升等。

### 5.2 前端界面（React + Vite）

#### 用户界面
- **首页**：现代化 SaaS 风格展示页面。
- **登录/注册**：用户认证界面。
- **仪表板**：用户工作台，快速操作入口。

#### 管理界面
- **文档管理**：文档列表、创建、编辑、删除。
- **用户管理**：用户列表、角色分配、权限管理。
- **权限管理**：角色、策略、权限申请管理。
- **标签管理**：标签创建、编辑、删除。

#### 协作界面
- **工作组管理**：工作组创建、成员管理。
- **文档协作**：组内文档共享和协作编辑。

### 5.3 认证与权限（IAM）

#### JWT 认证
- **前台 API**：使用 `Authorization: Bearer <token>`。
- **Token 管理**：自动刷新、过期处理。

#### IAM 权限模型
- **策略存储**：JSONB 格式的 IAM 风格策略。
- **权限检查**：基于 Effect、Action、Resource、Condition。
- **Deny 优先**：Deny 策略优先于 Allow 策略。

### 5.4 搜索（PostgreSQL FTS）

- **全文搜索**：基于 `tsvector` + GIN 索引的 PostgreSQL FTS。
- **搜索优化**：支持拼写纠错、高亮显示。
- **搜索统计**：搜索历史和热门关键词。

### 5.5 版本历史

- **版本记录**：文档更新时写入 `revisions`（内容快照/摘要/操作者）。
- **版本回滚**：支持回滚到历史版本。
- **变更追踪**：详细的变更记录和审计日志。

### 5.6 审核与发布

- **文档状态**：`draft`/`published`/`archived` 状态管理。
- **发布流程**：文档发布和归档操作。
- **权限控制**：基于 IAM 策略的发布权限。

### 5.7 NLP 预留

- **语义搜索**：后端 `/api/nlp/query` 接口预留。
- **AI 问答**：集成大语言模型的问答功能。
- **智能推荐**：基于内容的智能文档推荐。

---

## 6. 数据模型（PostgreSQL + Sequelize）

### 6.1 核心表结构

#### 用户管理
- **users**: 用户基本信息
- **roles**: 角色定义
- **policies**: IAM 风格策略
- **user_roles**: 用户角色关联
- **role_policies**: 角色策略关联

#### 文档管理
- **documents**: 文档内容
- **tags**: 标签定义
- **document_tags**: 文档标签关联
- **revisions**: 版本记录
- **document_permissions**: 文档权限

#### 协作系统
- **work_groups**: 工作组
- **group_members**: 工作组成员
- **permission_requests**: 权限申请
- **audit_logs**: 审计日志

### 6.2 IAM 权限模型

#### 策略示例
```json
{
  "Version": "2025-10-02",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["docs:Create", "docs:Read", "docs:Update", "docs:Delete"],
      "Resource": ["doc:${user.id}/*"]
    },
    {
      "Effect": "Allow",
      "Action": ["docs:Read"],
      "Resource": ["doc:public/*"]
    }
  ]
}
```

---

## 7. API 规范（摘要）

**Base URL**：`/api`

### 7.1 认证
- `POST /auth/register` → { username, email, password }
- `POST /auth/login` → { email, password }
- `POST /enhanced-auth/register` → 注册并分配默认权限

### 7.2 文档管理
- `GET /docs` → 支持 `page, pageSize, q, tag, author, status`
- `POST /docs` → 需要登录；`{title, content, category, docType}`
- `GET /docs/:id`
- `PUT /docs/:id` → 基于 IAM 权限检查
- `DELETE /docs/:id` → 基于 IAM 权限检查

### 7.3 IAM 权限系统
- `GET /roles` → 角色列表
- `POST /roles` → 创建角色
- `GET /policies` → 策略列表
- `POST /policies` → 创建策略

### 7.4 工作组协作
- `GET /work-groups` → 工作组列表
- `POST /work-groups` → 创建工作组
- `GET /permission-requests` → 权限申请列表
- `POST /permission-requests` → 提交权限申请

---

## 8. 安全要求

- **密码**：`bcrypt`（成本 ≥ 12）。
- **JWT**：`HS256`、`exp ≤ 24h`、`JWT_SECRET`。
- **输入校验**：Sequelize 验证 + 中间件校验。
- **限流**：`express-rate-limit`（登录/IP 级）。
- **CORS/Helmet**：最小化暴露。
- **审计**：所有关键操作写入 `audit_logs`。

---

## 9. 非功能性

- **性能**：列表/搜索在 10k 文档量下，P95 ≤ 300ms。
- **可用性**：本地开发单机；生产支持 Docker 化。
- **可维护性**：Sequelize 模型驱动；单元/集成测试覆盖核心路径。
- **扩展性**：支持水平扩展和微服务架构。

---

## 10. 环境与配置

- **运行环境**：Node.js ≥ 18、npm、PostgreSQL ≥ 14。
- **ENV**：
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/knowledge_base`
  - `JWT_SECRET=xxxxx`
  - `PORT=3000`
  - `NODE_ENV=development|production`

---

## 11. 监控与日志

- **应用日志**：结构化日志输出。
- **审计日志**：写 `audit_logs` 表。
- **性能监控**：API 响应时间和错误率监控。

---

## 12. 验收标准（关键场景）

- **注册/登录**：注册成功 → 自动分配默认角色 → 登录返回 `token`。
- **文档 CRUD**：创建成功后可通过 `GET /docs/:id` 读取；更新会写一条 `revisions`。
- **搜索**：`GET /docs?q=abc` 返回标题/内容包含 `abc` 的文档。
- **权限检查**：基于 IAM 策略的细粒度权限验证。
- **工作组协作**：创建工作组 → 邀请成员 → 共享文档。
- **权限申请**：提交申请 → 管理员审批 → 权限生效。

---

## 13. 里程碑 & 交付物

- **M1：IAM 权限系统（已完成）**
  - 交付：IAM 模型、角色策略、权限检查中间件。
- **M2：前端界面（已完成）**
  - 交付：React 前端、用户管理、文档管理界面。
- **M3：工作组协作（已完成）**
  - 交付：工作组管理、成员管理、权限申请系统。
- **M4：文档权限管理（已完成）**
  - 交付：文档权限控制、协作编辑功能。
- **M5：审计和监控（已完成）**
  - 交付：审计日志、操作记录、系统监控。

---

## 14. 发布与版本

- **SemVer**：MAJOR.MINOR.PATCH。
- **当前版本**：v2.0.0（IAM 权限系统）
- **Tag 规范**：`vX.Y.Z`（如 `v2.0.0`）。

---

## 15. 风险与备选

- **风险**：IAM 权限系统复杂度；PostgreSQL 性能优化。
- **备选**：简化权限模型；引入 Redis 缓存优化。

---

## 16. 附录：API 示例

```bash
# 注册用户（自动分配默认权限）
curl -X POST http://localhost:3000/api/enhanced-auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"hugh","email":"hugh@example.com","password":"password123"}'

# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"hugh@example.com","password":"password123"}'

# 创建文档
curl -X POST http://localhost:3000/api/docs \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"title":"API 文档","content":"# API 规范","category":"api","docType":"SOP"}'

# 搜索文档
curl 'http://localhost:3000/api/docs?q=API&page=1&pageSize=10'

# 创建工作组
curl -X POST http://localhost:3000/api/work-groups \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"开发团队","description":"前端开发团队","isPublic":false}'
```

---

✅ **说明**：本 PRD v2.0 基于已实施的 IAM 权限系统，反映了当前系统的实际功能和架构。

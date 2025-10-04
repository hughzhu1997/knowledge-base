# 📚 知识库系统文档中心

**项目名称**：知识库软件（Knowledge Base System）  
**版本**：v2.0  
**日期**：2025-10-02  
**作者**：Xiaohua Zhu

---

## 📋 文档概览

本目录包含了知识库系统的完整技术文档，所有文档都已更新至 v2.0 版本，与当前代码实现保持一致。

### 🆕 最新文档（v2.0）

| 文档 | 文件名 | 状态 | 描述 |
|------|--------|------|------|
| **产品需求文档** | [PRD-v2.md](./PRD-v2.md) | ✅ 已更新 | IAM 权限系统的产品需求 |
| **系统架构文档** | [architecture-v2.md](./architecture-v2.md) | ✅ 已更新 | 完整的技术架构和组件设计 |
| **API 规范文档** | [api-spec-v2.md](./api-spec-v2.md) | ✅ 已更新 | 所有 API 接口的详细规范 |
| **数据库设计文档** | [db-schema-v2.md](./db-schema-v2.md) | ✅ 已更新 | IAM v2.0 数据库模型设计 |

### 📜 历史文档（v1.0）

| 文档 | 文件名 | 状态 | 说明 |
|------|--------|------|------|
| **产品需求文档** | [PRD.md](./PRD.md) | ⚠️ 已过时 | 基于 Prisma + AdminJS 的旧版本 |
| **系统架构文档** | [architecture.md](./architecture.md) | ⚠️ 已过时 | 简单的架构设计 |
| **API 规范文档** | [api-spec.md](./api-spec.md) | ⚠️ 已过时 | 基础的 API 规范 |
| **数据库设计文档** | [db-schema.md](./db-schema.md) | ⚠️ 已过时 | 简单的数据库设计 |

### 🔧 其他文档

| 文档 | 文件名 | 状态 | 描述 |
|------|--------|------|------|
| **IAM 权限模型** | [iam-schema.md](./iam-schema.md) | ✅ 当前 | IAM 权限系统的详细设计 |
| **编码规范** | [CODESTYLE.md](./CODESTYLE.md) | ✅ 当前 | 代码风格和规范 |
| **依赖说明** | [dependencies.md](./dependencies.md) | ✅ 当前 | 项目依赖和版本说明 |

---

## 🚀 快速开始

### 1. 了解系统架构
建议按以下顺序阅读文档：

1. **[PRD-v2.md](./PRD-v2.md)** - 了解产品需求和功能范围
2. **[architecture-v2.md](./architecture-v2.md)** - 理解系统架构和技术选型
3. **[db-schema-v2.md](./db-schema-v2.md)** - 掌握数据库设计和 IAM 模型
4. **[api-spec-v2.md](./api-spec-v2.md)** - 学习 API 接口使用方法

### 2. 开发指南

#### 后端开发
- 参考 [architecture-v2.md](./architecture-v2.md) 了解后端架构
- 查看 [db-schema-v2.md](./db-schema-v2.md) 理解数据模型
- 使用 [api-spec-v2.md](./api-spec-v2.md) 进行 API 开发

#### 前端开发
- 参考 [architecture-v2.md](./architecture-v2.md) 了解前端架构
- 查看 [api-spec-v2.md](./api-spec-v2.md) 进行 API 集成
- 遵循 [CODESTYLE.md](./CODESTYLE.md) 的编码规范

#### 权限系统开发
- 详细阅读 [iam-schema.md](./iam-schema.md) 了解 IAM 模型
- 参考 [db-schema-v2.md](./db-schema-v2.md) 中的权限表设计
- 使用 [api-spec-v2.md](./api-spec-v2.md) 中的权限相关 API

---

## 🔄 文档更新历史

### v2.0 更新（2025-10-02）

#### 主要变更
- ✅ **权限系统升级**：从简单 RBAC 升级到 AWS IAM 模型
- ✅ **技术栈更新**：从 Prisma 迁移到 Sequelize
- ✅ **功能扩展**：新增工作组协作和权限申请系统
- ✅ **架构优化**：前后端分离，现代化技术栈

#### 文档更新内容
1. **PRD-v2.md**
   - 更新产品需求，反映 IAM 权限系统
   - 新增工作组协作功能需求
   - 更新验收标准和里程碑

2. **architecture-v2.md**
   - 完整的技术架构图
   - IAM 权限系统架构设计
   - 前后端模块划分
   - 部署和安全架构

3. **api-spec-v2.md**
   - 所有当前实现的 API 端点
   - IAM 权限相关 API
   - 工作组协作 API
   - 完整的错误处理和响应格式

4. **db-schema-v2.md**
   - IAM v2.0 数据库模型
   - 完整的表结构和关系
   - 索引优化策略
   - 迁移指南

### v1.0 历史（2025-09-26）

- 初始版本，基于 Prisma + AdminJS
- 简单的 RBAC 权限系统
- 基础的文档管理功能

---

## 📊 系统特性

### 🎯 核心功能
- ✅ **专业主页**：现代化产品展示和用户引导
- ✅ **用户管理**：注册、登录、角色管理
- ✅ **文档管理**：创建、编辑、删除、发布
- ✅ **权限控制**：IAM 风格的细粒度权限
- ✅ **工作组协作**：团队协作和文档共享
- ✅ **全文搜索**：基于 PostgreSQL FTS
- ✅ **审计日志**：完整的操作记录

### 🔒 权限系统
- ✅ **AWS IAM 模型**：行业标准的权限设计
- ✅ **细粒度控制**：资源级别的权限管理
- ✅ **动态策略**：JSONB 存储的灵活策略
- ✅ **权限申请**：用户自主申请权限提升

### 🏗️ 技术架构
- ✅ **后端**：Node.js + Express + Sequelize
- ✅ **前端**：React + Vite + TailwindCSS
- ✅ **数据库**：PostgreSQL + JSONB
- ✅ **认证**：JWT + bcryptjs
- ✅ **搜索**：PostgreSQL 全文搜索

---

## 🛠️ 开发环境

### 环境要求
- Node.js ≥ 18.0
- PostgreSQL ≥ 14
- npm 或 yarn

### 快速启动
```bash
# 克隆项目
git clone <repository-url>
cd knowledge-base

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 启动数据库
# 确保 PostgreSQL 运行在 localhost:5432

# 运行数据库迁移
node src/backend/scripts/migrate-to-iam-v2.js

# 启动后端服务
cd src/backend
npm start

# 启动前端服务
cd src/frontend
npm run dev
```

### 访问地址
- **主页**：http://localhost:5173 (专业产品展示页面)
- **前端应用**：http://localhost:5173
- **后端 API**：http://localhost:3000/api
- **API 文档**：http://localhost:3000/api/docs

---

## 📞 支持与反馈

如果您在使用过程中遇到问题或有改进建议，请：

1. 查看相关文档寻找解决方案
2. 检查 [CODESTYLE.md](./CODESTYLE.md) 了解编码规范
3. 参考 [dependencies.md](./dependencies.md) 确认依赖版本
4. 提交 Issue 或 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证，详情请查看 LICENSE 文件。

---

✅ **说明**：所有文档都已更新至 v2.0 版本，与当前代码实现完全一致。建议使用 v2.0 版本的文档进行开发和维护。

# 📖 CHANGELOG

**项目名称**：知识库软件（Knowledge Base System）  
**版本**：v2.0  
**日期**：2025-10-04  
**作者**：Xiaohua Zhu  

---

本文件遵循 [版本管理规范 (VERSIONING.md)](./docs/VERSIONING.md)，采用 **语义化版本 (SemVer)**，记录每次版本发布的主要变更。

---

## [Unreleased]

### Added
- 初始化 CHANGELOG.md
- 待补充新功能

### Fixed
- 待补充修复项

---

## [2.0.0] - 2025-10-02
### Added
- IAM 权限系统（基于 AWS IAM 模型）
- 工作组协作与权限申请功能
- 审计日志模块
- API v2.0 完整规范
- 数据库 Schema v2.0（PostgreSQL + JSONB 策略）
- React + Vite 前端架构

### Changed
- 技术栈从 Prisma + AdminJS 迁移到 Sequelize
- 前后端分离架构改造
- 文档体系更新（PRD、架构、API、DB）

### Removed
- 旧版 RBAC 权限系统
- v1.0 中的 Prisma 依赖

---

## [1.0.0] - 2025-09-26
### Added
- 初始版本，提供基础文档 CRUD
- 简单的 RBAC 权限系统
- Prisma ORM + AdminJS 管理界面
- 基础搜索功能

---

## 📌 说明

- **Added**：新增功能  
- **Changed**：修改或优化  
- **Fixed**：Bug 修复  
- **Removed**：删除功能  

---
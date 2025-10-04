# 🚀 部署与运维指南（Deployment Guide）

**项目名称**：知识库软件（Knowledge Base System）  
**版本**：v2.0  
**日期**：2025-10-04  
**作者**：Xiaohua Zhu  

---

## 1. 部署架构

- **后端**：Node.js + Express  
- **前端**：React + Vite  
- **数据库**：PostgreSQL 14+  
- **缓存**（可选）：Redis  
- **容器化**：Docker / Docker Compose  
- **反向代理**：Nginx  

---

## 2. 环境要求

- Node.js ≥ 18  
- PostgreSQL ≥ 14  
- Docker ≥ 24  
- npm/pnpm/yarn  

---

## 3. 环境变量

在项目根目录创建 `.env` 文件：

```ini
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost:5173

DATABASE_URL=postgresql://user:pass@localhost:5432/knowledge_base
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
# knowledge-base

```markdown
# 📚 Knowledge Base System

一个基于 **Node.js + React** 的知识库软件，支持文档管理、全文搜索、多角色协作，并为未来 NLP 智能问答预留扩展接口。  

---

## ✨ 功能特性
- **文档管理**：支持 Markdown 格式文档，按分类存储  
- **全文搜索**：快速检索文档标题与内容  
- **用户权限**：支持管理员 / 开发者 / 普通用户角色  
- **版本控制**：基于 GitHub 同步文档与代码  
- **扩展接口**：预留 NLP 模块（ChatGPT / Gemini 集成）  

---

## 🏗 技术栈
- **前端**: React + Vite + TailwindCSS  
- **后端**: Node.js + Express  
- **数据库**: MongoDB / PostgreSQL（二选一）  
- **版本管理**: GitHub + GitHub Actions  
- **测试**: Jest  

---

## 📂 项目结构
```

knowledge-base/
 ├── docs/                 # 项目文档
 │   ├── PRD.md            # 产品需求文档
 │   ├── architecture.md   # 系统架构
 │   ├── api-spec.md       # API 规范
 │   ├── db-schema.md      # 数据库设计
 │   ├── CODESTYLE.md      # 编码规范
 │   └── dependencies.md   # 依赖库说明
 ├── src/
 │   ├── backend/          # Node.js + Express 后端
 │   ├── frontend/         # React 前端
 │   └── nlp/              # NLP 模块（预留接口）
 ├── tests/                # 单元测试
 ├── CHANGELOG.md          # 版本更新记录
 ├── CONTRIBUTING.md       # 提交与协作规范
 ├── README.md             # 项目介绍 & 快速启动
 └── package.json          # 项目配置文件

```
---

## 🚀 快速启动

### 1. 克隆项目
```bash
git clone https://github.com/hughzhu1997/knowledge-base.git
cd knowledge-base
```

### 2. 安装依赖

```bash
pnpm install
```

（可替换为 `npm install` 或 `yarn install`）

### 3. 启动开发环境

- 启动后端：

```bash
cd src/backend
pnpm run dev
```

- 启动前端：

```bash
cd src/frontend
pnpm run dev
```

### 4. 打开浏览器

访问：

```
http://localhost:3000
```

------

## 🧩 文档

- [PRD.md](https://chatgpt.com/g/g-p-68d524548a408191a1c7d3045bd59840-vibe-codingzhi-shi-ku-ruan-jian/c/docs/PRD.md) → 产品需求文档
- [architecture.md](https://chatgpt.com/g/g-p-68d524548a408191a1c7d3045bd59840-vibe-codingzhi-shi-ku-ruan-jian/c/docs/architecture.md) → 系统架构
- [api-spec.md](https://chatgpt.com/g/g-p-68d524548a408191a1c7d3045bd59840-vibe-codingzhi-shi-ku-ruan-jian/c/docs/api-spec.md) → API 规范
- [db-schema.md](https://chatgpt.com/g/g-p-68d524548a408191a1c7d3045bd59840-vibe-codingzhi-shi-ku-ruan-jian/c/docs/db-schema.md) → 数据库设计
- [CODESTYLE.md](https://chatgpt.com/g/g-p-68d524548a408191a1c7d3045bd59840-vibe-codingzhi-shi-ku-ruan-jian/c/docs/CODESTYLE.md) → 编码规范
- [dependencies.md](https://chatgpt.com/g/g-p-68d524548a408191a1c7d3045bd59840-vibe-codingzhi-shi-ku-ruan-jian/c/docs/dependencies.md) → 依赖库说明

------

## 🤝 贡献

欢迎通过 Pull Request 或 Issue 贡献代码和文档！
 请参见 [CONTRIBUTING.md](https://chatgpt.com/g/g-p-68d524548a408191a1c7d3045bd59840-vibe-codingzhi-shi-ku-ruan-jian/c/CONTRIBUTING.md)。

------

## 📜 许可证

本项目采用 **MIT License**。

------

✅ **说明**：这是 README.md 第一版，随着开发进度会不断补充。

```
---

要不要我也帮你把 **CHANGELOG.md 的模板**生成功能？这样你就能顺便把版本更新记录补上。
```
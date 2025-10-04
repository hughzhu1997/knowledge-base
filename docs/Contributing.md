

------

```markdown
# 🤝 贡献指南（Contributing Guide）

**项目名称**：知识库软件（Knowledge Base System）  
**版本**：v2.0  
**日期**：2025-10-04  
**作者**：Xiaohua Zhu  

---

## 1. 分支管理

采用 **Git Flow** 模型：

- `main`：生产环境稳定分支（只从 `release/*` 或 `hotfix/*` 合并）  
- `develop`：日常开发分支  
- `feature/*`：新功能开发分支  
- `fix/*`：Bug 修复分支  
- `release/*`：预发布分支，用于版本准备和测试  

---

## 2. 开发规范

- 遵循 [CODESTYLE.md](./CODESTYLE.md) 中的前端、后端、数据库规范  
- 所有提交必须通过 **ESLint + Prettier** 检查  
- 后端必须保证 **单元测试覆盖率 ≥ 80%**  
- 前端组件必须包含基础渲染和交互测试  

---

## 3. Git 提交规范

采用 **Conventional Commits** 风格：

| 类型       | 说明                   |
| ---------- | ---------------------- |
| `feat`     | 新功能                 |
| `fix`      | 修复 Bug               |
| `docs`     | 文档更新               |
| `style`    | 代码格式（不影响逻辑） |
| `refactor` | 重构代码               |
| `test`     | 增加或修改测试         |
| `chore`    | 构建/工具/依赖相关     |

示例：
```

feat(auth): add JWT login API
 fix(docs): correct typo in PRD-v2.md

```
---

## 4. 提交流程

1. Fork 仓库并新建分支（`feature/*` 或 `fix/*`）  
2. 开发并确保 **测试全部通过**  
3. 更新相关文档（如 PRD、API 规范、CHANGELOG）  
4. 提交 Pull Request 到 `develop` 分支  
5. 通过 Review 后合并，并由 Maintainer 负责同步到 `main`  

---

## 5. Issue 规范

- **标题**：简洁、可复现问题  
- **内容模板**：
  - 环境信息（Node.js/浏览器版本/操作系统）  
  - 复现步骤  
  - 期望结果与实际结果  
  - 截图或日志（如有）  
- 使用标签：`bug` / `feature` / `enhancement` / `question`  

---

## 6. 代码评审（Code Review）

- PR 必须由至少 1 名 Reviewer 审核  
- 审核标准：
  - 是否符合 [CODESTYLE.md](./CODESTYLE.md)  
  - 是否有足够测试覆盖  
  - 是否对安全和性能有潜在影响  
  - 是否更新了相关文档  

---

## 7. 文档与版本

- 每次提交新功能或修复必须更新 **CHANGELOG.md**  
- 遵循 [VERSIONING.md](./VERSIONING.md) 进行版本更新与打 Tag  

---

✅ **说明**：本贡献指南适用于知识库系统 v2.0，确保团队协作规范、高效、可追踪。
```

------


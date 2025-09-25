

------

```markdown
# 🤝 CONTRIBUTING.md

感谢你有兴趣为 **Knowledge Base System** 项目做贡献！  
为了让协作更加顺畅，请遵循以下指南。  

---

## 1. 如何贡献
- 通过 **Issue** 提交 Bug 报告或功能建议  
- 通过 **Pull Request (PR)** 提交代码或文档改进  
- 在提交前请确认代码通过 **Lint 检查** 和 **测试用例**  

---

## 2. 分支规范
- **main** → 稳定分支，仅用于发布版本  
- **develop** → 开发分支，合并后进入测试  
- **feature/**xxx → 新功能开发  
- **fix/**xxx → Bug 修复  

示例：
```

feature/search-api
 fix/login-auth

```
---

## 3. 提交规范
使用 **Conventional Commits** 格式：  

| 类型       | 说明 |
|------------|------|
| `feat`     | 新功能 |
| `fix`      | 修复 Bug |
| `docs`     | 文档更新 |
| `style`    | 代码格式（不影响逻辑） |
| `refactor` | 代码重构 |
| `test`     | 增加或修改测试 |
| `chore`    | 构建/工具/依赖相关 |

示例：
```

feat(auth): add JWT authentication
 fix(docs): correct typo in PRD.md

```
---

## 4. 代码风格
请参考项目中的 [CODESTYLE.md](./docs/CODESTYLE.md)：  
- **前端**：React + Vite，使用 ESLint + Prettier  
- **后端**：Node.js + Express，统一使用单引号、2 空格缩进  
- **数据库**：表名/集合名使用小写复数，字段使用 snake_case  

---

## 5. 测试
- 使用 **Jest** 编写单元测试  
- 所有新功能必须包含对应的测试  
- 测试文件放置在 `/tests` 目录，命名规则 `*.test.js`  

---

## 6. PR 提交流程
1. Fork 本仓库并创建分支  
2. 开发并完成测试  
3. 确保 `pnpm lint && pnpm test` 全部通过  
4. 提交 Pull Request 到 `develop` 分支  
5. 由 Maintainer 审核并合并  

---

## 7. 社区规范
- 讨论时保持友好与尊重  
- 提问时请提供 **复现步骤** 与 **日志截图**  
- 避免提交无意义的 PR  

---

✅ **说明**：这是 CONTRIBUTING.md 的第一版，后续会随着团队协作流程逐步完善。  
```

------


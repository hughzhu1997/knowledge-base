

~~~markdown
# ✨ CODESTYLE.md  
**项目名称**：知识库软件（Knowledge Base System）  
**版本**：v1.0  
**日期**：2025-09-26  
**作者**：Xiaohua Zhu  

---

## 1. 总体原则
- 保持代码 **简洁、可读、可维护**。  
- 遵循团队统一的编码风格，避免个人化差异。  
- 在提交代码前，必须通过 **Lint 检查** 与 **单元测试**。  

---

## 2. 前端规范（React + Vite）
### 2.1 文件与目录命名
- 使用 **小写 + 短横线**（kebab-case）  
  - 示例：`user-profile.jsx`  
- 组件文件名使用 **大驼峰**（PascalCase）  
  - 示例：`UserCard.jsx`  

### 2.2 代码风格
- 使用 **ESLint + Prettier** 自动格式化  
- 缩进：`2 空格`  
- 分号：强制使用  
- 引号：统一使用 **单引号 `'`**  
- JSX 属性：多于 3 个时换行  

示例：
```jsx
<UserCard
  name="Hugh"
  email="hugh@example.com"
  role="admin"
/>
~~~

------

## 3. 后端规范（Node.js + Express）

### 3.1 文件与目录命名

- 统一使用 **小写 + 短横线**（kebab-case）

- 控制器、服务、模型按模块划分：

  ```
  /src/backend/controllers/
  /src/backend/services/
  /src/backend/models/
  ```

### 3.2 代码风格

- 缩进：`2 空格`
- 引号：**单引号 `'`**
- 常量：使用 `UPPER_CASE`
- 变量 & 函数：使用 `camelCase`
- 类名：使用 `PascalCase`

示例：

```js
const MAX_RETRIES = 3;

function getUserById(userId) {
  return UserModel.findById(userId);
}
```

------

## 4. 数据库规范

- **MongoDB**: 集合名使用 **复数小写**（如 `users`, `documents`）。
- **PostgreSQL**: 表名使用 **复数小写**（如 `users`, `documents`）。
- 字段名使用 **snake_case**（如 `created_at`）。
- 外键字段命名：`xxx_id`。

------

## 5. Git 提交规范

采用 **Conventional Commits** 风格：

| 类型       | 说明                   |
| ---------- | ---------------------- |
| `feat`     | 新功能                 |
| `fix`      | 修复 Bug               |
| `docs`     | 文档更新               |
| `style`    | 代码格式（不影响逻辑） |
| `refactor` | 代码重构               |
| `test`     | 增加或修改测试         |
| `chore`    | 构建/工具/依赖相关     |

示例：

```
feat(auth): add JWT authentication
fix(docs): correct typo in PRD.md
```

------

## 6. 注释规范

- **函数/方法** 必须写 JSDoc 注释。
- 复杂逻辑必须写行内注释。

示例：

```js
/**
 * 根据用户 ID 获取用户信息
 * @param {string} userId - 用户唯一标识
 * @returns {Promise<User>}
 */
async function getUser(userId) {
  return UserModel.findById(userId);
}
```

------

## 7. 测试规范

- 使用 **Jest** 作为测试框架。
- 测试文件放置在 `/tests` 目录。
- 命名规则：`*.test.js`。

------

## 8. 工具配置

- **ESLint**: 统一代码风格检查
- **Prettier**: 自动格式化
- **Husky + lint-staged**: 提交前自动检查

------

## 9. 附录

- `PRD.md` → 产品需求文档
- `architecture.md` → 系统架构
- `api-spec.md` → API 规范
- `db-schema.md` → 数据库设计
- `dependencies.md` → 依赖说明

------

✅ **说明**：这是第一版代码规范文档，后续会随着团队开发经验逐步完善。

```

```
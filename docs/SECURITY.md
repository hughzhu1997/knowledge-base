`````js

# 🔒 安全策略（Security Policy）

**项目名称**：知识库软件（Knowledge Base System）  
**版本**：v2.0  
**日期**：2025-10-04  
**作者**：Xiaohua Zhu  

---

## 1) 目标与范围

- 保护用户数据的 **机密性、完整性、可用性（CIA）**  
- 防止未授权访问与越权操作  
- 满足最小权限原则（Least Privilege）与可审核性（Auditability）  
- 适用对象：后端 API（Node.js/Express/Sequelize/PostgreSQL）、前端（React/Vite）、运维与部署（Docker/Nginx）

---

## 2) 角色与职责

- **Security Owner（默认：项目 Owner）**：批准安全策略、漏洞处置优先级  
- **Backend Lead**：落地服务端安全与数据保护  
- **Frontend Lead**：前端安全（XSS、防点击劫持、CSP）  
- **DevOps**：密钥管理、备份/恢复、日志与监控  
- **All Contributors**：遵守本策略与安全编码规范

---

## 3) 威胁建模（STRIDE 简表）

| 分类 | 典型风险 | 缓解措施 |
|---|---|---|
| Spoofing | 伪造身份、盗用 Token | 强 JWT 校验、短期 Token、IP/UA 审计、MFA（可选） |
| Tampering | 请求/响应被篡改 | HTTPS/TLS、签名 Token、数据库最小权限 |
| Repudiation | 否认操作 | 审计日志 `audit_logs` 全链路记录 |
| Information Disclosure | 数据泄露 | 字段加密、最小化响应字段、脱敏日志 |
| DoS | 暴力请求、爬虫 | 速率限制、WAF、缓存、指数退避 |
| Elevation of Privilege | 越权 | IAM 策略、Deny 优先、细粒度资源检查 |

---

## 4) 认证与授权

### 4.1 JWT
- 算法 **HS256**，有效期 ≤ **24h**，支持 Refresh（可选）  
- Token 仅通过 `Authorization: Bearer <token>` 传递  
- 服务端校验：签名、过期、受众（aud）、发行方（iss）、唯一 ID（jti）

### 4.2 密码策略
- `bcrypt` 成本系数 ≥ **12**  
- 禁止明文存储；禁止可逆加密  
- 登录失败 **5 次锁定 15 分钟**（可配置）

### 4.3 授权（IAM）
- 采用 **AWS IAM 风格策略**（Allow/Deny/Action/Resource/Condition）  
- **Deny 优先**；默认拒绝  
- 资源级别匹配（`doc:${user.id}/*`、`doc:public/*`）  
- 所有关键路径接入 **IAM 中间件** 与 **策略评估引擎**

---

## 5) 应用层安全（Express 参考代码）

```js
// 安全中间件
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    },
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // 视情况调整
  standardHeaders: true,
  legacyHeaders: false,
}));
````

* **输入校验**：使用 `zod`/`joi`/`celebrate` 做 DTO 校验
* **SQL 注入**：只用 Sequelize 参数化查询；禁用拼接 SQL
* **错误处理**：统一错误中间件，隐藏栈与内部细节（记录到服务端日志即可）

---

## 6) 前端安全（React）

* 默认启用 **CSP**，阻止内联脚本；避免 `dangerouslySetInnerHTML`
* 输出到 DOM 前统一 **转义**（高亮搜索片段时尤其注意）
* 路由跳转做 **开放重定向** 校验（仅允许站内白名单）
* 防点击劫持：后端 `X-Frame-Options: DENY`（helmet 已覆盖）
* 表单与重要操作确认弹窗，降低误操作风险

---

## 7) 数据安全与隐私

* **最小化存取**：响应只返回必要字段（隐藏邮箱、IP 等可识别信息）
* **字段加密**（如必要）：密钥轮换策略（KMS/ENV 分层）
* **备份与恢复**：PostgreSQL 每日全量、每小时增量；**保留 ≥ 30 天**
* **数据保留**：审计日志保留 ≥ 1 年（可配置），过期清理脚本定期执行
* **删除/归档**：遵循业务保留策略与法规请求（用户删除与导出可选）

---

## 8) 数据库与基础设施

* PostgreSQL 仅对应用网段开放；**禁止公网直连**
* 账户按最小权限创建：应用用户无 `SUPERUSER`/DDL 权限
* 严格使用 **参数化查询**；为高频查询创建索引（见 `db-schema-v2.md`）
* Docker：使用最小镜像、只读文件系统（可选）、非 root 运行
* Nginx：强制 HTTPS，HSTS、TLS1.2+、安全套件

**Nginx TLS 片段示例：**

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 9) 审计与日志

* 表 `audit_logs`：记录 **谁** 在 **何时** 对 **什么资源** 做了 **什么操作**（含 IP/UA/详情 JSON）
* 日志分类：访问日志、错误日志、业务日志、审计日志
* 敏感信息（密码、Token、密钥）在日志里 **绝不打印**
* 监控：登录失败次数、403 拒绝次数、5xx 比例、慢查询

---

## 10) 漏洞与依赖管理

* 依赖升级：每两周检查一次 `npm audit` / Renovate（建议启用）
* 禁止使用来源不明的依赖与脚本
* 发现高危漏洞：**24 小时内处置**，必要时回滚
* CVE 跟踪：记录在项目 Issue/看板

---

## 11) 事件响应（Runbook）

1. **发现**：告警/用户反馈/日志异常
2. **分级**：P1（大面积不可用/泄露）、P2（范围受限）、P3（低风险）
3. **响应**：隔离节点、封禁入口、撤销密钥、限流/下线功能
4. **补救**：修复代码/配置、数据核对与补偿、补打审计
5. **复盘**：根因分析、行动项、时间线沉淀到文档
6. **通告**：必要时告知受影响用户（合规要求）

---

## 12) 安全测试（与 TESTING.md 配合）

* 覆盖关键路径：认证、权限检查、文档 CRUD、搜索、发布/归档
* **权限回归**：创建者/编辑者/管理员/审计员等角色矩阵测试
* 恶意输入：超长、边界、特殊字符、SQL 关键字、HTML 片段
* E2E：常见越权场景（访问私有文档、跨组资源）

---

## 13) 环境与密钥管理

### 13.1 `.env.example`

```ini
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://app.example.com

DATABASE_URL=postgresql://kb_user:kb_pass@db:5432/knowledge_base
JWT_SECRET=please-change-me
BCRYPT_COST=12

REDIS_URL=redis://redis:6379
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
```

### 13.2 原则

* `.env` **不入库**；在 CI/CD 中注入
* 生产密钥与测试密钥严格隔离；密钥定期轮换
* 访问控制：只授予运行所需的最小读权限

---

## 14) 合规与隐私（可选）

* 按需对齐 **GDPR/澳新隐私原则**：最小化收集、可导出/删除、用途限定
* 第三方共享需在隐私声明中披露（如邮件服务）

---

## 15) 清单（Go-Live 前检查）

* [ ] 所有受保护路由启用 **JWT + IAM**
* [ ] Helmet/CORS/Rate-Limit 已启用并验证
* [ ] 关键表/接口最小化字段返回；日志脱敏
* [ ] 审计日志可追溯至用户/资源/时间/动作
* [ ] 备份/恢复演练通过；灾备文档可用
* [ ] CI：测试覆盖率 ≥ **80%** 且全绿
* [ ] 依赖安全扫描通过；无高危 CVE
* [ ] HTTPS 与 TLS 配置验证通过（含 HSTS）

---

✅ **说明**：本 `SECURITY.md` 与 `PRD-v2.md`、`architecture-v2.md`、`db-schema-v2.md`、`api-spec-v2.md`、`TESTING.md` 协同使用，用于指导设计、开发、部署与日常运维中的安全实践。

```

---

需要的话，我也可以顺手把上面提到的 **Express 统一错误处理模板**、**Zod/Joi 校验样例**、或 **Sequelize 权限检查伪代码**补上一段，方便你直接粘到代码里用。
```

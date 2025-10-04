# IAM 权限管理系统数据库设计

## 表结构设计

### 1. Users 表 (用户表)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Roles 表 (角色表)
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false, -- 系统角色不可删除
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Policies 表 (策略表)
```sql
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    policy_document JSONB NOT NULL, -- IAM 策略文档
    version VARCHAR(10) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. UserRoles 表 (用户角色关联表)
```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- 角色过期时间，NULL 表示永不过期
    UNIQUE(user_id, role_id)
);
```

### 5. RolePolicies 表 (角色策略关联表)
```sql
CREATE TABLE role_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, policy_id)
);
```

## 策略文档格式 (Policy Document)

### 基本结构
```json
{
  "Version": "1.0",
  "Statement": [
    {
      "Effect": "Allow|Deny",
      "Action": ["service:action"],
      "Resource": ["resource_pattern"],
      "Condition": {
        "condition_key": "condition_value"
      }
    }
  ]
}
```

### 示例策略

#### 1. 文档管理策略
```json
{
  "Version": "1.0",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "docs:Create",
        "docs:Read",
        "docs:Update",
        "docs:Delete"
      ],
      "Resource": ["docs/*"]
    }
  ]
}
```

#### 2. 用户管理策略
```json
{
  "Version": "1.0",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "users:Read",
        "users:Create",
        "users:Update",
        "users:Delete"
      ],
      "Resource": ["users/*"]
    }
  ]
}
```

#### 3. 只读策略
```json
{
  "Version": "1.0",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "docs:Read",
        "users:Read"
      ],
      "Resource": ["*"]
    }
  ]
}
```

#### 4. 条件策略 (只能编辑自己的文档)
```json
{
  "Version": "1.0",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "docs:Read",
        "docs:Update",
        "docs:Delete"
      ],
      "Resource": ["docs/*"],
      "Condition": {
        "StringEquals": {
          "docs:author_id": "${user.id}"
        }
      }
    }
  ]
}
```

## 权限检查逻辑

### 1. 权限评估顺序
1. 收集用户的所有角色
2. 收集角色的所有策略
3. 按 Deny > Allow 的优先级评估
4. 默认拒绝 (Default Deny)

### 2. 资源匹配规则
- `*` 匹配所有资源
- `docs/*` 匹配所有文档
- `docs/123` 匹配特定文档
- `users/${user.id}` 匹配当前用户

### 3. 条件评估
- `StringEquals`: 字符串相等
- `StringLike`: 字符串模式匹配
- `NumericEquals`: 数值相等
- `DateEquals`: 日期相等


#!/usr/bin/env node

// migrate-to-iam-v2.js
// 迁移到 IAM v2.0 数据库结构

const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function migrateToIAMV2() {
  try {
    console.log('🚀 开始迁移到 IAM v2.0 数据库结构...\n');

    // 1. 备份现有数据
    console.log('📦 备份现有数据...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users_backup AS 
      SELECT * FROM users
    `);
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS documents_backup AS 
      SELECT * FROM documents
    `);
    console.log('✅ 数据备份完成');

    // 2. 创建新的表结构
    console.log('\n🏗️ 创建新的表结构...');

    // 创建标签表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建文档标签关联表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS document_tags (
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (document_id, tag_id)
      )
    `);

    // 创建版本记录表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS revisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        title VARCHAR(200),
        content TEXT,
        summary TEXT,
        change_summary TEXT,
        updated_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建角色表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        is_system_role BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建策略表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        document JSONB NOT NULL,
        is_system_policy BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建用户角色关联表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        assigned_by UUID REFERENCES users(id),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        PRIMARY KEY (user_id, role_id)
      )
    `);

    // 创建角色策略关联表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS role_policies (
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id, policy_id)
      )
    `);

    // 创建工作组表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS work_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        creator_id UUID NOT NULL REFERENCES users(id),
        is_public BOOLEAN DEFAULT false,
        settings JSONB DEFAULT '{"allowMemberInvite": true, "requireApproval": true, "defaultPermission": "reader"}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建工作组成员表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES work_groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader', 'editor', 'member')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'rejected')),
        joined_at TIMESTAMP,
        invited_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, user_id)
      )
    `);

    // 创建权限申请表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS permission_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('join_group', 'role_upgrade', 'special_permission', 'document_access')),
        target_id UUID,
        target_type VARCHAR(50),
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMP,
        review_notes TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建文档权限表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS document_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        group_id UUID REFERENCES work_groups(id) ON DELETE CASCADE,
        permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('owner', 'collaborator', 'reader')),
        granted_by UUID NOT NULL REFERENCES users(id),
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        CHECK ((user_id IS NOT NULL AND group_id IS NULL) OR (user_id IS NULL AND group_id IS NOT NULL))
      )
    `);

    // 创建审计日志表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(50) NOT NULL,
        resource_type VARCHAR(50),
        resource_id UUID,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ 新表结构创建完成');

    // 3. 创建索引
    console.log('\n📊 创建索引...');

    const indexes = [
      // 用户表索引
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)',
      
      // 文档表索引
      'CREATE INDEX IF NOT EXISTS idx_documents_author ON documents(author_id)',
      'CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)',
      'CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)',
      'CREATE INDEX IF NOT EXISTS idx_documents_visibility ON documents(visibility)',
      
      // 标签表索引
      'CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)',
      
      // 角色表索引
      'CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name)',
      'CREATE INDEX IF NOT EXISTS idx_roles_system ON roles(is_system_role)',
      
      // 策略表索引
      'CREATE INDEX IF NOT EXISTS idx_policies_name ON policies(name)',
      'CREATE INDEX IF NOT EXISTS idx_policies_system ON policies(is_system_policy)',
      'CREATE INDEX IF NOT EXISTS idx_policies_document ON policies USING gin(document)',
      
      // 用户角色关联表索引
      'CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id)',
      
      // 工作组表索引
      'CREATE INDEX IF NOT EXISTS idx_work_groups_creator ON work_groups(creator_id)',
      'CREATE INDEX IF NOT EXISTS idx_work_groups_public ON work_groups(is_public)',
      
      // 工作组成员表索引
      'CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id)',
      'CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status)',
      
      // 权限申请表索引
      'CREATE INDEX IF NOT EXISTS idx_permission_requests_user ON permission_requests(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_permission_requests_status ON permission_requests(status)',
      
      // 文档权限表索引
      'CREATE INDEX IF NOT EXISTS idx_document_permissions_document ON document_permissions(document_id)',
      'CREATE INDEX IF NOT EXISTS idx_document_permissions_user ON document_permissions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_document_permissions_active ON document_permissions(is_active)',
      
      // 审计日志表索引
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)'
    ];

    for (const indexQuery of indexes) {
      await sequelize.query(indexQuery);
    }

    console.log('✅ 索引创建完成');

    // 4. 插入默认数据
    console.log('\n📝 插入默认数据...');

    // 插入默认角色
    await sequelize.query(`
      INSERT INTO roles (name, description, is_system_role) VALUES
      ('Administrator', '系统管理员，拥有所有权限', true),
      ('Editor', '内容编辑者，可以管理所有文档', true),
      ('User', '普通用户，可以管理自己的文档', true),
      ('Auditor', '审计员，只读权限', true)
      ON CONFLICT (name) DO NOTHING
    `);

    // 插入默认策略
    await sequelize.query(`
      INSERT INTO policies (name, description, document, is_system_policy) VALUES
      ('AdminFullAccess', '管理员全权限策略', '{
        "Version": "2025-10-02",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": ["*"],
            "Resource": ["*"]
          }
        ]
      }', true),
      ('UserSelfDocPolicy', '用户自文档管理策略', '{
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
      }', true),
      ('EditorDocPolicy', '编辑者文档管理策略', '{
        "Version": "2025-10-02",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": ["docs:Create", "docs:Read", "docs:Update", "docs:Delete"],
            "Resource": ["doc/*"]
          }
        ]
      }', true),
      ('AuditorReadOnly', '审计员只读策略', '{
        "Version": "2025-10-02",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": ["docs:Read", "users:Read", "audit:Read"],
            "Resource": ["*"]
          }
        ]
      }', true)
      ON CONFLICT (name) DO NOTHING
    `);

    // 关联角色和策略
    await sequelize.query(`
      INSERT INTO role_policies (role_id, policy_id) 
      SELECT r.id, p.id FROM roles r, policies p 
      WHERE r.name = 'Administrator' AND p.name = 'AdminFullAccess'
      ON CONFLICT DO NOTHING
    `);

    await sequelize.query(`
      INSERT INTO role_policies (role_id, policy_id) 
      SELECT r.id, p.id FROM roles r, policies p 
      WHERE r.name = 'User' AND p.name = 'UserSelfDocPolicy'
      ON CONFLICT DO NOTHING
    `);

    await sequelize.query(`
      INSERT INTO role_policies (role_id, policy_id) 
      SELECT r.id, p.id FROM roles r, policies p 
      WHERE r.name = 'Editor' AND p.name = 'EditorDocPolicy'
      ON CONFLICT DO NOTHING
    `);

    await sequelize.query(`
      INSERT INTO role_policies (role_id, policy_id) 
      SELECT r.id, p.id FROM roles r, policies p 
      WHERE r.name = 'Auditor' AND p.name = 'AuditorReadOnly'
      ON CONFLICT DO NOTHING
    `);

    // 为现有用户分配默认角色
    await sequelize.query(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT u.id, r.id 
      FROM users u, roles r 
      WHERE r.name = 'User'
      ON CONFLICT DO NOTHING
    `);

    // 为管理员用户分配管理员角色
    await sequelize.query(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT u.id, r.id 
      FROM users u, roles r 
      WHERE u.role = 'admin' AND r.name = 'Administrator'
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ 默认数据插入完成');

    // 5. 验证迁移结果
    console.log('\n🔍 验证迁移结果...');

    const results = await Promise.all([
      sequelize.query('SELECT COUNT(*) as count FROM users', { type: QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM documents', { type: QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM roles', { type: QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM policies', { type: QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM user_roles', { type: QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM role_policies', { type: QueryTypes.SELECT })
    ]);

    console.log('📊 迁移结果统计:');
    console.log(`   👥 用户数量: ${results[0][0].count}`);
    console.log(`   📄 文档数量: ${results[1][0].count}`);
    console.log(`   👤 角色数量: ${results[2][0].count}`);
    console.log(`   📋 策略数量: ${results[3][0].count}`);
    console.log(`   🔗 用户角色关联: ${results[4][0].count}`);
    console.log(`   🔗 角色策略关联: ${results[5][0].count}`);

    console.log('\n🎉 IAM v2.0 数据库迁移完成！');
    console.log('\n📋 新功能可用:');
    console.log('   ✅ AWS IAM 风格权限模型');
    console.log('   ✅ 细粒度权限控制');
    console.log('   ✅ 工作组协作系统');
    console.log('   ✅ 权限申请系统');
    console.log('   ✅ 文档权限管理');
    console.log('   ✅ 审计日志记录');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateToIAMV2().catch(console.error);
}

module.exports = { migrateToIAMV2 };

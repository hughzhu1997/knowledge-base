#!/usr/bin/env node

// seed_test_user.js
// 创建测试用户脚本，用于验证IAM权限系统

const { sequelize } = require('../config/database');
const { User, Role, UserRole } = require('../models');
const bcrypt = require('bcryptjs');

async function seedTestUser() {
  try {
    console.log('🌱 开始创建测试用户...\n');

    // 1. 确保数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 2. 检查是否已存在测试用户
    const existingUser = await User.findOne({ where: { email: 'testuser@test.com' } });
    if (existingUser) {
      console.log('⚠️  测试用户已存在，跳过创建');
      console.log(`   用户ID: ${existingUser.id}`);
      console.log(`   用户名: ${existingUser.username}`);
      console.log(`   邮箱: ${existingUser.email}`);
      
      // 显示当前角色
      const userRoles = await UserRole.findAll({
        where: { userId: existingUser.id },
        include: [{ model: Role, as: 'role' }]
      });
      
      console.log('   当前角色:');
      userRoles.forEach(ur => {
        console.log(`     - ${ur.role.name} (${ur.role.description})`);
      });
      
      return;
    }

    // 3. 创建测试用户
    console.log('👤 创建测试用户...');
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    const testUser = await User.create({
      username: 'testuser',
      email: 'testuser@test.com',
      password: hashedPassword,
      role: 'user', // 保留legacy字段
      isActive: true
    });
    
    console.log(`✅ 用户创建成功:`);
    console.log(`   ID: ${testUser.id}`);
    console.log(`   用户名: ${testUser.username}`);
    console.log(`   邮箱: ${testUser.email}`);

    // 4. 获取默认角色
    console.log('\n🔍 查找默认角色...');
    const userRole = await Role.findOne({ where: { name: 'User' } });
    const publicReaderRole = await Role.findOne({ where: { name: 'PublicReader' } });

    if (!userRole) {
      console.log('❌ 未找到 "User" 角色，请先运行 init-iam.js');
      return;
    }

    if (!publicReaderRole) {
      console.log('❌ 未找到 "PublicReader" 角色，请先运行 init-iam.js');
      return;
    }

    // 5. 分配默认角色
    console.log('🎭 分配默认角色...');
    
    // 分配 User 角色
    await UserRole.create({
      userId: testUser.id,
      roleId: userRole.id,
      assignedBy: null, // 系统分配
      assignedAt: new Date(),
      expiresAt: null // 永不过期
    });
    console.log(`   ✅ 已分配角色: ${userRole.name}`);

    // 分配 PublicReader 角色
    await UserRole.create({
      userId: testUser.id,
      roleId: publicReaderRole.id,
      assignedBy: null, // 系统分配
      assignedAt: new Date(),
      expiresAt: null // 永不过期
    });
    console.log(`   ✅ 已分配角色: ${publicReaderRole.name}`);

    // 6. 验证角色分配
    console.log('\n🔍 验证角色分配...');
    const assignedRoles = await UserRole.findAll({
      where: { userId: testUser.id },
      include: [{ model: Role, as: 'role' }]
    });

    console.log('📋 用户角色列表:');
    assignedRoles.forEach(ur => {
      console.log(`   - ${ur.role.name}: ${ur.role.description}`);
    });

    // 7. 显示登录信息
    console.log('\n🎉 测试用户创建完成！');
    console.log('='.repeat(50));
    console.log('📧 邮箱: testuser@test.com');
    console.log('🔑 密码: 123456');
    console.log('👤 默认角色: User, PublicReader');
    console.log('='.repeat(50));
    console.log('\n💡 测试步骤:');
    console.log('1. 使用上述凭据登录系统');
    console.log('2. 验证只能操作自己的文档');
    console.log('3. 在admin界面切换角色为editor');
    console.log('4. 验证可以操作所有文档');
    console.log('5. 切换角色为admin');
    console.log('6. 验证可以管理用户');

  } catch (error) {
    console.error('❌ 创建测试用户失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedTestUser().catch(console.error);
}

module.exports = { seedTestUser };

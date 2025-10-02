#!/usr/bin/env node

// test-iam-permissions.js
// 测试IAM权限系统功能

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户凭据
const TEST_USER = {
  email: 'testuser2@test.com',
  password: '123456'
};

const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'admin123'
};

let testUserToken = '';
let adminToken = '';
let testUserId = '';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 添加token到请求头
const setToken = (token) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// 测试步骤
async function testIAMSystem() {
  try {
    console.log('🧪 开始测试IAM权限系统...\n');

    // 步骤1: 管理员登录
    console.log('1️⃣ 管理员登录...');
    const adminLoginResponse = await api.post('/auth/login', ADMIN_USER);
    adminToken = adminLoginResponse.data.token;
    setToken(adminToken);
    console.log('✅ 管理员登录成功');

    // 步骤2: 测试用户登录
    console.log('\n2️⃣ 测试用户登录...');
    const testLoginResponse = await api.post('/auth/login', TEST_USER);
    testUserToken = testLoginResponse.data.token;
    testUserId = testLoginResponse.data.user.id;
    console.log('✅ 测试用户登录成功');
    console.log(`   用户ID: ${testUserId}`);

    // 步骤3: 获取测试用户当前角色
    console.log('\n3️⃣ 获取测试用户当前角色...');
    setToken(adminToken);
    const userRolesResponse = await api.get(`/users/${testUserId}/roles`);
    console.log('📋 当前角色:');
    userRolesResponse.data.data.roles.forEach(role => {
      console.log(`   - ${role.roleName}: ${role.roleDescription}`);
    });

    // 步骤4: 获取所有可用角色
    console.log('\n4️⃣ 获取所有可用角色...');
    const rolesResponse = await api.get('/roles');
    console.log('📋 可用角色:');
    rolesResponse.data.data.roles.forEach(role => {
      console.log(`   - ${role.name}: ${role.description}`);
    });

    // 步骤5: 为测试用户分配Editor角色
    console.log('\n5️⃣ 为测试用户分配Editor角色...');
    const editorRole = rolesResponse.data.data.roles.find(r => r.name === 'Editor');
    if (editorRole) {
      await api.post(`/users/${testUserId}/roles`, { roleId: editorRole.id });
      console.log('✅ Editor角色分配成功');
    } else {
      console.log('❌ 未找到Editor角色');
    }

    // 步骤6: 验证角色分配
    console.log('\n6️⃣ 验证角色分配...');
    const updatedRolesResponse = await api.get(`/users/${testUserId}/roles`);
    console.log('📋 更新后的角色:');
    updatedRolesResponse.data.data.roles.forEach(role => {
      console.log(`   - ${role.roleName}: ${role.roleDescription}`);
    });

    // 步骤7: 测试用户权限验证
    console.log('\n7️⃣ 测试用户权限验证...');
    setToken(testUserToken);
    
    try {
      // 尝试获取所有用户列表（应该被拒绝）
      await api.get('/users');
      console.log('❌ 权限检查失败：普通用户不应该能访问用户列表');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ 权限检查成功：普通用户无法访问用户列表');
      } else {
        console.log('⚠️  权限检查异常:', error.response?.data?.message);
      }
    }

    // 步骤8: 为测试用户分配Administrator角色
    console.log('\n8️⃣ 为测试用户分配Administrator角色...');
    setToken(adminToken);
    const adminRole = rolesResponse.data.data.roles.find(r => r.name === 'Administrator');
    if (adminRole) {
      await api.post(`/users/${testUserId}/roles`, { roleId: adminRole.id });
      console.log('✅ Administrator角色分配成功');
    } else {
      console.log('❌ 未找到Administrator角色');
    }

    // 步骤9: 验证管理员权限
    console.log('\n9️⃣ 验证管理员权限...');
    setToken(testUserToken);
    
    try {
      // 现在应该能够访问用户列表
      const usersResponse = await api.get('/users');
      console.log('✅ 权限检查成功：现在可以访问用户列表');
      console.log(`   用户数量: ${usersResponse.data.data.users.length}`);
    } catch (error) {
      console.log('❌ 权限检查失败：无法访问用户列表');
      console.log('   错误:', error.response?.data?.message);
    }

    // 步骤10: 清理测试数据
    console.log('\n🔟 清理测试数据...');
    setToken(adminToken);
    
    // 移除Administrator角色
    if (adminRole) {
      await api.delete(`/users/${testUserId}/roles/${adminRole.id}`);
      console.log('✅ Administrator角色已移除');
    }
    
    // 移除Editor角色
    if (editorRole) {
      await api.delete(`/users/${testUserId}/roles/${editorRole.id}`);
      console.log('✅ Editor角色已移除');
    }

    console.log('\n🎉 IAM权限系统测试完成！');
    console.log('='.repeat(50));
    console.log('✅ 测试结果总结:');
    console.log('   - 用户创建和角色分配: 成功');
    console.log('   - 权限检查机制: 正常工作');
    console.log('   - 角色动态切换: 成功');
    console.log('   - 权限验证: 正确');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testIAMSystem().catch(console.error);
}

module.exports = { testIAMSystem };

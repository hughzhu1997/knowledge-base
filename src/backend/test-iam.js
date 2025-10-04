#!/usr/bin/env node

import db from './models/index.js';

const testIAM = async () => {
  try {
    console.log('🧪 === IAM中间件测试 ===\n');
    
    // 获取用户
    const user = await db.User.findOne({
      where: { email: 'newuser@knowledge-base.com' },
      include: [
        {
          model: db.Role,
          as: 'roles',
          include: [
            {
              model: db.Policy,
              as: 'policies'
            }
          ]
        }
      ]
    });
    
    if (!user) {
      console.log('❌ 未找到测试用户');
      return;
    }
    
    console.log(`👤 用户: ${user.username} (${user.id})`);
    console.log(`📋 角色: ${user.roles.map(r => r.name).join(', ')}`);
    
    // 获取策略
    const policies = [];
    user.roles.forEach(role => {
      role.policies.forEach(policy => {
        policies.push(policy);
      });
    });
    
    console.log(`📋 策略数量: ${policies.length}`);
    
    // 测试策略评估
    const testCases = [
      { action: 'docs:Read', resource: 'doc:public/test-doc', expected: 'Allow' },
      { action: 'docs:Read', resource: `doc:${user.id}/my-doc`, expected: 'Allow' },
      { action: 'docs:Read', resource: 'doc:other-user/doc', expected: 'Deny' },
      { action: 'system:Manage', resource: '*', expected: 'Deny' }
    ];
    
    console.log('\n🧪 测试案例:');
    
    for (const testCase of testCases) {
      console.log(`\n📋 测试: ${testCase.action} on ${testCase.resource}`);
      
      // 模拟策略评估
      let explicitDeny = false;
      let explicitAllow = false;
      
      for (const policy of policies) {
        const policyDoc = policy.document;
        if (!policyDoc || !policyDoc.Statement) continue;
        
        const statements = Array.isArray(policyDoc.Statement) 
          ? policyDoc.Statement 
          : [policyDoc.Statement];
        
        for (const statement of statements) {
          const { Effect, Action, Resource } = statement;
          
          // 检查动作匹配
          const actions = Array.isArray(Action) ? Action : [Action];
          const actionMatch = actions.some(a => {
            if (a === '*') return true;
            if (a === testCase.action) return true;
            if (a.includes('*')) {
              const regex = new RegExp(`^${a.replace(/\*/g, '.*')}$`);
              return regex.test(testCase.action);
            }
            return false;
          });
          
          if (!actionMatch) continue;
          
          // 检查资源匹配
          const resources = Array.isArray(Resource) ? Resource : [Resource];
          const resourceMatch = resources.some(r => {
            // 处理变量替换
            let processedResource = r;
            if (r.includes('${user.id}')) {
              processedResource = r.replace('${user.id}', user.id);
            }
            
            if (processedResource === '*') return true;
            if (processedResource === testCase.resource) return true;
            if (processedResource.includes('*')) {
              const regex = new RegExp(`^${processedResource.replace(/\*/g, '.*')}$`);
              return regex.test(testCase.resource);
            }
            return false;
          });
          
          if (!resourceMatch) continue;
          
          // 记录决策
          if (Effect === 'Deny') {
            explicitDeny = true;
            console.log(`   🚫 Deny: ${policy.name}`);
          } else if (Effect === 'Allow') {
            explicitAllow = true;
            console.log(`   ✅ Allow: ${policy.name}`);
          }
        }
      }
      
      // 确定最终决策
      let decision;
      if (explicitDeny) {
        decision = 'Deny';
      } else if (explicitAllow) {
        decision = 'Allow';
      } else {
        decision = 'Deny';
      }
      
      const result = decision === testCase.expected ? '✅' : '❌';
      console.log(`   ${result} 结果: ${decision} (期望: ${testCase.expected})`);
    }
    
  } catch (error) {
    console.error('❌ 测试错误:', error);
  } finally {
    await db.sequelize.close();
  }
};

testIAM();

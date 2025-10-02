#!/usr/bin/env node

// init-iam.js
// Initialize IAM system with default roles and policies

const { sequelize } = require('../config/database');
const { Role, Policy, User, UserRole, RolePolicy } = require('../models');

async function initializeIAM() {
  try {
    console.log('🚀 Initializing IAM system...');

    // Sync database
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');

    // Create default policies
    const policies = await createDefaultPolicies();
    console.log('✅ Default policies created');

    // Create default roles
    const roles = await createDefaultRoles(policies);
    console.log('✅ Default roles created');

    // Assign policies to roles
    await assignPoliciesToRoles(roles, policies);
    console.log('✅ Policies assigned to roles');

    // Create admin user if not exists
    await createAdminUser(roles);
    console.log('✅ Admin user setup complete');

    console.log('\n🎉 IAM system initialization complete!');
    console.log('\n📋 Default roles created:');
    roles.forEach(role => {
      console.log(`  - ${role.name}: ${role.description}`);
    });

    console.log('\n📋 Default policies created:');
    policies.forEach(policy => {
      console.log(`  - ${policy.name}: ${policy.description}`);
    });

  } catch (error) {
    console.error('❌ IAM initialization failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

async function createDefaultPolicies() {
  const defaultPolicies = [
    {
      name: 'SystemFullAccess',
      description: 'Full system access including admin functions',
      policyDocument: {
        Version: '1.0',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['*'],
            Resource: ['*']
          }
        ]
      }
    },
    {
      name: 'DocumentFullAccess',
      description: 'Full access to document management',
      policyDocument: {
        Version: '1.0',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'docs:Create',
              'docs:Read',
              'docs:Update',
              'docs:Delete',
              'docs:List'
            ],
            Resource: ['docs/*']
          }
        ]
      }
    },
    {
      name: 'DocumentReadOnly',
      description: 'Read-only access to documents',
      policyDocument: {
        Version: '1.0',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'docs:Read',
              'docs:List'
            ],
            Resource: ['docs/*']
          }
        ]
      }
    },
    {
      name: 'OwnDocumentAccess',
      description: 'Access only to own documents',
      policyDocument: {
        Version: '1.0',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'docs:Create',
              'docs:Read',
              'docs:Update',
              'docs:Delete'
            ],
            Resource: ['docs/*'],
            Condition: {
              StringEquals: {
                'docs:author_id': '${user.id}'
              }
            }
          }
        ]
      }
    },
    {
      name: 'UserManagement',
      description: 'Full access to user management',
      policyDocument: {
        Version: '1.0',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'users:Create',
              'users:Read',
              'users:Update',
              'users:Delete',
              'users:List'
            ],
            Resource: ['users/*']
          }
        ]
      }
    },
    {
      name: 'RoleManagement',
      description: 'Full access to role management',
      policyDocument: {
        Version: '1.0',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'roles:Create',
              'roles:Read',
              'roles:Update',
              'roles:Delete',
              'roles:List'
            ],
            Resource: ['roles/*']
          }
        ]
      }
    },
    {
      name: 'PolicyManagement',
      description: 'Full access to policy management',
      policyDocument: {
        Version: '1.0',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'policies:Create',
              'policies:Read',
              'policies:Update',
              'policies:Delete',
              'policies:List'
            ],
            Resource: ['policies/*']
          }
        ]
      }
    }
  ];

  const createdPolicies = [];
  for (const policyData of defaultPolicies) {
    const [policy, created] = await Policy.findOrCreate({
      where: { name: policyData.name },
      defaults: policyData
    });
    createdPolicies.push(policy);
    if (created) {
      console.log(`  📄 Created policy: ${policy.name}`);
    } else {
      console.log(`  📄 Policy already exists: ${policy.name}`);
    }
  }

  return createdPolicies;
}

async function createDefaultRoles(policies) {
  const defaultRoles = [
    {
      name: 'Administrator',
      description: 'Full system administrator with all permissions',
      isSystemRole: true,
      policies: ['SystemFullAccess']
    },
    {
      name: 'Editor',
      description: 'Document editor with full document management access',
      isSystemRole: true,
      policies: ['DocumentFullAccess']
    },
    {
      name: 'Viewer',
      description: 'Read-only access to documents',
      isSystemRole: true,
      policies: ['DocumentReadOnly']
    },
    {
      name: 'User',
      description: 'Basic user with access to own documents only',
      isSystemRole: true,
      policies: ['OwnDocumentAccess']
    }
  ];

  const createdRoles = [];
  for (const roleData of defaultRoles) {
    const [role, created] = await Role.findOrCreate({
      where: { name: roleData.name },
      defaults: {
        name: roleData.name,
        description: roleData.description,
        isSystemRole: roleData.isSystemRole
      }
    });
    createdRoles.push(role);
    if (created) {
      console.log(`  👤 Created role: ${role.name}`);
    } else {
      console.log(`  👤 Role already exists: ${role.name}`);
    }
  }

  return createdRoles;
}

async function assignPoliciesToRoles(roles, policies) {
  const policyMap = {};
  policies.forEach(policy => {
    policyMap[policy.name] = policy;
  });

  const roleMap = {};
  roles.forEach(role => {
    roleMap[role.name] = role;
  });

  const assignments = [
    { role: 'Administrator', policies: ['SystemFullAccess'] },
    { role: 'Editor', policies: ['DocumentFullAccess'] },
    { role: 'Viewer', policies: ['DocumentReadOnly'] },
    { role: 'User', policies: ['OwnDocumentAccess'] }
  ];

  for (const assignment of assignments) {
    const role = roleMap[assignment.role];
    const rolePolicies = assignment.policies.map(name => policyMap[name]);
    
    await role.setPolicies(rolePolicies);
    console.log(`  🔗 Assigned policies to role: ${role.name}`);
  }
}

async function createAdminUser(roles) {
  const adminRole = roles.find(role => role.name === 'Administrator');
  
  if (!adminRole) {
    throw new Error('Administrator role not found');
  }

  // Check if admin user already exists
  const existingAdmin = await User.findOne({ where: { email: 'admin@example.com' } });
  
  if (existingAdmin) {
    // Check if admin has Administrator role
    const hasAdminRole = await existingAdmin.hasRole(adminRole);
    if (!hasAdminRole) {
      await existingAdmin.addRole(adminRole);
      console.log('  👑 Assigned Administrator role to existing admin user');
    } else {
      console.log('  👑 Admin user already has Administrator role');
    }
    return;
  }

  // Create new admin user
  const adminUser = await User.create({
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin' // Legacy role for backward compatibility
  });

  // Assign Administrator role
  await adminUser.addRole(adminRole);
  
  console.log('  👑 Created admin user: admin@example.com / admin123');
}

// Run initialization if called directly
if (require.main === module) {
  initializeIAM().catch(console.error);
}

module.exports = { initializeIAM };


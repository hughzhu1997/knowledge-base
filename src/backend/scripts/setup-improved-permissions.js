#!/usr/bin/env node

// setup-improved-permissions.js
// Script to set up the improved permission system

const { sequelize } = require('../config/database');
const { User, Role, Policy, UserRole, RolePolicy, WorkGroup, GroupMember, PermissionRequest, DocumentPermission } = require('../models');

async function setupImprovedPermissions() {
  try {
    console.log('🚀 Setting up improved permission system...\n');

    // 1. Synchronize all models with the database
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');

    // 2. Create default policies for the improved system
    const policiesData = [
      {
        name: 'DefaultUserPermissions',
        description: 'Default permissions for new users',
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
                'docs:List',
                'groups:Create',
                'groups:Join',
                'requests:Submit'
              ],
              Resource: ['*']
            }
          ]
        },
        isSystemPolicy: true
      },
      {
        name: 'GroupManagement',
        description: 'Permissions for group management',
        policyDocument: {
          Version: '1.0',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'groups:Manage',
                'groups:Invite',
                'groups:Remove'
              ],
              Resource: ['groups/*']
            }
          ]
        },
        isSystemPolicy: true
      },
      {
        name: 'DocumentSharing',
        description: 'Permissions for document sharing',
        policyDocument: {
          Version: '1.0',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'docs:Share',
                'docs:SetPermissions'
              ],
              Resource: ['docs/*']
            }
          ]
        },
        isSystemPolicy: true
      }
    ];

    const createdPolicies = {};
    for (const data of policiesData) {
      const [policy, created] = await Policy.findOrCreate({
        where: { name: data.name },
        defaults: data
      });
      createdPolicies[data.name] = policy;
      console.log(`  📄 ${created ? 'Created' : 'Found'} policy: ${policy.name}`);
    }
    console.log('✅ Default policies created');

    // 3. Create default roles for the improved system
    const rolesData = [
      { 
        name: 'DefaultUser', 
        description: 'Default user with basic permissions and ability to request more',
        isSystemRole: true 
      },
      { 
        name: 'GroupLeader', 
        description: 'Can manage work groups and invite members',
        isSystemRole: true 
      },
      { 
        name: 'ContentEditor', 
        description: 'Can edit shared documents and manage content',
        isSystemRole: true 
      }
    ];

    const createdRoles = {};
    for (const data of rolesData) {
      const [role, created] = await Role.findOrCreate({
        where: { name: data.name },
        defaults: data
      });
      createdRoles[data.name] = role;
      console.log(`  👤 ${created ? 'Created' : 'Found'} role: ${role.name}`);
    }
    console.log('✅ Default roles created');

    // 4. Assign policies to roles
    const rolePolicyAssignments = [
      { role: 'DefaultUser', policies: ['DefaultUserPermissions'] },
      { role: 'GroupLeader', policies: ['DefaultUserPermissions', 'GroupManagement'] },
      { role: 'ContentEditor', policies: ['DefaultUserPermissions', 'DocumentSharing'] },
    ];

    for (const assignment of rolePolicyAssignments) {
      const role = createdRoles[assignment.role];
      const policiesToAssign = assignment.policies.map(policyName => createdPolicies[policyName]);
      await role.setPolicies(policiesToAssign);
      console.log(`  🔗 Assigned policies to role: ${role.name}`);
    }
    console.log('✅ Policies assigned to roles');

    // 5. Assign DefaultUser role to all existing users
    const existingUsers = await User.findAll();
    const defaultUserRole = createdRoles['DefaultUser'];
    
    for (const user of existingUsers) {
      const hasRole = await user.hasRole(defaultUserRole);
      if (!hasRole) {
        await user.addRole(defaultUserRole);
        console.log(`  👤 Assigned DefaultUser role to: ${user.username}`);
      }
    }
    console.log('✅ DefaultUser role assigned to existing users');

    // 6. Create welcome groups for existing users
    for (const user of existingUsers) {
      const existingGroup = await WorkGroup.findOne({
        where: { creatorId: user.id }
      });

      if (!existingGroup) {
        const welcomeGroup = await WorkGroup.create({
          name: `${user.username}'s Workspace`,
          description: `Personal workspace for ${user.username}`,
          creatorId: user.id,
          isPublic: false,
          settings: {
            allowMemberInvite: true,
            requireApproval: false,
            defaultPermission: 'collaborator'
          }
        });

        await GroupMember.create({
          groupId: welcomeGroup.id,
          userId: user.id,
          role: 'leader',
          status: 'active',
          joinedAt: new Date()
        });

        console.log(`  🏠 Created welcome group for: ${user.username}`);
      }
    }
    console.log('✅ Welcome groups created for existing users');

    console.log('\n🎉 Improved permission system setup complete!\n');
    console.log('📋 New features available:');
    console.log('  - 👤 Default user permissions (create docs, join groups, submit requests)');
    console.log('  - 🏠 Personal workspace groups for each user');
    console.log('  - 📝 Permission request system');
    console.log('  - 👥 Work group collaboration');
    console.log('  - 📄 Document sharing and permissions');
    console.log('\n🚀 Users can now:');
    console.log('  - Create documents immediately after registration');
    console.log('  - Create and manage work groups');
    console.log('  - Request additional permissions');
    console.log('  - Share documents with specific users or groups');
    console.log('  - Collaborate within work groups');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// If running this script directly
if (require.main === module) {
  setupImprovedPermissions().catch(console.error);
}

module.exports = { setupImprovedPermissions };

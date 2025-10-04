'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('policies', [
      // Admin Full Access Policy
      {
        id: uuidv4(),
        name: 'AdminFullAccess',
        description: '管理员全权限策略',
        document: Sequelize.literal("'{\"Version\":\"2025-10-04\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"*\"],\"Resource\":[\"*\"]}]}'::jsonb"),
        is_system_policy: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // User Self Document Policy
      {
        id: uuidv4(),
        name: 'UserSelfDocPolicy',
        description: '用户自文档管理策略',
        document: Sequelize.literal("'{\"Version\":\"2025-10-04\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"docs:Create\",\"docs:Read\",\"docs:Update\",\"docs:Delete\"],\"Resource\":[\"doc:${user.id}/*\"]},{\"Effect\":\"Allow\",\"Action\":[\"docs:Read\"],\"Resource\":[\"doc:public/*\"]}]}'::jsonb"),
        is_system_policy: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Editor Document Policy
      {
        id: uuidv4(),
        name: 'EditorDocPolicy',
        description: '编辑者文档管理策略',
        document: Sequelize.literal("'{\"Version\":\"2025-10-04\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"docs:Create\",\"docs:Read\",\"docs:Update\",\"docs:Delete\"],\"Resource\":[\"doc/*\"]}]}'::jsonb"),
        is_system_policy: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Auditor Read Only Policy
      {
        id: uuidv4(),
        name: 'AuditorReadOnly',
        description: '审计员只读策略',
        document: Sequelize.literal("'{\"Version\":\"2025-10-04\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"docs:Read\",\"users:Read\",\"audit:Read\"],\"Resource\":[\"*\"]}]}'::jsonb"),
        is_system_policy: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('policies', null, {});
  }
};
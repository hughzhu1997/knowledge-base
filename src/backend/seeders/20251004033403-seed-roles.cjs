'use strict';

/** @type {import('sequelize').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('roles', [
      {
        name: 'Administrator',
        description: '系统管理员，拥有所有权限',
        is_system_role: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Editor',
        description: '内容编辑者，可以管理所有文档',
        is_system_role: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'User',
        description: '普通用户，可以管理自己的文档',
        is_system_role: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Auditor',
        description: '审计员，只读权限',
        is_system_role: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
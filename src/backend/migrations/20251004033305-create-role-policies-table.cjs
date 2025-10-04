'use strict';

/** @type {import('sequelize').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('role_policies', {
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'roles',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      policy_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'policies',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      assigned_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for efficient lookups
    await queryInterface.addIndex('role_policies', ['role_id']);
    await queryInterface.addIndex('role_policies', ['policy_id']);
    await queryInterface.addIndex('role_policies', ['role_id', 'policy_id'], {
      name: 'idx_role_policies_composite'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('role_policies');
  }
};
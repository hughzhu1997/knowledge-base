'use strict';

/** @type {import('sequelize').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_roles', {
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
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
      assigned_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      assigned_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes for efficient lookups
    await queryInterface.addIndex('user_roles', ['role_id']);
    await queryInterface.addIndex('user_roles', ['user_id']);
    await queryInterface.addIndex('user_roles', ['assigned_by']);
    await queryInterface.addIndex('user_roles', ['expires_at']);
    await queryInterface.addIndex('user_roles', ['user_id', 'role_id'], {
      name: 'idx_user_roles_composite'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_roles');
  }
};
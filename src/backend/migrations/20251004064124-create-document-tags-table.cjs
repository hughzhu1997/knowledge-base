'use strict';

/** @type {import('sequelize').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('document_tags', {
      document_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'documents',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      tag_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'tags',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('document_tags', ['document_id']);
    await queryInterface.addIndex('document_tags', ['tag_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('document_tags');
  }
};
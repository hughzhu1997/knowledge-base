'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Action performed (e.g., docs:Create, users:Update, auth:Login)'
      },
      resource: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Resource affected (e.g., doc:123, user:456, * for global actions)'
      },
      actor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'User who performed the action'
      },
      target_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'User affected by the action (for user operations)'
      },
      client_ip: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'Client IP address'
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Client user agent string'
      },
      session_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Session identifier'
      },
      request_id: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: Sequelize.UUIDV4,
        comment: 'Request identifier for tracing'
      },
      status: {
        type: Sequelize.ENUM('SUCCESS', 'FAILURE', 'PENDING'),
        defaultValue: 'SUCCESS',
        allowNull: false,
        comment: 'Result of the action'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Human-readable description of the action'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional context data (e.g., document title, old/new values)'
      },
      error_code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Error code if action failed'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error details if action failed'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Timestamp of the action'
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('audit_logs', ['actor_id'], {
      name: 'idx_audit_logs_actor'
    });

    await queryInterface.addIndex('audit_logs', ['action'], {
      name: 'idx_audit_logs_action'
    });

    await queryInterface.addIndex('audit_logs', ['resource'], {
      name: 'idx_audit_logs_resource'
    });

    await queryInterface.addIndex('audit_logs', ['created_at'], {
      name: 'idx_audit_logs_created_at'
    });

    await queryInterface.addIndex('audit_logs', ['status'], {
      name: 'idx_audit_logs_status'
    });

    await queryInterface.addIndex('audit_logs', ['request_id'], {
      name: 'idx_audit_logs_request_id'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_logs');
  }
};
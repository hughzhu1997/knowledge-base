'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      // AuditLog belongs to User (actor)
      AuditLog.belongsTo(models.User, {
        foreignKey: 'actor_id',
        as: 'actor'
      });

      // AuditLog belongs to User (target user, for user operations)
      AuditLog.belongsTo(models.User, {
        foreignKey: 'target_user_id',
        as: 'targetUser'
      });
    }

    // Instance methods
    get actionType() {
      return this.action.split(':')[0]; // e.g., 'docs', 'users', 'auth'
    }

    get operation() {
      return this.action.split(':')[1]; // e.g., 'Create', 'Read', 'Update', 'Delete'
    }

    get severityLevel() {
      const criticalActions = ['users:Create', 'users:Delete', 'auth:Login', 'auth:Logout'];
      const moderateActions = ['docs:Delete', 'docs:Update', 'users:Update'];
      
      if (criticalActions.includes(this.action)) {
        return 'critical';
      } else if (moderateActions.includes(this.action)) {
        return 'moderate';
      } else {
        return 'low';
      }
    }

    get ipAddress() {
      return this.client_ip;
    }

    get userAgent() {
      return this.user_agent;
    }
  }

  AuditLog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Action performed (e.g., docs:Create, users:Update, auth:Login)'
    },
    resource: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Resource affected (e.g., doc:123, user:456, * for global actions)�'
    },
    actor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who performed the action'
    },
    target_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User affected by the action (for user operations)'
    },
    client_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'Client IP address'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Client user agent string'
    },
    session_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Session identifier'
    },
    request_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: DataTypes.UUIDV4,
      comment: 'Request identifier for tracing'
    },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILURE', 'PENDING'),
      defaultValue: 'SUCCESS',
      allowNull: false,
      comment: 'Result of the action'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Human-readable description of the action'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional context data (e.g., document title, old/new values)'
    },
    error_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Error code if action failed'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error details if action failed'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'idx_audit_logs_action',
        fields: ['action']
      },
      {
        name: 'idx_audit_logs_actor',
        fields: ['actor_id']
      },
      {
        name: 'idx_audit_logs_created_at',
        fields: ['created_at']
      },
      {
        name: 'idx_audit_logs_resource',
        fields: ['resource']
      },
      {
        name: 'idx_audit_logs_status',
        fields: ['status']
      }
    ],
    hooks: {
      beforeCreate: (log) => {
        if (!log.request_id) {
          log.request_id = DataTypes.UUIDV4();
        }
      }
    },
    comment: 'Audit trail for system operations and user actions'
  });

  return AuditLog;
};
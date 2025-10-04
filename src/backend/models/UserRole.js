import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const UserRole = sequelize.define('UserRole', {
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    role_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    assigned_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assigned_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_roles',
    underscored: true,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'role_id']
      }
    ]
  });

  return UserRole;
};

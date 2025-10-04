import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const RolePolicy = sequelize.define('RolePolicy', {
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
    policy_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'policies',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    assigned_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'role_policies',
    underscored: true,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'policy_id']
      }
    ]
  });

  return RolePolicy;
};

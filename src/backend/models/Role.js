import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 50],
        notEmpty: true,
        isAlphanumeric: {
          args: true,
          msg: 'Role name must contain only letters and numbers'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_system_role: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    tableName: 'roles',
    underscored: true,
    timestamps: true
  });

  return Role;
};

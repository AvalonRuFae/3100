const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const License = sequelize.define('License', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teamName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'team_name'
  },
  licenseKey: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'license_key'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  expirationDate: {
    type: DataTypes.DATE,
    field: 'expiration_date'
  },
  maxUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    field: 'max_users'
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'team_id',
    references: {
      model: 'teams',
      key: 'id'
    }
  },
  assignedUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'assigned_user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'licenses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = License;

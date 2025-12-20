const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const License = sequelize.define('License', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'team_id',
    comment: 'One license per team'
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
    field: 'license_key',
    comment: 'License key from environment configuration'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Set to false when license expires or is revoked'
  },
  expirationDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expiration_date',
    comment: 'License expiration date from configuration'
  },
  maxUsers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50,
    field: 'max_users',
    comment: 'Maximum users allowed for this team from license config'
  },
  notes: {
    type: DataTypes.TEXT,
    comment: 'Optional notes about license assignment'
  }
}, {
  tableName: 'licenses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['team_id']
    },
    {
      unique: true,
      fields: ['license_key']
    }
  ]
});

module.exports = License;

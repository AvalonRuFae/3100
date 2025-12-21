const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'TASK_ASSIGNED',
      'DEADLINE_REMINDER',
      'TASK_COMPLETED',
      'BOUNTY_RECEIVED',
      'PENALTY_APPLIED',
      'LICENSE_EXPIRING',
      'TASK_DELETED'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  readStatus: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'read_status'
  },
  relatedTaskId: {
    type: DataTypes.INTEGER,
    field: 'related_task_id',
    references: {
      model: 'tasks',
      key: 'id'
    }
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Notification;

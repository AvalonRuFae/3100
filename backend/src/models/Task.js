const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('AVAILABLE', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'),
    allowNull: false,
    defaultValue: 'AVAILABLE'
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
    allowNull: false,
    defaultValue: 'MEDIUM'
  },
  bountyAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'bounty_amount',
    validate: {
      min: 0
    }
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    field: 'assigned_to',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at'
  },
  assignedAt: {
    type: DataTypes.DATE,
    field: 'assigned_at'
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Task;

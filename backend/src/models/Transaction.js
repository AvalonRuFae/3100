const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Transaction = sequelize.define('Transaction', {
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
  taskId: {
    type: DataTypes.INTEGER,
    field: 'task_id',
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('BOUNTY', 'PENALTY', 'ADJUSTMENT'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  balanceBefore: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'balance_before'
  },
  balanceAfter: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'balance_after'
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Transaction;

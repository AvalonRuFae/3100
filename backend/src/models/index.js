const User = require('./User');
const Task = require('./Task');
const Notification = require('./Notification');
const License = require('./License');
const Transaction = require('./Transaction');
const Team = require('./Team');

// Team - User relationships
Team.hasMany(User, { as: 'members', foreignKey: 'teamId' });
User.belongsTo(Team, { as: 'team', foreignKey: 'teamId' });

// Team - License relationships
Team.hasOne(License, { as: 'license', foreignKey: 'teamId' });
License.belongsTo(Team, { as: 'team', foreignKey: 'teamId' });

// Team - Creator relationship
Team.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// User - Task relationships
User.hasMany(Task, { as: 'createdTasks', foreignKey: 'createdBy' });
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assignedTo' });
Task.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });

// User - Notification relationships
User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// Task - Notification relationships
Task.hasMany(Notification, { foreignKey: 'relatedTaskId', onDelete: 'SET NULL' });
Notification.belongsTo(Task, { foreignKey: 'relatedTaskId' });

// User - Transaction relationships
User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

// Task - Transaction relationships
Task.hasMany(Transaction, { foreignKey: 'taskId' });
Transaction.belongsTo(Task, { foreignKey: 'taskId' });

// User - License relationships (Many-to-Many)
const UserLicense = require('../database/connection').sequelize.define('UserLicense', {
  userId: {
    type: require('sequelize').DataTypes.INTEGER,
    field: 'user_id',
    references: { model: 'users', key: 'id' }
  },
  licenseId: {
    type: require('sequelize').DataTypes.INTEGER,
    field: 'license_id',
    references: { model: 'licenses', key: 'id' }
  }
}, {
  tableName: 'user_licenses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

User.belongsToMany(License, { through: UserLicense, foreignKey: 'userId' });
License.belongsToMany(User, { through: UserLicense, foreignKey: 'licenseId' });

module.exports = {
  User,
  Task,
  Notification,
  License,
  Transaction,
  Team,
  UserLicense
};

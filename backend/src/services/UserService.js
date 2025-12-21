const { User, Task, Transaction, License } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class UserService {
  async getAllUsers(filters = {}) {
    try {
      const where = {};

      if (filters.role) {
        where.role = filters.role;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const users = await User.findAll({
        where,
        include: [{
          model: License,
          through: { attributes: [] }
        }],
        order: [['created_at', 'DESC']]
      });

      return users;
    } catch (error) {
      logger.error('Get all users error:', error);
      throw error;
    }
  }

  async getUserById(userId, requestingUser = null) {
    try {
      // Validate ID format
      if (isNaN(userId)) {
        const error = new Error('Invalid user ID format');
        error.status = 400;
        throw error;
      }

      const user = await User.findByPk(userId, {
        include: [{
          model: License,
          through: { attributes: [] }
        }]
      });

      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      // Team isolation check: users can only view profiles from their own team
      // Admin (OYAKATASAMA) can view any user
      if (requestingUser && 
          requestingUser.role !== 'OYAKATASAMA' && 
          user.teamId !== requestingUser.teamId) {
        const error = new Error('Access denied: Cannot view users from other teams');
        error.status = 403;
        throw error;
      }

      return user;
    } catch (error) {
      logger.error('Get user error:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [{
          model: License,
          through: { attributes: [] }
        }]
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get user statistics
      const tasksCreated = await Task.count({
        where: { createdBy: userId }
      });

      const tasksAssigned = await Task.count({
        where: { assignedTo: userId }
      });

      const tasksCompleted = await Task.count({
        where: {
          assignedTo: userId,
          status: 'COMPLETED'
        }
      });

      const tasksInProgress = await Task.count({
        where: {
          assignedTo: userId,
          status: 'IN_PROGRESS'
        }
      });

      const totalEarned = await Transaction.sum('amount', {
        where: {
          userId: userId,
          type: 'BOUNTY'
        }
      }) || 0;

      const totalPenalties = await Transaction.sum('amount', {
        where: {
          userId: userId,
          type: 'PENALTY'
        }
      }) || 0;

      return {
        user,
        stats: {
          tasksCreated,
          tasksAssigned,
          tasksCompleted,
          tasksInProgress,
          totalEarned: Math.abs(totalEarned),
          totalPenalties: Math.abs(totalPenalties),
          currentBalance: user.balance,
          completionRate: tasksAssigned > 0 
            ? ((tasksCompleted / tasksAssigned) * 100).toFixed(2) 
            : 0
        }
      };
    } catch (error) {
      logger.error('Get user profile error:', error);
      throw error;
    }
  }

  async updateUser(userId, updates) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      // Don't allow direct password updates through this method
      delete updates.password;
      delete updates.role; // Role changes should be done through admin function

      await user.update(updates);

      logger.info(`User updated: ${user.username}`);

      return user;
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      // Soft delete - just deactivate
      user.isActive = false;
      await user.save();

      logger.info(`User deactivated: ${user.username}`);

      return true;
    } catch (error) {
      logger.error('Delete user error:', error);
      throw error;
    }
  }

  async updateUserRole(userId, newRole) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      user.role = newRole;
      await user.save();

      logger.info(`User role updated: ${user.username} -> ${newRole}`);

      return user;
    } catch (error) {
      logger.error('Update user role error:', error);
      throw error;
    }
  }

  async getUserTasks(userId, status = null) {
    try {
      const where = { assignedTo: userId };

      if (status) {
        where.status = status;
      }

      const tasks = await Task.findAll({
        where,
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }],
        order: [['deadline', 'ASC']]
      });

      return tasks;
    } catch (error) {
      logger.error('Get user tasks error:', error);
      throw error;
    }
  }

  async getUserTransactions(userId, limit = 50) {
    try {
      const transactions = await Transaction.findAll({
        where: { userId },
        include: [{
          model: Task,
          attributes: ['id', 'title']
        }],
        order: [['created_at', 'DESC']],
        limit
      });

      return transactions;
    } catch (error) {
      logger.error('Get user transactions error:', error);
      throw error;
    }
  }

  async getLeaderboard(limit = 10) {
    try {
      const users = await User.findAll({
        where: { isActive: true },
        attributes: [
          'id', 
          'username', 
          'role', 
          'balance',
          'profilePicture'
        ],
        order: [['balance', 'DESC']],
        limit
      });

      // Add rank
      const leaderboard = users.map((user, index) => ({
        rank: index + 1,
        ...user.toJSON()
      }));

      return leaderboard;
    } catch (error) {
      logger.error('Get leaderboard error:', error);
      throw error;
    }
  }
}

module.exports = new UserService();

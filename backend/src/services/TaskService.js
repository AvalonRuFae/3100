const { Task, User, License } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../database/connection');
const logger = require('../utils/logger');
const NotificationService = require('./NotificationService');
const BountyService = require('./BountyService');

class TaskService {
  async checkLicenseLimit(creatorId) {
    const user = await User.findByPk(creatorId, {
      include: [{ model: License }]
    });

    const hasValidLicense = user.Licenses && user.Licenses.some(license => 
      license.isActive && 
      (!license.expirationDate || new Date(license.expirationDate) > new Date())
    );

    if (!hasValidLicense) {
      const totalTasks = await Task.count();
      const maxTasks = parseInt(process.env.MAX_TASKS_WITHOUT_LICENSE) || 3;

      if (totalTasks >= maxTasks) {
        throw new Error(`License required. Maximum ${maxTasks} tasks allowed without license.`);
      }
    }

    return true;
  }

  async getAllTasks(filters = {}) {
    try {
      const where = {};

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.priority) {
        where.priority = filters.priority;
      }

      if (filters.createdBy) {
        where.createdBy = filters.createdBy;
      }

      if (filters.assignedTo) {
        where.assignedTo = filters.assignedTo;
      }

      if (filters.search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${filters.search}%` } },
          { description: { [Op.like]: `%${filters.search}%` } }
        ];
      }

      const tasks = await Task.findAll({
        where,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'email']
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'username', 'email']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return tasks;
    } catch (error) {
      logger.error('Get all tasks error:', error);
      throw error;
    }
  }

  async getTaskById(taskId) {
    try {
      const task = await Task.findByPk(taskId, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'email', 'role']
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'username', 'email', 'role', 'balance']
          }
        ]
      });

      if (!task) {
        throw new Error('Task not found');
      }

      return task;
    } catch (error) {
      logger.error('Get task error:', error);
      throw error;
    }
  }

  async createTask(taskData, creatorId) {
    try {
      // Check license limit
      await this.checkLicenseLimit(creatorId);

      const task = await Task.create({
        ...taskData,
        createdBy: creatorId
      });

      logger.info(`Task created: ${task.title} by user ${creatorId}`);

      return await this.getTaskById(task.id);
    } catch (error) {
      logger.error('Create task error:', error);
      throw error;
    }
  }

  async updateTask(taskId, updates, userId) {
    try {
      const task = await Task.findByPk(taskId);

      if (!task) {
        throw new Error('Task not found');
      }

      // Only creator can update certain fields
      if (updates.bountyAmount || updates.deadline) {
        const user = await User.findByPk(userId);
        if (task.createdBy !== userId && user.role !== 'OYAKATASAMA') {
          throw new Error('Only task creator or admin can update bounty/deadline');
        }
      }

      await task.update(updates);

      logger.info(`Task updated: ${task.title}`);

      return await this.getTaskById(taskId);
    } catch (error) {
      logger.error('Update task error:', error);
      throw error;
    }
  }

  async deleteTask(taskId, userId) {
    try {
      const task = await Task.findByPk(taskId);

      if (!task) {
        throw new Error('Task not found');
      }

      const user = await User.findByPk(userId);

      // Check permissions
      if (task.createdBy !== userId && 
          user.role !== 'HASHIRA' && 
          user.role !== 'OYAKATASAMA') {
        throw new Error('Insufficient permissions to delete task');
      }

      // Can only delete if available or unassigned
      if (task.status !== 'AVAILABLE' && task.assignedTo) {
        throw new Error('Cannot delete assigned or in-progress tasks');
      }

      // Notify assignee if task was assigned
      if (task.assignedTo) {
        await NotificationService.createNotification(
          task.assignedTo,
          'TASK_DELETED',
          {
            taskTitle: task.title,
            reason: 'Task was deleted by creator'
          }
        );
      }

      await task.destroy();

      logger.info(`Task deleted: ${task.title}`);

      return true;
    } catch (error) {
      logger.error('Delete task error:', error);
      throw error;
    }
  }

  async assignTask(taskId, userId) {
    try {
      const task = await Task.findByPk(taskId);

      if (!task) {
        throw new Error('Task not found');
      }

      if (task.status !== 'AVAILABLE') {
        throw new Error('Task is not available');
      }

      if (task.assignedTo) {
        throw new Error('Task is already assigned');
      }

      // Update task
      task.assignedTo = userId;
      task.status = 'IN_PROGRESS';
      task.assignedAt = new Date();
      await task.save();

      // Get creator info for notification
      const creator = await User.findByPk(task.createdBy);

      // Send notification to user
      await NotificationService.createNotification(
        userId,
        'TASK_ASSIGNED',
        {
          taskTitle: task.title,
          assignerName: creator.username,
          bountyAmount: task.bountyAmount
        }
      );

      logger.info(`Task assigned: ${task.title} to user ${userId}`);

      return await this.getTaskById(taskId);
    } catch (error) {
      logger.error('Assign task error:', error);
      throw error;
    }
  }

  async updateTaskStatus(taskId, newStatus, userId) {
    try {
      const task = await Task.findByPk(taskId);

      if (!task) {
        throw new Error('Task not found');
      }

      // Check if user is assigned to task
      if (task.assignedTo !== userId) {
        const user = await User.findByPk(userId);
        if (user.role !== 'HASHIRA' && user.role !== 'OYAKATASAMA') {
          throw new Error('Only assigned user can update task status');
        }
      }

      const oldStatus = task.status;
      task.status = newStatus;

      // If completing task
      if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
        task.completedAt = new Date();

        // Process bounty payment or penalty
        const now = new Date();
        const deadline = new Date(task.deadline);

        if (now <= deadline) {
          // On time - pay bounty
          await BountyService.processBounty(task.assignedTo, task.id, task.bountyAmount);
        } else {
          // Late - apply penalty
          const penaltyAmount = task.bountyAmount * (parseFloat(process.env.PENALTY_MULTIPLIER) || 0.1);
          await BountyService.applyPenalty(task.assignedTo, task.id, penaltyAmount, 'Missed deadline');
        }

        // Notify creator
        await NotificationService.createNotification(
          task.createdBy,
          'TASK_COMPLETED',
          {
            taskTitle: task.title,
            assigneeName: (await User.findByPk(task.assignedTo)).username
          }
        );
      }

      await task.save();

      logger.info(`Task status updated: ${task.title} -> ${newStatus}`);

      return await this.getTaskById(taskId);
    } catch (error) {
      logger.error('Update task status error:', error);
      throw error;
    }
  }

  async getKanbanBoard(userId = null, role = null) {
    try {
      const where = {};

      // Filter based on role
      if (role === 'GOON' && userId) {
        // Goons see available tasks and their own tasks
        where[Op.or] = [
          { status: 'AVAILABLE' },
          { assignedTo: userId }
        ];
      }

      const tasks = await Task.findAll({
        where,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username']
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'username']
          }
        ],
        order: [['priority', 'DESC'], ['deadline', 'ASC']]
      });

      // Group by status
      const board = {
        available: tasks.filter(t => t.status === 'AVAILABLE'),
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS'),
        review: tasks.filter(t => t.status === 'REVIEW'),
        completed: tasks.filter(t => t.status === 'COMPLETED')
      };

      return board;
    } catch (error) {
      logger.error('Get kanban board error:', error);
      throw error;
    }
  }

  async getTaskStatistics() {
    try {
      const total = await Task.count();
      const available = await Task.count({ where: { status: 'AVAILABLE' } });
      const inProgress = await Task.count({ where: { status: 'IN_PROGRESS' } });
      const review = await Task.count({ where: { status: 'REVIEW' } });
      const completed = await Task.count({ where: { status: 'COMPLETED' } });

      const avgBounty = await Task.findAll({
        attributes: [[sequelize.fn('AVG', sequelize.col('bounty_amount')), 'average']]
      });

      const totalBounty = await Task.sum('bountyAmount', {
        where: { status: 'AVAILABLE' }
      });

      return {
        total,
        byStatus: {
          available,
          inProgress,
          review,
          completed
        },
        averageBounty: parseFloat(avgBounty[0].dataValues.average || 0).toFixed(2),
        totalAvailableBounty: totalBounty || 0
      };
    } catch (error) {
      logger.error('Get task statistics error:', error);
      throw error;
    }
  }

  async checkDeadlines() {
    try {
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find tasks with deadline within 24 hours
      const upcomingTasks = await Task.findAll({
        where: {
          deadline: {
            [Op.lte]: twentyFourHoursFromNow,
            [Op.gte]: now
          },
          status: 'IN_PROGRESS'
        },
        include: [{
          model: User,
          as: 'assignee',
          attributes: ['id', 'username']
        }]
      });

      for (const task of upcomingTasks) {
        if (task.assignee) {
          const hoursRemaining = Math.ceil((new Date(task.deadline) - now) / (1000 * 60 * 60));
          
          await NotificationService.createNotification(
            task.assignedTo,
            'DEADLINE_REMINDER',
            {
              taskTitle: task.title,
              hoursRemaining
            }
          );
        }
      }

      logger.info(`Processed ${upcomingTasks.length} deadline reminders`);

      return upcomingTasks.length;
    } catch (error) {
      logger.error('Check deadlines error:', error);
      throw error;
    }
  }
}

module.exports = new TaskService();

const { Notification, Task, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const notificationTemplates = {
  TASK_ASSIGNED: ({ taskTitle, assignerName, bountyAmount }) => ({
    title: 'New Task Assigned',
    message: `${assignerName} has assigned you the task: "${taskTitle}" (Bounty: $${bountyAmount})`
  }),

  DEADLINE_REMINDER: ({ taskTitle, hoursRemaining }) => ({
    title: 'Task Deadline Approaching',
    message: `Reminder: Task "${taskTitle}" is due in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}`
  }),

  TASK_COMPLETED: ({ taskTitle, assigneeName }) => ({
    title: 'Task Completed',
    message: `${assigneeName} has completed the task: "${taskTitle}"`
  }),

  BOUNTY_RECEIVED: ({ amount, taskId }) => ({
    title: 'Bounty Received!',
    message: `Congratulations! You've earned $${amount} for completing the task.`
  }),

  PENALTY_APPLIED: ({ amount, reason }) => ({
    title: 'Penalty Applied',
    message: `A penalty of $${amount} has been applied. Reason: ${reason}`
  }),

  LICENSE_EXPIRING: ({ daysRemaining, teamName }) => ({
    title: 'License Expiring Soon',
    message: `The license for team "${teamName}" expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
  }),

  TASK_DELETED: ({ taskTitle, reason }) => ({
    title: 'Task Deleted',
    message: `The task "${taskTitle}" has been deleted. ${reason}`
  })
};

class NotificationService {
  async createNotification(userId, type, data) {
    try {
      const template = notificationTemplates[type];

      if (!template) {
        throw new Error(`Invalid notification type: ${type}`);
      }

      const { title, message } = template(data);

      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        relatedTaskId: data.taskId || null,
        readStatus: false
      });

      logger.info(`Notification created: ${type} for user ${userId}`);

      return notification;
    } catch (error) {
      logger.error('Create notification error:', error);
      throw error;
    }
  }

  async getUserNotifications(userId, unreadOnly = false) {
    try {
      const where = { userId };

      if (unreadOnly) {
        where.readStatus = false;
      }

      const notifications = await Notification.findAll({
        where,
        include: [{
          model: Task,
          attributes: ['id', 'title', 'status']
        }],
        order: [['created_at', 'DESC']],
        limit: 50
      });

      return notifications;
    } catch (error) {
      logger.error('Get user notifications error:', error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: {
          userId,
          readStatus: false
        }
      });

      return count;
    } catch (error) {
      logger.error('Get unread count error:', error);
      throw error;
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: {
          id: notificationId,
          userId
        }
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      notification.readStatus = true;
      await notification.save();

      return notification;
    } catch (error) {
      logger.error('Mark as read error:', error);
      throw error;
    }
  }

  async markAllAsRead(userId) {
    try {
      await Notification.update(
        { readStatus: true },
        {
          where: {
            userId,
            readStatus: false
          }
        }
      );

      logger.info(`All notifications marked as read for user ${userId}`);

      return true;
    } catch (error) {
      logger.error('Mark all as read error:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.destroy({
        where: {
          id: notificationId,
          userId
        }
      });

      if (result === 0) {
        throw new Error('Notification not found');
      }

      return true;
    } catch (error) {
      logger.error('Delete notification error:', error);
      throw error;
    }
  }

  async notifyMultipleUsers(userIds, type, data) {
    try {
      const template = notificationTemplates[type];

      if (!template) {
        throw new Error(`Invalid notification type: ${type}`);
      }

      const { title, message } = template(data);

      const notifications = userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        relatedTaskId: data.taskId || null,
        readStatus: false
      }));

      await Notification.bulkCreate(notifications);

      logger.info(`Bulk notification created: ${type} for ${userIds.length} users`);

      return notifications.length;
    } catch (error) {
      logger.error('Notify multiple users error:', error);
      throw error;
    }
  }

  async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Notification.destroy({
        where: {
          created_at: {
            [Op.lt]: cutoffDate
          },
          readStatus: true
        }
      });

      logger.info(`Cleaned up ${result} old notifications`);

      return result;
    } catch (error) {
      logger.error('Cleanup old notifications error:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();

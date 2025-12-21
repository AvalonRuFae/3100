const NotificationService = require('../services/NotificationService');

class NotificationController {
  /**
   * 1user notifications
   * 
   * Request:
   * - Query params:
   *   - unread (optional): 'true' to get only unread notifications
   * - Headers:
   *   - Authorization: Bearer {token}
   * 
   * Response:
   * {
   *   success: true,
   *   data: [
   *     {
   *       id: number,
   *       userId: number,
   *       type: string,
   *       message: string,
   *       relatedId: number,
   *       isRead: boolean,
   *       createdAt: timestamp
   *     }
   *   ]
   * }
   */
  async getUserNotifications(req, res, next) {
    try {
      const unreadOnly = req.query.unread === 'true';
      const notifications = await NotificationService.getUserNotifications(
        req.user.id,
        unreadOnly
      );

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread notification count
   * 
   * Request:
   * - Headers:
   *   - Authorization: Bearer {token}
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     count: number
   *   }
   * }
   */
  async getUnreadCount(req, res, next) {
    try {
      const count = await NotificationService.getUnreadCount(req.user.id);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   * 
   * Request:
   * - URL params:
   *   - id: notification ID
   * - Headers:
   *   - Authorization: Bearer {token}
   * 
   * Response:
   * {
   *   success: true,
   *   message: 'Notification marked as read',
   *   data: {
   *     id: number,
   *     userId: number,
   *     type: string,
   *     message: string,
   *     relatedId: number,
   *     isRead: boolean,
   *     createdAt: timestamp
   *   }
   * }
   */
  async markAsRead(req, res, next) {
    try {
      const notification = await NotificationService.markAsRead(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * 
   * Request:
   * - Headers:
   *   - Authorization: Bearer {token}
   * 
   * Response:
   * {
   *   success: true,
   *   message: 'All notifications marked as read'
   * }
   */
  async markAllAsRead(req, res, next) {
    try {
      await NotificationService.markAllAsRead(req.user.id);

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a notification
   * 
   * Request:
   * - URL params:
   *   - id: notification ID
   * - Headers:
   *   - Authorization: Bearer {token}
   * 
   * Response:
   * {
   *   success: true,
   *   message: 'Notification deleted'
   * }
   */
  async deleteNotification(req, res, next) {
    try {
      await NotificationService.deleteNotification(req.params.id, req.user.id);

      res.json({
        success: true,
        message: 'Notification deleted'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();

const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/database/connection');
const { User, Task, Notification } = require('../src/models');
const NotificationService = require('../src/services/NotificationService');

describe('Notification Service', () => {
  let testUser1, testUser2, testTask;
  let user1Token, user2Token;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test users
    const user1Response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testuser1',
        email: 'user1@test.com',
        password: 'Test123!',
        role: 'GOON'
      });

    const user2Response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testuser2',
        email: 'user2@test.com',
        password: 'Test123!',
        role: 'HASHIRA'
      });

    testUser1 = user1Response.body.data;
    testUser2 = user2Response.body.data;

    // Login to get tokens
    const login1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testuser1', password: 'Test123!' });
    user1Token = login1.body.data.token;

    const login2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testuser2', password: 'Test123!' });
    user2Token = login2.body.data.token;

    // Create test task
    testTask = await Task.create({
      title: 'Test Task',
      description: 'Test Description',
      createdBy: testUser2.id,
      assignedTo: testUser1.id,
      bountyAmount: 100,
      priority: 'MEDIUM',
      status: 'AVAILABLE',
      deadline: new Date(Date.now() + 86400000)
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Notification.destroy({ where: {} });
  });

  describe('createNotification', () => {
    /**
     * Test: Verify TASK_ASSIGNED notification creation
     * Purpose: Ensures that when a task is assigned to a user, a properly formatted 
     * notification is created with the correct type, title, message content (including
     * assigner name, task title, and bounty amount), and initial read status.
     */
    test('should create TASK_ASSIGNED notification', async () => {
      const notification = await NotificationService.createNotification(
        testUser1.id,
        'TASK_ASSIGNED',
        {
          taskTitle: 'New Task',
          assignerName: 'Manager',
          bountyAmount: 100,
          taskId: testTask.id
        }
      );

      expect(notification).toBeDefined();
      expect(notification.userId).toBe(testUser1.id);
      expect(notification.type).toBe('TASK_ASSIGNED');
      expect(notification.title).toBe('New Task Assigned');
      expect(notification.message).toContain('Manager');
      expect(notification.message).toContain('New Task');
      expect(notification.message).toContain('$100');
      expect(notification.readStatus).toBe(false);
    });

    /**
     * Test: Verify DEADLINE_REMINDER notification creation
     * Purpose: Tests that deadline reminder notifications are created with proper
     * formatting, including the task title and time remaining (with correct plural/singular).
     */
    test('should create DEADLINE_REMINDER notification', async () => {
      const notification = await NotificationService.createNotification(
        testUser1.id,
        'DEADLINE_REMINDER',
        {
          taskTitle: 'Urgent Task',
          hoursRemaining: 2,
          taskId: testTask.id
        }
      );

      expect(notification).toBeDefined();
      expect(notification.type).toBe('DEADLINE_REMINDER');
      expect(notification.title).toBe('Task Deadline Approaching');
      expect(notification.message).toContain('2 hours');
    });

    test('should create BOUNTY_RECEIVED notification', async () => {
      const notification = await NotificationService.createNotification(
        testUser1.id,
        'BOUNTY_RECEIVED',
        {
          amount: 150,
          taskId: testTask.id
        }
      );

      expect(notification).toBeDefined();
      expect(notification.type).toBe('BOUNTY_RECEIVED');
      expect(notification.title).toBe('Bounty Received!');
      expect(notification.message).toContain('$150');
    });

    test('should create PENALTY_APPLIED notification', async () => {
      const notification = await NotificationService.createNotification(
        testUser1.id,
        'PENALTY_APPLIED',
        {
          amount: 50,
          reason: 'Missed deadline'
        }
      );

      expect(notification).toBeDefined();
      expect(notification.type).toBe('PENALTY_APPLIED');
      expect(notification.title).toBe('Penalty Applied');
      expect(notification.message).toContain('$50');
      expect(notification.message).toContain('Missed deadline');
    });

    test('should create LICENSE_EXPIRING notification', async () => {
      const notification = await NotificationService.createNotification(
        testUser1.id,
        'LICENSE_EXPIRING',
        {
          daysRemaining: 5,
          teamName: 'Test Team'
        }
      );

      expect(notification).toBeDefined();
      expect(notification.type).toBe('LICENSE_EXPIRING');
      expect(notification.title).toBe('License Expiring Soon');
      expect(notification.message).toContain('Test Team');
      expect(notification.message).toContain('5 days');
    });

    test('should create TASK_DELETED notification', async () => {
      const notification = await NotificationService.createNotification(
        testUser1.id,
        'TASK_DELETED',
        {
          taskTitle: 'Cancelled Task',
          reason: 'No longer needed'
        }
      );

      expect(notification).toBeDefined();
      expect(notification.type).toBe('TASK_DELETED');
      expect(notification.title).toBe('Task Deleted');
      expect(notification.message).toContain('Cancelled Task');
      expect(notification.message).toContain('No longer needed');
    });

    test('should create TASK_COMPLETED notification', async () => {
      const notification = await NotificationService.createNotification(
        testUser1.id,
        'TASK_COMPLETED',
        {
          taskTitle: 'Finished Task',
          assigneeName: 'John Doe'
        }
      );

      expect(notification).toBeDefined();
      expect(notification.type).toBe('TASK_COMPLETED');
      expect(notification.title).toBe('Task Completed');
      expect(notification.message).toContain('Finished Task');
      expect(notification.message).toContain('John Doe');
    });

    test('should throw error for invalid notification type', async () => {
      await expect(
        NotificationService.createNotification(
          testUser1.id,
          'INVALID_TYPE',
          {}
        )
      ).rejects.toThrow('Invalid notification type: INVALID_TYPE');
    });
  });

  describe('getUserNotifications', () => {
    beforeEach(async () => {
      // Create multiple notifications for user1
      await NotificationService.createNotification(
        testUser1.id,
        'TASK_ASSIGNED',
        {
          taskTitle: 'Task 1',
          assignerName: 'Manager',
          bountyAmount: 100,
          taskId: testTask.id
        }
      );

      await NotificationService.createNotification(
        testUser1.id,
        'BOUNTY_RECEIVED',
        {
          amount: 150,
          taskId: testTask.id
        }
      );

      // Mark one as read
      const notifications = await Notification.findAll({ where: { userId: testUser1.id } });
      if (notifications.length > 0) {
        notifications[0].readStatus = true;
        await notifications[0].save();
      }

      // Create notification for user2
      await NotificationService.createNotification(
        testUser2.id,
        'TASK_COMPLETED',
        {
          taskTitle: 'Task 1',
          assigneeName: 'John'
        }
      );
    });

    /**
     * Test: Retrieve all notifications for a specific user
     * Purpose: Validates that the service correctly fetches all notifications
     * belonging to a user, ensuring proper data isolation between users.
     */
    test('should get all notifications for a user', async () => {
      const notifications = await NotificationService.getUserNotifications(testUser1.id);

      expect(notifications).toBeDefined();
      expect(notifications.length).toBe(2);
      expect(notifications.every(n => n.userId === testUser1.id)).toBe(true);
    });

    /**
     * Test: Filter to retrieve only unread notifications
     * Purpose: Tests the unreadOnly flag functionality, ensuring users can
     * efficiently fetch only unread notifications without loading entire history.
     */
    test('should get only unread notifications when unreadOnly is true', async () => {
      const notifications = await NotificationService.getUserNotifications(testUser1.id, true);

      expect(notifications).toBeDefined();
      expect(notifications.length).toBe(1);
      expect(notifications[0].readStatus).toBe(false);
    });

    /**
     * Test: Handle users with no notifications gracefully
     * Purpose: Ensures the service returns an empty array rather than null or error
     * when a user has no notifications, maintaining consistent API behavior.
     */
    test('should return empty array for user with no notifications', async () => {
      const user3 = await User.create({
        username: 'user3',
        email: 'user3@test.com',
        password: 'hashedpassword',
        role: 'GOON'
      });

      const notifications = await NotificationService.getUserNotifications(user3.id);

      expect(notifications).toBeDefined();
      expect(notifications.length).toBe(0);
    });

    /**
     * Test: Verify correct chronological ordering of notifications
     * Purpose: Confirms notifications are returned in descending order by creation date
     * (newest first), providing users with the most recent updates at the top.
     */
    test('should order notifications by creation date (newest first)', async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await NotificationService.createNotification(
        testUser1.id,
        'PENALTY_APPLIED',
        {
          amount: 25,
          reason: 'Test'
        }
      );

      const notifications = await NotificationService.getUserNotifications(testUser1.id);

      expect(notifications.length).toBeGreaterThan(1);
      const dates = notifications.map(n => new Date(n.created_at).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });
  });

  describe('getUnreadCount', () => {
    beforeEach(async () => {
      // Create notifications
      await NotificationService.createNotification(
        testUser1.id,
        'TASK_ASSIGNED',
        {
          taskTitle: 'Task 1',
          assignerName: 'Manager',
          bountyAmount: 100
        }
      );

      await NotificationService.createNotification(
        testUser1.id,
        'BOUNTY_RECEIVED',
        {
          amount: 150,
          taskId: testTask.id
        }
      );

      await NotificationService.createNotification(
        testUser1.id,
        'PENALTY_APPLIED',
        {
          amount: 25,
          reason: 'Test'
        }
      );

      // Mark one as read
      const notifications = await Notification.findAll({ where: { userId: testUser1.id } });
      notifications[0].readStatus = true;
      await notifications[0].save();
    });

    /**
     * Test: Calculate accurate unread notification count
     * Purpose: Verifies the service correctly counts only unread notifications,
     * crucial for displaying badge counts in UI elements.
     */
    test('should return correct unread count', async () => {
      const count = await NotificationService.getUnreadCount(testUser1.id);

      expect(count).toBe(2);
    });

    /**
     * Test: Handle users with all notifications read
     * Purpose: Ensures the service returns 0 when all notifications have been read,
     * allowing for proper badge/counter display updates.
     */
    test('should return 0 for user with no unread notifications', async () => {
      await Notification.update(
        { readStatus: true },
        { where: { userId: testUser1.id } }
      );

      const count = await NotificationService.getUnreadCount(testUser1.id);

      expect(count).toBe(0);
    });

    /**
     * Test: Handle new users with zero notifications
     * Purpose: Validates that the count function works correctly for users
     * who haven't received any notifications yet, preventing null pointer errors.
     */
    test('should return 0 for user with no notifications', async () => {
      const user3 = await User.create({
        username: 'user4',
        email: 'user4@test.com',
        password: 'hashedpassword',
        role: 'GOON'
      });

      const count = await NotificationService.getUnreadCount(user3.id);

      expect(count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    let notificationId;

    beforeEach(async () => {
      const notification = await NotificationService.createNotification(
        testUser1.id,
        'TASK_ASSIGNED',
        {
          taskTitle: 'Task 1',
          assignerName: 'Manager',
          bountyAmount: 100
        }
      );
      notificationId = notification.id;
    });

    /**
     * Test: Successfully mark a notification as read
     * Purpose: Verifies that a user can mark their own notification as read,
     * and the change persists in the database.
     */
    test('should mark notification as read', async () => {
      const result = await NotificationService.markAsRead(notificationId, testUser1.id);

      expect(result).toBeDefined();
      expect(result.readStatus).toBe(true);

      const updatedNotification = await Notification.findByPk(notificationId);
      expect(updatedNotification.readStatus).toBe(true);
    });

    /**
     * Test: Reject attempts to mark non-existent notifications
     * Purpose: Ensures proper error handling when trying to mark a notification
     * that doesn't exist, preventing silent failures.
     */
    test('should throw error when notification not found', async () => {
      await expect(
        NotificationService.markAsRead(99999, testUser1.id)
      ).rejects.toThrow('Notification not found');
    });

    /**
     * Test: Prevent users from marking other users' notifications
     * Purpose: Validates authorization logic ensuring users can only mark
     * their own notifications as read, maintaining data security.
     */
    test('should throw error when user tries to mark another user\'s notification', async () => {
      await expect(
        NotificationService.markAsRead(notificationId, testUser2.id)
      ).rejects.toThrow('Notification not found');
    });

    /**
     * Test: Handle idempotent mark as read operations
     * Purpose: Confirms that marking an already-read notification as read
     * again doesn't cause errors (idempotent operation).
     */
    test('should work when notification is already read', async () => {
      await NotificationService.markAsRead(notificationId, testUser1.id);
      const result = await NotificationService.markAsRead(notificationId, testUser1.id);

      expect(result.readStatus).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    beforeEach(async () => {
      // Create multiple unread notifications
      await NotificationService.createNotification(
        testUser1.id,
        'TASK_ASSIGNED',
        {
          taskTitle: 'Task 1',
          assignerName: 'Manager',
          bountyAmount: 100
        }
      );

      await NotificationService.createNotification(
        testUser1.id,
        'BOUNTY_RECEIVED',
        {
          amount: 150,
          taskId: testTask.id
        }
      );

      await NotificationService.createNotification(
        testUser1.id,
        'PENALTY_APPLIED',
        {
          amount: 25,
          reason: 'Test'
        }
      );
    });

    /**
     * Test: Bulk mark all user notifications as read
     * Purpose: Validates the bulk operation that marks all of a user's notifications
     * as read at once, useful for "Mark All as Read" UI buttons.
     */
    test('should mark all notifications as read', async () => {
      const result = await NotificationService.markAllAsRead(testUser1.id);

      expect(result).toBe(true);

      const unreadCount = await NotificationService.getUnreadCount(testUser1.id);
      expect(unreadCount).toBe(0);

      const notifications = await Notification.findAll({ where: { userId: testUser1.id } });
      expect(notifications.every(n => n.readStatus === true)).toBe(true);
    });

    /**
     * Test: Ensure user isolation in bulk mark operation
     * Purpose: Confirms that marking all as read only affects the specified
     * user's notifications, not other users' data.
     */
    test('should only mark current user notifications', async () => {
      await NotificationService.createNotification(
        testUser2.id,
        'TASK_COMPLETED',
        {
          taskTitle: 'Task 1',
          assigneeName: 'John'
        }
      );

      await NotificationService.markAllAsRead(testUser1.id);

      const user2UnreadCount = await NotificationService.getUnreadCount(testUser2.id);
      expect(user2UnreadCount).toBe(1);
    });

    /**
     * Test: Handle marking all as read when none are unread
     * Purpose: Ensures the operation succeeds gracefully even when there are
     * no unread notifications to update (no-op scenario).
     */
    test('should work when no unread notifications exist', async () => {
      await NotificationService.markAllAsRead(testUser1.id);
      const result = await NotificationService.markAllAsRead(testUser1.id);

      expect(result).toBe(true);
    });
  });

  describe('deleteNotification', () => {
    let notificationId;

    beforeEach(async () => {
      const notification = await NotificationService.createNotification(
        testUser1.id,
        'TASK_ASSIGNED',
        {
          taskTitle: 'Task 1',
          assignerName: 'Manager',
          bountyAmount: 100
        }
      );
      notificationId = notification.id;
    });

    /**
     * Test: Successfully delete a notification
     * Purpose: Verifies that users can permanently delete their notifications,
     * and the deletion is properly reflected in the database.
     */
    test('should delete notification', async () => {
      const result = await NotificationService.deleteNotification(notificationId, testUser1.id);

      expect(result).toBe(true);

      const deletedNotification = await Notification.findByPk(notificationId);
      expect(deletedNotification).toBeNull();
    });

    /**
     * Test: Prevent deletion of non-existent notifications
     * Purpose: Ensures appropriate error handling when attempting to delete
     * a notification that doesn't exist or has already been deleted.
     */
    test('should throw error when notification not found', async () => {
      await expect(
        NotificationService.deleteNotification(99999, testUser1.id)
      ).rejects.toThrow('Notification not found');
    });

    /**
     * Test: Prevent unauthorized notification deletion
     * Purpose: Validates authorization ensuring users can only delete their own
     * notifications, maintaining data security and preventing malicious deletion.
     */
    test('should throw error when user tries to delete another user\'s notification', async () => {
      await expect(
        NotificationService.deleteNotification(notificationId, testUser2.id)
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('notifyMultipleUsers', () => {
    /**
     * Test: Bulk notification creation for multiple users
     * Purpose: Validates efficient bulk notification creation when the same
     * notification needs to be sent to multiple users simultaneously.
     */
    test('should create notifications for multiple users', async () => {
      const userIds = [testUser1.id, testUser2.id];

      const count = await NotificationService.notifyMultipleUsers(
        userIds,
        'TASK_ASSIGNED',
        {
          taskTitle: 'Group Task',
          assignerName: 'Manager',
          bountyAmount: 200
        }
      );

      expect(count).toBe(2);

      const user1Notifications = await Notification.findAll({ where: { userId: testUser1.id } });
      const user2Notifications = await Notification.findAll({ where: { userId: testUser2.id } });

      expect(user1Notifications.length).toBe(1);
      expect(user2Notifications.length).toBe(1);
      expect(user1Notifications[0].message).toContain('Group Task');
      expect(user2Notifications[0].message).toContain('Group Task');
    });

    /**
     * Test: Reject bulk notifications with invalid type
     * Purpose: Ensures bulk notification operations also validate notification
     * types, preventing mass creation of invalid notifications.
     */
    test('should throw error for invalid notification type', async () => {
      await expect(
        NotificationService.notifyMultipleUsers(
          [testUser1.id],
          'INVALID_TYPE',
          {}
        )
      ).rejects.toThrow('Invalid notification type: INVALID_TYPE');
    });

    /**
     * Test: Handle empty recipient list gracefully
     * Purpose: Confirms the bulk notification function handles empty user arrays
     * without errors, returning 0 created notifications.
     */
    test('should work with empty user array', async () => {
      const count = await NotificationService.notifyMultipleUsers(
        [],
        'TASK_ASSIGNED',
        {
          taskTitle: 'Task',
          assignerName: 'Manager',
          bountyAmount: 100
        }
      );

      expect(count).toBe(0);
    });
  });

  describe('cleanupOldNotifications', () => {
    beforeEach(async () => {
      // Create old read notification (35 days ago)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35);

      await Notification.create({
        userId: testUser1.id,
        type: 'TASK_ASSIGNED',
        title: 'Old Task',
        message: 'Old notification',
        readStatus: true,
        created_at: oldDate
      });

      // Create recent read notification
      await NotificationService.createNotification(
        testUser1.id,
        'TASK_ASSIGNED',
        {
          taskTitle: 'Recent Task',
          assignerName: 'Manager',
          bountyAmount: 100
        }
      );

      const recentNotifications = await Notification.findAll({ 
        where: { userId: testUser1.id },
        order: [['created_at', 'DESC']]
      });
      
      if (recentNotifications.length > 0) {
        recentNotifications[0].readStatus = true;
        await recentNotifications[0].save();
      }

      // Create old unread notification (should not be deleted)
      await Notification.create({
        userId: testUser1.id,
        type: 'BOUNTY_RECEIVED',
        title: 'Old Bounty',
        message: 'Old unread notification',
        readStatus: false,
        created_at: oldDate
      });
    });

    /**
     * Test: Cleanup old read notifications beyond retention period
     * Purpose: Validates the maintenance function that removes old read notifications
     * to prevent database bloat while preserving recent and unread notifications.
     */
    test('should delete old read notifications', async () => {
      const deletedCount = await NotificationService.cleanupOldNotifications(30);

      expect(deletedCount).toBe(1);

      const remainingNotifications = await Notification.findAll({ where: { userId: testUser1.id } });
      expect(remainingNotifications.length).toBe(2);
    });

    /**
     * Test: Preserve unread notifications regardless of age
     * Purpose: Ensures cleanup operations never delete unread notifications,
     * even if they're old, preventing loss of important unseen information.
     */
    test('should not delete unread notifications', async () => {
      await NotificationService.cleanupOldNotifications(30);

      const unreadNotifications = await Notification.findAll({
        where: {
          userId: testUser1.id,
          readStatus: false
        }
      });

      expect(unreadNotifications.length).toBe(1);
    });

    /**
     * Test: Preserve recent notifications within retention period
     * Purpose: Confirms cleanup only targets notifications older than the specified
     * retention period, keeping recent notifications intact even if read.
     */
    test('should not delete recent notifications', async () => {
      await NotificationService.cleanupOldNotifications(30);

      const recentNotifications = await Notification.findAll({
        where: { userId: testUser1.id },
        order: [['created_at', 'DESC']],
        limit: 1
      });

      expect(recentNotifications.length).toBe(1);
      expect(recentNotifications[0].message).toContain('Recent Task');
    });

    /**
     * Test: Handle cleanup when no old notifications exist
     * Purpose: Ensures cleanup function returns 0 and completes successfully
     * when there are no old notifications to delete.
     */
    test('should return 0 when no old notifications exist', async () => {
      await Notification.destroy({ where: {} });

      await NotificationService.createNotification(
        testUser1.id,
        'TASK_ASSIGNED',
        {
          taskTitle: 'New Task',
          assignerName: 'Manager',
          bountyAmount: 100
        }
      );

      const deletedCount = await NotificationService.cleanupOldNotifications(30);

      expect(deletedCount).toBe(0);
    });
  });

  describe('Error handling coverage', () => {
    /**
     * Test: Handle database constraint violations
     * Purpose: Verifies proper error handling when database constraints (like
     * NOT NULL on userId) are violated during notification creation.
     */
    test('should handle error during notification creation with invalid userId', async () => {
      // Try to create notification with null userId which should cause a database constraint error
      await expect(
        NotificationService.createNotification(
          null, // Invalid userId
          'TASK_ASSIGNED',
          {
            taskTitle: 'Test',
            assignerName: 'Manager',
            bountyAmount: 100
          }
        )
      ).rejects.toThrow();
    });

    /**
     * Test: Handle database errors in createNotification
     * Purpose: Tests error handling and logging when database operations fail
     * during notification creation, ensuring errors are properly propagated.
     */
    test('should handle database error in createNotification', async () => {
      // Mock Notification.create to throw an error
      const originalCreate = Notification.create;
      Notification.create = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        NotificationService.createNotification(
          testUser1.id,
          'TASK_ASSIGNED',
          {
            taskTitle: 'Test',
            assignerName: 'Manager',
            bountyAmount: 100
          }
        )
      ).rejects.toThrow('Database error');

      Notification.create = originalCreate;
    });

    /**
     * Test: Handle database errors in getUserNotifications
     * Purpose: Validates error handling when fetching user notifications fails,
     * ensuring the error is logged and re-thrown for proper API error responses.
     */
    test('should handle database error in getUserNotifications', async () => {
      const originalFindAll = Notification.findAll;
      Notification.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        NotificationService.getUserNotifications(testUser1.id)
      ).rejects.toThrow('Database error');

      Notification.findAll = originalFindAll;
    });

    /**
     * Test: Handle database errors in getUnreadCount
     * Purpose: Tests error handling when counting unread notifications fails,
     * important for UI badge/counter display error scenarios.
     */
    test('should handle database error in getUnreadCount', async () => {
      const originalCount = Notification.count;
      Notification.count = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        NotificationService.getUnreadCount(testUser1.id)
      ).rejects.toThrow('Database error');

      Notification.count = originalCount;
    });

    /**
     * Test: Handle database errors in markAsRead
     * Purpose: Validates error handling during notification mark-as-read operations,
     * ensuring database failures are properly caught and reported.
     */
    test('should handle database error in markAsRead', async () => {
      const notification = await NotificationService.createNotification(
        testUser1.id,
        'TASK_ASSIGNED',
        {
          taskTitle: 'Test',
          assignerName: 'Manager',
          bountyAmount: 100
        }
      );

      const originalFindOne = Notification.findOne;
      Notification.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        NotificationService.markAsRead(notification.id, testUser1.id)
      ).rejects.toThrow('Database error');

      Notification.findOne = originalFindOne;
    });

    /**
     * Test: Handle database errors in markAllAsRead
     * Purpose: Tests bulk update error handling, ensuring failures during
     * "mark all as read" operations are properly managed and reported.
     */
    test('should handle database error in markAllAsRead', async () => {
      const originalUpdate = Notification.update;
      Notification.update = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        NotificationService.markAllAsRead(testUser1.id)
      ).rejects.toThrow('Database error');

      Notification.update = originalUpdate;
    });

    /**
     * Test: Handle database errors in deleteNotification
     * Purpose: Validates error handling when notification deletion fails,
     * ensuring users are informed of deletion failures appropriately.
     */
    test('should handle database error in deleteNotification', async () => {
      const notification = await NotificationService.createNotification(
        testUser1.id,
        'TASK_ASSIGNED',
        {
          taskTitle: 'Test',
          assignerName: 'Manager',
          bountyAmount: 100
        }
      );

      const originalDestroy = Notification.destroy;
      Notification.destroy = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        NotificationService.deleteNotification(notification.id, testUser1.id)
      ).rejects.toThrow('Database error');

      Notification.destroy = originalDestroy;
    });

    /**
     * Test: Handle database errors in notifyMultipleUsers
     * Purpose: Tests bulk notification creation error handling, ensuring failures
     * in mass notification operations are caught and properly reported.
     */
    test('should handle database error in notifyMultipleUsers', async () => {
      const originalBulkCreate = Notification.bulkCreate;
      Notification.bulkCreate = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        NotificationService.notifyMultipleUsers(
          [testUser1.id, testUser2.id],
          'TASK_ASSIGNED',
          {
            taskTitle: 'Test',
            assignerName: 'Manager',
            bountyAmount: 100
          }
        )
      ).rejects.toThrow('Database error');

      Notification.bulkCreate = originalBulkCreate;
    });

    /**
     * Test: Handle database errors in cleanupOldNotifications
     * Purpose: Validates error handling in the cleanup maintenance task,
     * ensuring cleanup job failures are logged and don't silently fail.
     */
    test('should handle database error in cleanupOldNotifications', async () => {
      const originalDestroy = Notification.destroy;
      Notification.destroy = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        NotificationService.cleanupOldNotifications(30)
      ).rejects.toThrow('Database error');

      Notification.destroy = originalDestroy;
    });
  });
});
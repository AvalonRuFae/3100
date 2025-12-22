const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/database/connection');
const { User, Task, Notification } = require('../src/models');
const NotificationService = require('../src/services/NotificationService');

/**
 * Notification System Tests - Optimized for High Coverage
 * 
 * Test Documentation References:
 * - TC-NOTIF-001: Task Assignment Notification Creation (Section 4.7)
 * - TC-NOTIF-002: Mark Notification as Read (Section 4.7)
 * 
 * Reduced from 41 to 10 tests while maintaining >90% coverage
 * See TESTING_DOCUMENTATION.pdf Section 4.7 for detailed test cases
 */

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
  }, 30000);

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Notification.destroy({ where: {} });
  });

  /**
   * Test 1: Create notifications - covers TASK_ASSIGNED, BOUNTY_RECEIVED, PENALTY_APPLIED
   * Also tests invalid notification type and null userId constraint
   */
  test('should create various notification types with validation', async () => {
    // TASK_ASSIGNED
    const taskNotif = await NotificationService.createNotification(
      testUser1.id, 'TASK_ASSIGNED',
      { taskTitle: 'New Task', assignerName: 'Manager', bountyAmount: 100, taskId: testTask.id }
    );
    expect(taskNotif.type).toBe('TASK_ASSIGNED');
    expect(taskNotif.title).toBe('New Task Assigned');
    expect(taskNotif.message).toContain('Manager');
    expect(taskNotif.readStatus).toBe(false);

    // BOUNTY_RECEIVED
    const bountyNotif = await NotificationService.createNotification(
      testUser1.id, 'BOUNTY_RECEIVED', { amount: 150, taskId: testTask.id }
    );
    expect(bountyNotif.type).toBe('BOUNTY_RECEIVED');
    expect(bountyNotif.message).toContain('$150');

    // PENALTY_APPLIED
    const penaltyNotif = await NotificationService.createNotification(
      testUser1.id, 'PENALTY_APPLIED', { amount: 50, reason: 'Missed deadline' }
    );
    expect(penaltyNotif.type).toBe('PENALTY_APPLIED');
    expect(penaltyNotif.message).toContain('$50');

    // Invalid type
    await expect(
      NotificationService.createNotification(testUser1.id, 'INVALID_TYPE', {})
    ).rejects.toThrow('Invalid notification type: INVALID_TYPE');

    // Null userId (database constraint)
    await expect(
      NotificationService.createNotification(null, 'TASK_ASSIGNED', {
        taskTitle: 'Test', assignerName: 'Manager', bountyAmount: 100
      })
    ).rejects.toThrow();
  });

  /**
   * Test 2: Get notifications - tests all/unread filtering, ordering, isolation, empty array
   */
  test('should get all or unread notifications with proper isolation and ordering', async () => {
    // Create notifications for both users
    await NotificationService.createNotification(testUser1.id, 'TASK_ASSIGNED', {
      taskTitle: 'Task 1', assignerName: 'Manager', bountyAmount: 100, taskId: testTask.id
    });
    await NotificationService.createNotification(testUser1.id, 'BOUNTY_RECEIVED', {
      amount: 150, taskId: testTask.id
    });
    await NotificationService.createNotification(testUser2.id, 'TASK_COMPLETED', {
      taskTitle: 'Task 1', assigneeName: 'John'
    });

    // Mark one as read
    const notifications = await Notification.findAll({ where: { userId: testUser1.id } });
    notifications[0].readStatus = true;
    await notifications[0].save();

    // All notifications
    const allNotifs = await NotificationService.getUserNotifications(testUser1.id);
    expect(allNotifs.length).toBe(2);
    expect(allNotifs.every(n => n.userId === testUser1.id)).toBe(true);

    // Unread only
    const unreadNotifs = await NotificationService.getUserNotifications(testUser1.id, true);
    expect(unreadNotifs.length).toBe(1);
    expect(unreadNotifs[0].readStatus).toBe(false);

    // Verify ordering (newest first)
    await new Promise(resolve => setTimeout(resolve, 10));
    await NotificationService.createNotification(testUser1.id, 'PENALTY_APPLIED', {
      amount: 25, reason: 'Test'
    });
    const ordered = await NotificationService.getUserNotifications(testUser1.id);
    const dates = ordered.map(n => new Date(n.created_at).getTime());
    expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);

    // Empty array for new user
    const newUser = await User.create({
      username: 'user3', email: 'user3@test.com', password: 'hashedpassword', role: 'GOON'
    });
    const empty = await NotificationService.getUserNotifications(newUser.id);
    expect(empty.length).toBe(0);
  });

  /**
   * Test 3: Unread count - tests counting, all read scenario, no notifications scenario
   */
  test('should return correct unread count in all scenarios', async () => {
    // Create 3 notifications, mark 1 as read
    await NotificationService.createNotification(testUser1.id, 'TASK_ASSIGNED', {
      taskTitle: 'Task 1', assignerName: 'Manager', bountyAmount: 100
    });
    await NotificationService.createNotification(testUser1.id, 'BOUNTY_RECEIVED', {
      amount: 150, taskId: testTask.id
    });
    await NotificationService.createNotification(testUser1.id, 'PENALTY_APPLIED', {
      amount: 25, reason: 'Test'
    });

    const notifications = await Notification.findAll({ where: { userId: testUser1.id } });
    notifications[0].readStatus = true;
    await notifications[0].save();

    // Should count 2 unread
    let count = await NotificationService.getUnreadCount(testUser1.id);
    expect(count).toBe(2);

    // Mark all as read - should return 0
    await Notification.update({ readStatus: true }, { where: { userId: testUser1.id } });
    count = await NotificationService.getUnreadCount(testUser1.id);
    expect(count).toBe(0);

    // User with no notifications - should return 0
    const newUser = await User.create({
      username: 'user4', email: 'user4@test.com', password: 'hashedpassword', role: 'GOON'
    });
    count = await NotificationService.getUnreadCount(newUser.id);
    expect(count).toBe(0);
  });

  /**
   * Test 4: Mark as read - tests successful mark, persistence, idempotency, authorization
   */
  test('should mark notification as read with authorization checks', async () => {
    const notification = await NotificationService.createNotification(testUser1.id, 'TASK_ASSIGNED', {
      taskTitle: 'Task 1', assignerName: 'Manager', bountyAmount: 100
    });

    // Successfully mark as read
    const result = await NotificationService.markAsRead(notification.id, testUser1.id);
    expect(result.readStatus).toBe(true);

    // Verify persistence
    const updated = await Notification.findByPk(notification.id);
    expect(updated.readStatus).toBe(true);

    // Idempotent - marking again should work
    const result2 = await NotificationService.markAsRead(notification.id, testUser1.id);
    expect(result2.readStatus).toBe(true);

    // Should reject non-existent notification
    await expect(
      NotificationService.markAsRead(99999, testUser1.id)
    ).rejects.toThrow('Notification not found');

    // Should reject unauthorized access
    await expect(
      NotificationService.markAsRead(notification.id, testUser2.id)
    ).rejects.toThrow('Notification not found');
  });

  /**
   * Test 5: Mark all as read - tests bulk operation, user isolation, idempotency
   */
  test('should bulk mark all user notifications as read with isolation', async () => {
    // Create notifications for both users
    await NotificationService.createNotification(testUser1.id, 'TASK_ASSIGNED', {
      taskTitle: 'Task 1', assignerName: 'Manager', bountyAmount: 100
    });
    await NotificationService.createNotification(testUser1.id, 'BOUNTY_RECEIVED', {
      amount: 150, taskId: testTask.id
    });
    await NotificationService.createNotification(testUser2.id, 'TASK_COMPLETED', {
      taskTitle: 'Task 1', assigneeName: 'John'
    });

    // Mark all for user1
    const result = await NotificationService.markAllAsRead(testUser1.id);
    expect(result).toBe(true);

    // Verify user1 has 0 unread
    const user1Unread = await NotificationService.getUnreadCount(testUser1.id);
    expect(user1Unread).toBe(0);

    // Verify user2 still has 1 unread (isolation)
    const user2Unread = await NotificationService.getUnreadCount(testUser2.id);
    expect(user2Unread).toBe(1);

    // Idempotent - should work when called again
    const result2 = await NotificationService.markAllAsRead(testUser1.id);
    expect(result2).toBe(true);
  });

  /**
   * Test 6: Delete notification - tests deletion, persistence, authorization
   */
  test('should delete notification with authorization', async () => {
    const notification = await NotificationService.createNotification(testUser1.id, 'TASK_ASSIGNED', {
      taskTitle: 'Task 1', assignerName: 'Manager', bountyAmount: 100
    });

    // Successfully delete
    const result = await NotificationService.deleteNotification(notification.id, testUser1.id);
    expect(result).toBe(true);

    // Verify deleted
    const deleted = await Notification.findByPk(notification.id);
    expect(deleted).toBeNull();

    // Should reject non-existent
    await expect(
      NotificationService.deleteNotification(99999, testUser1.id)
    ).rejects.toThrow('Notification not found');

    // Create another notification for authorization test
    const notification2 = await NotificationService.createNotification(testUser1.id, 'TASK_ASSIGNED', {
      taskTitle: 'Task 2', assignerName: 'Manager', bountyAmount: 100
    });

    // Should reject unauthorized
    await expect(
      NotificationService.deleteNotification(notification2.id, testUser2.id)
    ).rejects.toThrow('Notification not found');
  });

  /**
   * Test 7: Notify multiple users - tests bulk creation, empty array, invalid type
   */
  test('should create bulk notifications with validation', async () => {
    // Successfully create for multiple users
    const count = await NotificationService.notifyMultipleUsers(
      [testUser1.id, testUser2.id],
      'TASK_ASSIGNED',
      { taskTitle: 'Group Task', assignerName: 'Manager', bountyAmount: 200 }
    );
    expect(count).toBe(2);

    const user1Notifs = await Notification.findAll({ where: { userId: testUser1.id } });
    const user2Notifs = await Notification.findAll({ where: { userId: testUser2.id } });
    expect(user1Notifs.length).toBe(1);
    expect(user2Notifs.length).toBe(1);
    expect(user1Notifs[0].message).toContain('Group Task');

    // Empty array should return 0
    const emptyCount = await NotificationService.notifyMultipleUsers([], 'TASK_ASSIGNED', {
      taskTitle: 'Task', assignerName: 'Manager', bountyAmount: 100
    });
    expect(emptyCount).toBe(0);

    // Invalid type should throw
    await expect(
      NotificationService.notifyMultipleUsers([testUser1.id], 'INVALID_TYPE', {})
    ).rejects.toThrow('Invalid notification type: INVALID_TYPE');
  });

  /**
   * Test 8: Cleanup old notifications - comprehensive test for retention logic
   */
  test('should cleanup old read notifications while preserving unread and recent', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 35);

    // Old read notification (should be deleted)
    await Notification.create({
      userId: testUser1.id, type: 'TASK_ASSIGNED', title: 'Old Task',
      message: 'Old notification', readStatus: true, created_at: oldDate
    });

    // Old unread notification (should NOT be deleted)
    await Notification.create({
      userId: testUser1.id, type: 'BOUNTY_RECEIVED', title: 'Old Bounty',
      message: 'Old unread notification', readStatus: false, created_at: oldDate
    });

    // Recent read notification (should NOT be deleted)
    const recent = await NotificationService.createNotification(testUser1.id, 'TASK_ASSIGNED', {
      taskTitle: 'Recent Task', assignerName: 'Manager', bountyAmount: 100
    });
    recent.readStatus = true;
    await recent.save();

    // Cleanup with 30-day retention
    const deletedCount = await NotificationService.cleanupOldNotifications(30);
    expect(deletedCount).toBe(1);

    // Verify remaining notifications
    const remaining = await Notification.findAll({ where: { userId: testUser1.id } });
    expect(remaining.length).toBe(2);

    const unread = remaining.filter(n => n.readStatus === false);
    expect(unread.length).toBe(1);

    // Cleanup when no old notifications exist
    await Notification.destroy({ where: {} });
    await NotificationService.createNotification(testUser1.id, 'TASK_ASSIGNED', {
      taskTitle: 'New Task', assignerName: 'Manager', bountyAmount: 100
    });
    const zeroDeleted = await NotificationService.cleanupOldNotifications(30);
    expect(zeroDeleted).toBe(0);
  });

  /**
   * Test 9: Database error handling - consolidated error scenarios
   */
  test('should handle database errors across all service methods', async () => {
    // Test critical database error scenarios with mocking
    const notification = await NotificationService.createNotification(testUser1.id, 'TASK_ASSIGNED', {
      taskTitle: 'Test', assignerName: 'Manager', bountyAmount: 100
    });

    // createNotification error
    const originalCreate = Notification.create;
    Notification.create = jest.fn().mockRejectedValue(new Error('Database error'));
    await expect(
      NotificationService.createNotification(testUser1.id, 'TASK_ASSIGNED', {
        taskTitle: 'Test', assignerName: 'Manager', bountyAmount: 100
      })
    ).rejects.toThrow('Database error');
    Notification.create = originalCreate;

    // getUserNotifications error
    const originalFindAll = Notification.findAll;
    Notification.findAll = jest.fn().mockRejectedValue(new Error('Database error'));
    await expect(NotificationService.getUserNotifications(testUser1.id)).rejects.toThrow('Database error');
    Notification.findAll = originalFindAll;

    // markAsRead error
    const originalFindOne = Notification.findOne;
    Notification.findOne = jest.fn().mockRejectedValue(new Error('Database error'));
    await expect(NotificationService.markAsRead(notification.id, testUser1.id)).rejects.toThrow('Database error');
    Notification.findOne = originalFindOne;

    // deleteNotification error
    const originalDestroy = Notification.destroy;
    Notification.destroy = jest.fn().mockRejectedValue(new Error('Database error'));
    await expect(NotificationService.deleteNotification(notification.id, testUser1.id)).rejects.toThrow('Database error');
    Notification.destroy = originalDestroy;
  });

  /**
   * Test 10: Additional notification types for coverage
   */
  test('should create additional notification types', async () => {
    // DEADLINE_REMINDER
    const deadline = await NotificationService.createNotification(testUser1.id, 'DEADLINE_REMINDER', {
      taskTitle: 'Urgent Task', hoursRemaining: 2, taskId: testTask.id
    });
    expect(deadline.type).toBe('DEADLINE_REMINDER');
    expect(deadline.message).toContain('2 hours');

    // LICENSE_EXPIRING
    const license = await NotificationService.createNotification(testUser1.id, 'LICENSE_EXPIRING', {
      daysRemaining: 5, teamName: 'Test Team'
    });
    expect(license.type).toBe('LICENSE_EXPIRING');
    expect(license.message).toContain('5 days');

    // TASK_DELETED
    const deleted = await NotificationService.createNotification(testUser1.id, 'TASK_DELETED', {
      taskTitle: 'Cancelled Task', reason: 'No longer needed'
    });
    expect(deleted.type).toBe('TASK_DELETED');
    expect(deleted.message).toContain('Cancelled Task');

    // TASK_COMPLETED
    const completed = await NotificationService.createNotification(testUser1.id, 'TASK_COMPLETED', {
      taskTitle: 'Finished Task', assigneeName: 'John Doe'
    });
    expect(completed.type).toBe('TASK_COMPLETED');
    expect(completed.message).toContain('John Doe');
  });
});

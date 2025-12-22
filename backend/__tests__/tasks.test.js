const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/database/connection');
const { User, Task, License, Team } = require('../src/models');

/**
 * Task API Tests
 * 
 * Test Documentation References:
 * - TC-TASK-001: Hashira Can Create Tasks (Section 4.2)
 * - TC-TASK-002: GOON Cannot Create Tasks (Section 4.2)
 * - TC-TASK-003: Task Status Update by Assigned User (Section 4.2)
 * - TC-TASK-004: Task Deletion by Creator (Section 4.2)
 * - TC-TASK-005: Prevent Deletion of Assigned Tasks (Section 4.2)
 * 
 * See TESTING_DOCUMENTATION.pdf Section 4.2 for detailed test cases
 */

describe('Task API', () => {
  let goonToken, hashiraToken, adminToken;
  let hashiraId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test users
    const goon = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'goon',
        email: 'goon@test.com',
        password: 'Test123!',
        role: 'GOON'
      });

    const hashira = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'hashira',
        email: 'hashira@test.com',
        password: 'Test123!',
        role: 'HASHIRA'
      });

    hashiraId = hashira.body.data.id;

    const admin = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'admin',
        email: 'admin@test.com',
        password: 'Test123!',
        role: 'OYAKATASAMA'
      });

    // Login to get tokens
    const goonLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'goon', password: 'Test123!' });
    goonToken = goonLogin.body.data.token;

    const hashiraLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'hashira', password: 'Test123!' });
    hashiraToken = hashiraLogin.body.data.token;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Test123!' });
    adminToken = adminLogin.body.data.token;

    // Create a Team with the admin as creator and assign the created users to that team
    const team = await Team.create({ name: 'Test Team', description: 'Team for tests', createdBy: admin.body.data.id });

    // Update created users so they belong to the team (validateLicense reads req.user.teamId)
    const allUsers = await User.findAll();
    for (const u of allUsers) {
      await u.update({ teamId: team.id });
    }

    // Create a license and assign to users (include required teamId and expirationDate)
    const license = await License.create({
      teamId: team.id,
      teamName: 'Test Team',
      licenseKey: 'TEST-2024-LICENSE',
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      maxUsers: 10
    });

    const users = await User.findAll();
    for (const user of users) {
      await user.addLicense(license);
    }
  }, 30000);

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/v1/tasks', () => {
    /**
     * Test Case: TC-TASK-001
     * Reference: TESTING_DOCUMENTATION Section 4.2
     * Test: Create Task (Hashira)
     * Purpose: Verify that users with role HASHIRA (and OYAKATASAMA) can create tasks
     * and that required fields are validated.
     * Priority: High | Category: Functional Testing + Authorization
     */
    it('should allow Hashira to create task', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          title: 'Test Task',
          description: 'This is a test task description with enough characters',
          bountyAmount: 100.00,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'HIGH',
          tags: ['test', 'backend']
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Task');
    });

  /**
   * Test: Create Task (Goon forbidden)
   * Purpose: Confirm that users with role GOON are forbidden from creating tasks.
   */
  it('should not allow Goon to create task', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${goonToken}`)
        .send({
          title: 'Test Task 2',
          description: 'This is a test task description with enough characters',
          bountyAmount: 100.00,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'HIGH'
        });

      expect(res.statusCode).toBe(403);
    });

  /**
   * Test: Create Task (validation)
   * Purpose: Ensure the API returns 400 when required task fields are missing or invalid.
   */
  it('should fail with missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          title: 'Test Task 3'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/tasks', () => {
    /**
     * Test: Get All Tasks
     * Purpose: Verify that authenticated users can fetch the list of tasks and
     * that the response is an array.
     */
    it('should get all tasks', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

  /**
   * Test: Filter Tasks by Status
   * Purpose: Ensure the API supports filtering tasks by the `status` query parameter.
   */
  it('should filter tasks by status', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?status=AVAILABLE')
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.every(task => task.status === 'AVAILABLE')).toBe(true);
    });
  });

  describe('GET /api/v1/tasks/board', () => {
    /**
     * Test: Get Kanban Board
     * Purpose: Return tasks grouped by status to support the board/kanban view.
     */
    it('should get kanban board', async () => {
      const res = await request(app)
        .get('/api/v1/tasks/board')
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('available');
      expect(res.body.data).toHaveProperty('inProgress');
      expect(res.body.data).toHaveProperty('review');
      expect(res.body.data).toHaveProperty('completed');
    });
  });

  describe('POST /api/v1/tasks/:id/assign', () => {
    let taskId;

    beforeAll(async () => {
      const task = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          title: 'Assignable Task',
          description: 'This task will be assigned to goon for testing purposes',
          bountyAmount: 150.00,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'MEDIUM'
        });

      taskId = task.body.data.id;
    }, 30000);

  /**
   * Test: Assign Task to Self
   * Purpose: Confirm a GOON can claim/assign an available task to themselves.
   */
  it('should allow Goon to assign task to themselves', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

  /**
   * Test: Assign Already Assigned Task
   * Purpose: Ensure assigning a task that is already assigned results in an error.
   */
  it('should not allow assigning already assigned task', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.statusCode).toBe(500);
    });
  });

  describe('PUT /api/v1/tasks/:id/status', () => {
    let taskId;

    beforeAll(async () => {
      const task = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          title: 'Status Update Task',
          description: 'This task will be used to test status updates functionality',
          bountyAmount: 200.00,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'HIGH'
        });

      taskId = task.body.data.id;

      await request(app)
        .post(`/api/v1/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${goonToken}`);
    }, 30000);

  /**
   * Test: Update Task Status by Assignee
   * Purpose: Verify that the assigned user can update the task status (e.g., to REVIEW).
   */
  it('should allow assigned user to update status', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${goonToken}`)
        .send({
          status: 'REVIEW'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('REVIEW');
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('should get task by ID', async () => {
      const createRes = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          title: 'Get by ID Task',
          description: 'Task to test getting by ID',
          bountyAmount: 50.00,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'LOW'
        });

      const taskId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(taskId);
      expect(res.body.data.title).toBe('Get by ID Task');
    });

    it('should return 500 for non-existent task', async () => {
      const res = await request(app)
        .get('/api/v1/tasks/99999')
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.statusCode).toBe(500);
    });
  });

  describe('PUT /api/v1/tasks/:id', () => {
    it('should allow creator to update task', async () => {
      const createRes = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          title: 'Update Test Task',
          description: 'Task to test updates',
          bountyAmount: 75.00,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'MEDIUM'
        });

      const taskId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          title: 'Updated Title',
          bountyAmount: 100.00
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
      expect(parseFloat(res.body.data.bountyAmount)).toBe(100);
    });

    it('should not allow non-creator to update bounty amount', async () => {
      const createRes = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          title: 'Update Permission Test',
          description: 'Task to test permission',
          bountyAmount: 50.00,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'LOW'
        });

      const taskId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${goonToken}`)
        .send({
          bountyAmount: 200.00
        });

      expect(res.statusCode).toBe(500);
    });

    it('should allow admin to update any task', async () => {
      const createRes = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          title: 'Admin Update Test',
          description: 'Task for admin update test',
          bountyAmount: 60.00,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'HIGH'
        });

      const taskId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bountyAmount: 150.00,
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(res.statusCode).toBe(200);
      expect(parseFloat(res.body.data.bountyAmount)).toBe(150);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('should allow creator to delete available task', async () => {
      const createRes = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          title: 'Delete Test Task',
          description: 'Task to be deleted',
          bountyAmount: 40.00,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'LOW'
        });

      const taskId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${hashiraToken}`);

      expect(res.statusCode).toBe(200);
    });

    it('should not allow deleting assigned task', async () => {
      const createRes = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          title: 'Assigned Delete Test',
          description: 'Task that will be assigned',
          bountyAmount: 80.00,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'MEDIUM'
        });

      const taskId = createRes.body.data.id;

      await request(app)
        .post(`/api/v1/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${goonToken}`);

      const res = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${hashiraToken}`);

      expect(res.statusCode).toBe(500);
    });

    it('should not allow non-creator goon to delete task', async () => {
      const createRes = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          title: 'Permission Delete Test',
          description: 'Test permissions',
          bountyAmount: 30.00,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'LOW'
        });

      const taskId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should allow admin to delete any task', async () => {
      const createRes = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          title: 'Admin Delete Test',
          description: 'Task for admin deletion',
          bountyAmount: 35.00,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'LOW'
        });

      const taskId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('Task filters and search', () => {
    it('should filter tasks by priority', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?priority=HIGH')
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.every(task => task.priority === 'HIGH')).toBe(true);
    });

    it('should filter tasks by createdBy', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks?createdBy=${hashiraId}`)
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.every(task => task.createdBy === hashiraId)).toBe(true);
    });

    it('should search tasks by title/description', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?search=Test')
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Task completion with bounty/penalty', () => {
    it('should pay bounty when task completed on time', async () => {
      const createRes = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          title: 'Bounty Payment Task',
          description: 'Complete on time for bounty',
          bountyAmount: 200.00,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'HIGH'
        });

      const taskId = createRes.body.data.id;

      await request(app)
        .post(`/api/v1/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${goonToken}`);

      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${goonToken}`)
        .send({ status: 'COMPLETED' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
    });

    it('should not allow non-assigned user to update task status', async () => {
      const createRes = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          title: 'Permission Status Test',
          description: 'Test status permission',
          bountyAmount: 50.00,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'LOW'
        });

      const taskId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${goonToken}`)
        .send({ status: 'COMPLETED' });

      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /api/v1/tasks/statistics', () => {
    it('should get task statistics', async () => {
      const res = await request(app)
        .get('/api/v1/tasks/statistics')
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('byStatus');
      expect(res.body.data).toHaveProperty('averageBounty');
    });
  });
});
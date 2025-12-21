const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/database/connection');
const { User, Task, Transaction, License, Team } = require('../src/models');

describe('Bounty endpoints (integration)', () => {
  let adminToken, userToken, adminUser, normalUser, testTask, license;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create admin user
    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'admin', email: 'admin@test.com', password: 'Admin123!', role: 'OYAKATASAMA' });

    adminUser = adminRes.body.data;

    // Create normal user
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'user1', email: 'user1@test.com', password: 'User123!', role: 'GOON' });

    normalUser = userRes.body.data;

    // Login to get tokens
    const adminLogin = await request(app).post('/api/v1/auth/login').send({ username: 'admin', password: 'Admin123!' });
    adminToken = adminLogin.body.data.token;

    const userLogin = await request(app).post('/api/v1/auth/login').send({ username: 'user1', password: 'User123!' });
    userToken = userLogin.body.data.token;

    // Create a Team and assign it to both users so validateLicense middleware can look up team licenses
    const team = await Team.create({ name: 'Team A', description: 'Test team', createdBy: adminUser.id });

  // Update users to belong to the created team (adminUser/normalUser are plain objects returned by the API)
  await User.update({ teamId: team.id }, { where: { id: adminUser.id } });
  await User.update({ teamId: team.id }, { where: { id: normalUser.id } });

    // Create a license record for the team and assign to all users so middleware permits task/bounty actions
    license = await License.create({
      teamId: team.id,
      teamName: 'Team A',
      licenseKey: 'LICENSE-123',
      expirationDate: new Date(Date.now() + 86400000),
      isActive: true,
      maxUsers: 10
    });

    // Assign license to all users so validateLicense middleware will find an active license
    const users = await User.findAll();
    for (const u of users) {
      if (typeof u.addLicense === 'function') {
        await u.addLicense(license);
      }
    }

    // Create a task assigned to normalUser
    testTask = await Task.create({
      title: 'Bounty Task',
      description: 'Task for bounty tests',
      createdBy: adminUser.id,
      assignedTo: normalUser.id,
      bountyAmount: 100,
      priority: 'MEDIUM',
      status: 'AVAILABLE',
      deadline: new Date(Date.now() + 86400000)
    });

    // Create transactions: one bounty (positive) and one penalty (negative)
    await Transaction.create({ userId: normalUser.id, taskId: testTask.id, type: 'BOUNTY', amount: 100.00, description: 'Test bounty', balanceBefore: 0, balanceAfter: 100 });
    await Transaction.create({ userId: normalUser.id, taskId: testTask.id, type: 'PENALTY', amount: -10.00, description: 'Test penalty', balanceBefore: 100, balanceAfter: 90 });
  }, 30000);

  afterAll(async () => {
    await sequelize.close();
  });

  /**
   * Test: GET /api/v1/bounties/statistics
   * Purpose: Ensure aggregated bounty statistics (total paid, total penalties, counts, average)
   * are returned correctly for a user with transactions.
   */
  test('GET /api/v1/bounties/statistics returns correct aggregated values', async () => {
    const res = await request(app)
      .get('/api/v1/bounties/statistics')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const stats = res.body.data;
    expect(stats.totalBountiesPaid).toBe('100.00');
    expect(stats.totalPenalties).toBe('10.00');
    expect(stats.bountyCount).toBeGreaterThanOrEqual(1);
    expect(stats.penaltyCount).toBeGreaterThanOrEqual(1);
  });

  /**
   * Test: GET /api/v1/bounties/transactions/:userId
   * Purpose: Verify that a user's transaction history (bounties and penalties) is returned
   * and includes the expected number of transaction records.
   */
  test('GET /api/v1/bounties/transactions/:userId returns transactions for user', async () => {
    const res = await request(app)
      .get(`/api/v1/bounties/transactions/${normalUser.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  /**
   * Test: POST /api/v1/bounties/adjust (admin)
   * Purpose: Confirm that an admin can adjust a user's balance and that the response
   * contains balanceBefore and balanceAfter values.
   */
  test('POST /api/v1/bounties/adjust allows admin to adjust user balance', async () => {
    const adjustRes = await request(app)
      .post('/api/v1/bounties/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: normalUser.id, amount: 5.5, reason: 'Manual top-up' });

    expect(adjustRes.statusCode).toBe(200);
    expect(adjustRes.body.success).toBe(true);
    expect(adjustRes.body.data).toHaveProperty('balanceBefore');
    expect(adjustRes.body.data).toHaveProperty('balanceAfter');
  });

  /**
   * Test: POST /api/v1/bounties/adjust (non-admin)
   * Purpose: Ensure users without admin privileges are forbidden from adjusting balances.
   */
  test('POST /api/v1/bounties/adjust rejects non-admin users', async () => {
    const res = await request(app)
      .post('/api/v1/bounties/adjust')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ userId: normalUser.id, amount: 1, reason: 'Should fail' });

    expect(res.statusCode).toBe(403);
  });
});

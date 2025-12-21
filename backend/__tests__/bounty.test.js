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

  /**
   * Test: GET /api/v1/bounties/transactions/:userId with limit
   * Purpose: Verify that transaction history can be retrieved
   */
  test('GET /api/v1/bounties/transactions/:userId works with transactions', async () => {
    // Create more transactions first
    await Transaction.create({ userId: normalUser.id, taskId: testTask.id, type: 'BOUNTY', amount: 50.00, description: 'Extra bounty 1', balanceBefore: 100, balanceAfter: 150 });
    await Transaction.create({ userId: normalUser.id, taskId: testTask.id, type: 'BOUNTY', amount: 30.00, description: 'Extra bounty 2', balanceBefore: 150, balanceAfter: 180 });

    const res = await request(app)
      .get(`/api/v1/bounties/transactions/${normalUser.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(2);
  });

  /**
   * Test: Bounty statistics with no transactions
   * Purpose: Ensure statistics endpoint handles edge cases
   */
  test('GET /api/v1/bounties/statistics handles users with no transactions', async () => {
    // Create a new user with no transactions
    const newUserRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'noTransUser', email: 'notrans@test.com', password: 'Pass123!', role: 'GOON' });

    const newUser = newUserRes.body.data;
    await User.update({ teamId: (await Team.findOne()).id }, { where: { id: newUser.id } });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'noTransUser', password: 'Pass123!' });
    
    const newUserToken = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/v1/bounties/statistics')
      .set('Authorization', `Bearer ${newUserToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('totalBountiesPaid');
  });

  /**
   * Test: Negative balance adjustment
   * Purpose: Verify that negative adjustments work and don't go below zero
   */
  test('POST /api/v1/bounties/adjust handles negative adjustments correctly', async () => {
    const userBefore = await User.findByPk(normalUser.id);
    const initialBalance = parseFloat(userBefore.balance);

    const res = await request(app)
      .post('/api/v1/bounties/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: normalUser.id, amount: -5.0, reason: 'Test deduction' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('balanceBefore');
    expect(res.body.data).toHaveProperty('balanceAfter');
    expect(parseFloat(res.body.data.balanceAfter)).toBeLessThan(parseFloat(res.body.data.balanceBefore));
  });

  /**
   * Test: Large negative adjustment doesn't go below zero
   * Purpose: Verify balance floor at 0
   */
  test('POST /api/v1/bounties/adjust prevents negative balance', async () => {
    const res = await request(app)
      .post('/api/v1/bounties/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: normalUser.id, amount: -99999.0, reason: 'Test floor' });

    expect(res.statusCode).toBe(200);
    expect(parseFloat(res.body.data.balanceAfter)).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test: Adjust balance for non-existent user
   * Purpose: Verify error handling for invalid userId
   */
  test('POST /api/v1/bounties/adjust fails for non-existent user', async () => {
    const res = await request(app)
      .post('/api/v1/bounties/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: 99999, amount: 10, reason: 'Should fail' });

    expect(res.statusCode).toBe(500);
  });

  /**
   * Test: Get transactions for non-existent user
   * Purpose: Verify transactions endpoint handles invalid userId
   */
  test('GET /api/v1/bounties/transactions/:userId returns empty for non-existent user', async () => {
    const res = await request(app)
      .get('/api/v1/bounties/transactions/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  /**
   * Test: Process bounty service function
   * Purpose: Test bounty processing directly
   */
  test('Bounty processing updates user balance correctly', async () => {
    const BountyService = require('../src/services/BountyService');
    
    const userBefore = await User.findByPk(normalUser.id);
    const balanceBefore = parseFloat(userBefore.balance);

    const result = await BountyService.processBounty(normalUser.id, testTask.id, 50);

    expect(result).toHaveProperty('balanceBefore');
    expect(result).toHaveProperty('balanceAfter');
    expect(parseFloat(result.balanceAfter)).toBeGreaterThan(parseFloat(result.balanceBefore));
  });

  /**
   * Test: Apply penalty service function
   * Purpose: Test penalty application directly
   */
  test('Penalty application reduces user balance correctly', async () => {
    const BountyService = require('../src/services/BountyService');
    
    const userBefore = await User.findByPk(normalUser.id);
    const balanceBefore = parseFloat(userBefore.balance);

    const result = await BountyService.applyPenalty(normalUser.id, testTask.id, 25, 'Test penalty reason');

    expect(result).toHaveProperty('balanceBefore');
    expect(result).toHaveProperty('balanceAfter');
    expect(result).toHaveProperty('penaltyAmount');
    expect(parseFloat(result.balanceAfter)).toBeLessThan(parseFloat(result.balanceBefore));
  });

  /**
   * Test: Bounty service with non-existent user
   * Purpose: Verify error handling in bounty processing
   */
  test('Bounty processing fails for non-existent user', async () => {
    const BountyService = require('../src/services/BountyService');
    
    await expect(BountyService.processBounty(99999, testTask.id, 50)).rejects.toThrow('User not found');
  });

  /**
   * Test: Penalty service with non-existent user
   * Purpose: Verify error handling in penalty application
   */
  test('Penalty application fails for non-existent user', async () => {
    const BountyService = require('../src/services/BountyService');
    
    await expect(BountyService.applyPenalty(99999, testTask.id, 25)).rejects.toThrow('User not found');
  });
});

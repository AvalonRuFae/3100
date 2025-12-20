const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/database/connection');
const { User, Task, Transaction, License } = require('../src/models');

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

    // Create a license as admin (mirrors other tests that create licenses)
    const licenseRes = await request(app)
      .post('/api/v1/licenses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ teamName: 'Team A', licenseKey: 'LICENSE-123', expirationDate: new Date(Date.now() + 86400000).toISOString() });

    license = licenseRes.body.data;

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
  });

  afterAll(async () => {
    await sequelize.close();
  });

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

  test('GET /api/v1/bounties/transactions/:userId returns transactions for user', async () => {
    const res = await request(app)
      .get(`/api/v1/bounties/transactions/${normalUser.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

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

  test('POST /api/v1/bounties/adjust rejects non-admin users', async () => {
    const res = await request(app)
      .post('/api/v1/bounties/adjust')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ userId: normalUser.id, amount: 1, reason: 'Should fail' });

    expect(res.statusCode).toBe(403);
  });
});

const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/database/connection');
const { User } = require('../src/models');
const bcrypt = require('bcryptjs');

describe('Authentication API - Comprehensive Tests', () => {
  let testToken;
  let testUserId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    // Clean up after each test to avoid conflicts
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register - User Registration', () => {
    describe('Successful Registration', () => {
      it('should register a new user with valid data', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'testuser',
            email: 'test@example.com',
            password: 'Test123!',
            role: 'GOON'
          });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.username).toBe('testuser');
        expect(res.body.data.email).toBe('test@example.com');
        expect(res.body.data.role).toBe('GOON');
        expect(res.body.data).not.toHaveProperty('password');
      });

      it('should register user with HASHIRA role', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'hashira1',
            email: 'hashira@example.com',
            password: 'Strong123!',
            role: 'HASHIRA'
          });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.role).toBe('HASHIRA');
      });

      it('should register user with OYAKATASAMA role', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'admin1',
            email: 'admin@example.com',
            password: 'Admin123!',
            role: 'OYAKATASAMA'
          });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.role).toBe('OYAKATASAMA');
      });

      it('should hash the password before storing', async () => {
        const password = 'SecurePass123!';
        await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'secureuser',
            email: 'secure@example.com',
            password: password,
            role: 'GOON'
          });

        const user = await User.findOne({ where: { username: 'secureuser' } });
        expect(user.password).not.toBe(password);
        expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
      });

      it('should set default balance to 0', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'balanceuser',
            email: 'balance@example.com',
            password: 'Test123!',
            role: 'GOON'
          });

        expect(res.body.data.balance).toBe(0);
      });

      it('should set isActive to true by default', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'activeuser',
            email: 'active@example.com',
            password: 'Test123!',
            role: 'GOON'
          });

        expect(res.body.data.isActive).toBe(true);
      });
    });

    describe('Validation Errors', () => {
      it('should fail with missing username', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'nouser@example.com',
            password: 'Test123!',
            role: 'GOON'
          });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should fail with missing email', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'noemail',
            password: 'Test123!',
            role: 'GOON'
          });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should fail with missing password', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'nopass',
            email: 'nopass@example.com',
            role: 'GOON'
          });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should fail with invalid email format', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'testuser3',
            email: 'invalid-email',
            password: 'Test123!',
            role: 'GOON'
          });

        expect(res.statusCode).toBe(400);
      });

      it('should fail with password too short', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'shortpass',
            email: 'short@example.com',
            password: 'sh',
            role: 'GOON'
          });

        expect(res.statusCode).toBe(400);
      });

      it('should fail with username too short', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'ab',
            email: 'ab@example.com',
            password: 'Test123!',
            role: 'GOON'
          });

        expect(res.statusCode).toBe(400);
      });

      it('should fail with invalid role', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'invalidrole',
            email: 'invalid@example.com',
            password: 'Test123!',
            role: 'INVALID_ROLE'
          });

        expect(res.statusCode).toBe(400);
      });
    });

    describe('Duplicate Constraints', () => {
      beforeEach(async () => {
        await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'duplicate',
            email: 'duplicate@example.com',
            password: 'Test123!',
            role: 'GOON'
          });
      });

      it('should fail with duplicate username', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'duplicate',
            email: 'different@example.com',
            password: 'Test123!',
            role: 'GOON'
          });

        expect(res.statusCode).toBe(500);
      });

      it('should fail with duplicate email', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'differentuser',
            email: 'duplicate@example.com',
            password: 'Test123!',
            role: 'GOON'
          });

        expect(res.statusCode).toBe(500);
      });
    });
  });

  describe('POST /api/v1/auth/login - User Login', () => {
    beforeAll(async () => {
      // Create test users for login tests
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'logintest',
          email: 'login@example.com',
          password: 'Test123!',
          role: 'GOON'
        });

      // Create inactive user
      const inactiveUser = await User.create({
        username: 'inactiveuser',
        email: 'inactive@example.com',
        password: await bcrypt.hash('Test123!', 10),
        role: 'GOON',
        isActive: false
      });
    });

    describe('Successful Login', () => {
      it('should login with correct username and password', async () => {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({
            username: 'logintest',
            password: 'Test123!'
          });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'logintest',
          password: 'WrongPassword123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with non-existent user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'nonexistent',
          password: 'Test123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let token;

    beforeAll(async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'logintest',
          password: 'Test123!'
        });

      token = loginRes.body.data.token;
    });

    it('should get current user with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('logintest');
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.statusCode).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(403);
    });
  });
});});
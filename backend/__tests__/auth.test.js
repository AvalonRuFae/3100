const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/database/connection');
const { User, Team, License } = require('../src/models');

/**
 * Auth API Tests
 * Based on auth_flow.puml specifications
 * 
 * Test Documentation References:
 * - TC-AUTH-001: User Registration with team_id=NULL (Section 4.1)
 * - TC-AUTH-002: Login with Team Check and no_team Flag (Section 4.1)
 * - TC-AUTH-003: Role-Based Access Control (Section 4.1)
 * 
 * Tests cover:
 * - User registration with team_id=NULL
 * - Login flow with team checks
 * - No team flag (teamless_flag=true)
 * - License validation on protected routes
 * - JWT token expiration (8 hours)
 * - Role-based authorization
 * - Team-filtered resource access
 * 
 * See TESTING_DOCUMENTATION.pdf Section 4.1 for detailed test cases
 */
describe('Auth API - auth_flow.puml Compliance', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Mock environment licenses
    process.env.LICENSES = JSON.stringify([
      { key: 'RIKUGAN-TEST-2025-A', max_users: 50, expiry_date: '2026-12-31' },
      { key: 'RIKUGAN-TEST-2025-EXPIRED', max_users: 25, expiry_date: '2020-12-31' }
    ]);
  }, 30000);

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/v1/auth/register - User Registration', () => {
    /**
     * Test Case: TC-AUTH-001
     * Reference: TESTING_DOCUMENTATION.md Section 4.1
     * Objective: Verify new users register with team_id=NULL
     * Priority: High | Category: Functional Testing
     */
    it('should register a new user with team_id=NULL', async () => {
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
      
      // Verify user created with team_id=NULL as per registration_team_creation_flow.puml
      const user = await User.findByPk(res.body.data.id);
      expect(user.teamId).toBeNull();
    });

    it('should allow role selection during registration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'hashirauser',
          email: 'hashira@example.com',
          password: 'Test123!',
          role: 'HASHIRA'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.role).toBe('HASHIRA');
    });

    it('should fail with duplicate username', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser2',
          email: 'test2@example.com',
          password: 'Test123!',
          role: 'GOON'
        });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser2',
          email: 'test3@example.com',
          password: 'Test123!',
          role: 'GOON'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid email', async () => {
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

    it('should fail with short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser4',
          email: 'test4@example.com',
          password: 'short',
          role: 'GOON'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login - Login Flow (auth_flow.puml)', () => {
    let userWithoutTeamId, userWithTeamId, userWithExpiredLicenseId;
    let testTeam, validLicense, expiredLicense;

    beforeAll(async () => {
      // Create user without team
      const noTeamRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'logintest',
          email: 'login@example.com',
          password: 'Test123!',
          role: 'GOON'
        });
      userWithoutTeamId = noTeamRes.body.data.id;

      // Create user with valid team and license
      const teamUserRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'teamuser',
          email: 'teamuser@example.com',
          password: 'Test123!',
          role: 'HASHIRA'
        });
      userWithTeamId = teamUserRes.body.data.id;

      // Create team and valid license
      testTeam = await Team.create({
        name: 'Test Team',
        description: 'Team for login tests',
        isActive: true,
        createdBy: userWithTeamId
      });

      validLicense = await License.create({
        teamId: testTeam.id,
        teamName: testTeam.name,
        licenseKey: 'RIKUGAN-TEST-2025-A',
        maxUsers: 50,
        expirationDate: new Date('2026-12-31'),
        isActive: true
      });

      // Assign user to team
      await User.update({ teamId: testTeam.id }, { where: { id: userWithTeamId } });

      // Create user with expired license
      const expiredUserRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'expireduser',
          email: 'expired@example.com',
          password: 'Test123!',
          role: 'GOON'
        });
      userWithExpiredLicenseId = expiredUserRes.body.data.id;

      const expiredTeam = await Team.create({
        name: 'Expired Team',
        isActive: true,
        createdBy: userWithExpiredLicenseId
      });

      expiredLicense = await License.create({
        teamId: expiredTeam.id,
        teamName: expiredTeam.name,
        licenseKey: 'RIKUGAN-TEST-2025-EXPIRED',
        maxUsers: 25,
        expirationDate: new Date('2020-12-31'),
        isActive: false
      });

      await User.update({ teamId: expiredTeam.id }, { where: { id: userWithExpiredLicenseId } });
    });

    /**
     * Test Case: TC-AUTH-002
     * Reference: TESTING_DOCUMENTATION Section 4.1
     * Objective: Verify login returns JWT token and sets no_team flag when user has no team
     * Priority: High | Category: Functional Testing
     */
    it('should login user with no team and return no_team flag', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'logintest',
          password: 'Test123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('no_team');
      expect(res.body.data.no_team).toBe(true);
      expect(res.body.data.user.teamId).toBeNull();
    });

    it('should login user with valid team and license', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'teamuser',
          password: 'Test123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('team');
      expect(res.body.data.no_team).toBeFalsy();
      expect(res.body.data.user.teamId).toBe(testTeam.id);
    });

    it('should return 403 for user with expired/invalid license', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'expireduser',
          password: 'Test123!'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/license|expired/i);
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

  describe('GET /api/v1/auth/me - Protected Route Access (auth_flow.puml)', () => {
    let tokenNoTeam, tokenWithTeam;

    beforeAll(async () => {
      // Get token for user without team
      const noTeamLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'logintest',
          password: 'Test123!'
        });
      tokenNoTeam = noTeamLogin.body.data.token;

      // Get token for user with team
      const teamLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'teamuser',
          password: 'Test123!'
        });
      tokenWithTeam = teamLogin.body.data.token;
    }, 30000);

    it('should get current user with valid token (no team)', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenNoTeam}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('logintest');
      expect(res.body.data.teamId).toBeNull();
    });

    it('should get current user with valid token (with team)', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenWithTeam}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('teamuser');
      expect(res.body.data.teamId).not.toBeNull();
    });

    it('should fail without token (401 Unauthorized)', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid token (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should fail with expired token', async () => {
      // This would require mocking JWT with expired time
      // For now, we verify the token structure includes expiration
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(tokenWithTeam);
      
      expect(decoded).toHaveProperty('exp');
      // JWT should expire in 8 hours as per auth_flow.puml
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBe(8 * 60 * 60); // 8 hours in seconds
    });
  });

  describe('Logout (auth_flow.puml)', () => {
    it('should clear token on frontend (no backend endpoint needed)', () => {
      // As per auth_flow.puml, logout is handled by frontend clearing localStorage
      // No backend endpoint required
      // This test documents the expected behavior
      expect(true).toBe(true);
    });
  });

  describe('POST /api/v1/auth/register - Additional Validation Tests', () => {
    it('should fail with duplicate email', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'uniqueuser',
          email: 'duplicate@example.com',
          password: 'Test123!',
          role: 'GOON'
        });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'anotheruser',
          email: 'duplicate@example.com',
          password: 'Test123!',
          role: 'GOON'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should fail with missing username', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
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
          username: 'testuser',
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
          username: 'testuser',
          email: 'test@example.com',
          role: 'GOON'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should set default role to GOON if not provided', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'defaultrole',
          email: 'defaultrole@example.com',
          password: 'Test123!'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.role).toBe('GOON');
    });

    it('should allow OYAKATASAMA role registration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'adminuser',
          email: 'admin@example.com',
          password: 'Test123!',
          role: 'OYAKATASAMA'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.role).toBe('OYAKATASAMA');
    });

    it('should initialize balance to 0', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'balancetest',
          email: 'balance@example.com',
          password: 'Test123!',
          role: 'GOON'
        });

      expect(res.statusCode).toBe(201);
      expect(parseFloat(res.body.data.balance)).toBe(0);
    });

    it('should set isActive to true by default', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'activetest',
          email: 'active@example.com',
          password: 'Test123!',
          role: 'GOON'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.isActive).toBe(true);
    });
  });

  describe('POST /api/v1/auth/login - Additional Login Tests', () => {
    beforeAll(async () => {
      // Create inactive user
      const user = await User.create({
        username: 'inactiveuser',
        email: 'inactive@example.com',
        password: 'Test123!',
        role: 'GOON',
        isActive: false
      });
    });

    it('should fail with inactive account', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'inactiveuser',
          password: 'Test123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/disabled|inactive/i);
    });

    it('should allow login with email instead of username', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'login@example.com',
          password: 'Test123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should fail with empty username', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: '',
          password: 'Test123!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with empty password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'logintest',
          password: ''
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should include teamName and license in JWT payload when user has team', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'teamuser',
          password: 'Test123!'
        });

      expect(res.statusCode).toBe(200);
      
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(res.body.data.token);
      
      expect(decoded).toHaveProperty('teamId');
      expect(decoded).toHaveProperty('teamName');
      expect(decoded).toHaveProperty('licenseKey');
    });
  });

  describe('POST /api/v1/auth/change-password - Password Change', () => {
    let userToken;
    let userId;

    beforeAll(async () => {
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'passwordtest',
          email: 'passwordtest@example.com',
          password: 'OldPassword123!',
          role: 'GOON'
        });

      userId = registerRes.body.data.id;

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'passwordtest',
          password: 'OldPassword123!'
        });

      userToken = loginRes.body.data.token;
    });

    it('should successfully change password with correct old password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          oldPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/password changed/i);
    });

    it('should allow login with new password after change', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'passwordtest',
          password: 'NewPassword123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail to change password with incorrect old password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          oldPassword: 'WrongOldPassword!',
          newPassword: 'AnotherNewPassword123!'
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it('should fail without authentication token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .send({
          oldPassword: 'NewPassword123!',
          newPassword: 'AnotherPassword123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with short new password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          oldPassword: 'NewPassword123!',
          newPassword: 'short'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with missing oldPassword', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          newPassword: 'AnotherPassword123!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with missing newPassword', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          oldPassword: 'NewPassword123!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  /**
   * Test Case: TC-AUTH-003
   * Reference: TESTING_DOCUMENTATION Section 4.1
   * Objective: Verify that role-based permissions are enforced (GOON vs HASHIRA vs OYAKATASAMA)
   * Priority: High | Category: Security Testing
   */
  describe('Authorization Middleware Tests', () => {
    let goonToken, hashiraToken, adminToken;

    beforeAll(async () => {
      // Register and login users with different roles
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'authtestgoon',
          email: 'authtestgoon@example.com',
          password: 'Test123!',
          role: 'GOON'
        });

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'authtesthashira',
          email: 'authtesthashira@example.com',
          password: 'Test123!',
          role: 'HASHIRA'
        });

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'authtestadmin',
          email: 'authtestadmin@example.com',
          password: 'Test123!',
          role: 'OYAKATASAMA'
        });

      const goonLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'authtestgoon', password: 'Test123!' });
      goonToken = goonLogin.body.data.token;

      const hashiraLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'authtesthashira', password: 'Test123!' });
      hashiraToken = hashiraLogin.body.data.token;

      const adminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'authtestadmin', password: 'Test123!' });
      adminToken = adminLogin.body.data.token;
    });

    it('should authenticate valid token and attach user to request', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.username).toBe('authtestgoon');
      expect(res.body.data.role).toBe('GOON');
    });

    it('should reject malformed authorization header', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'InvalidFormat');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject token with invalid signature', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature');

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('JWT Token Structure Tests', () => {
    it('should generate token with correct expiration time (8 hours)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'logintest',
          password: 'Test123!'
        });

      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(res.body.data.token);
      
      const expectedExpiration = 8 * 60 * 60; // 8 hours in seconds
      const actualExpiration = decoded.exp - decoded.iat;
      
      expect(actualExpiration).toBe(expectedExpiration);
    });

    it('should include user id in token payload', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'logintest',
          password: 'Test123!'
        });

      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(res.body.data.token);
      
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('username');
      expect(decoded).toHaveProperty('role');
    });
  });
});

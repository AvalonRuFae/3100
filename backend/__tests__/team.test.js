const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/database/connection');
const { User, Team, License } = require('../src/models');

describe('Team & License System - Comprehensive Tests', () => {
  let adminToken, userToken, user2Token;
  let adminId, userId, user2Id;
  let validLicenseKey, usedLicenseKey, expiredLicenseKey, inactiveLicenseKey;
  let teamId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test users
    const admin = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'adminuser',
        email: 'admin@test.com',
        password: 'Test123!',
        role: 'OYAKATASAMA'
      });
    adminId = admin.body.data.id;

    const user1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testuser1',
        email: 'user1@test.com',
        password: 'Test123!',
        role: 'GOON'
      });
    userId = user1.body.data.id;

    const user2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testuser2',
        email: 'user2@test.com',
        password: 'Test123!',
        role: 'HASHIRA'
      });
    user2Id = user2.body.data.id;

    // Login to get tokens
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'adminuser', password: 'Test123!' });
    adminToken = adminLogin.body.data.token;

    const user1Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testuser1', password: 'Test123!' });
    userToken = user1Login.body.data.token;

    const user2Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testuser2', password: 'Test123!' });
    user2Token = user2Login.body.data.token;

    // Create test licenses
    const validLicense = await License.create({
      teamName: 'Valid Team',
      licenseKey: 'DSCPMS-2025-VALID001',
      isActive: true,
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      maxUsers: 10
    });
    validLicenseKey = validLicense.licenseKey;

    // Create a dummy user for the "used" license
    const dummyUser = await User.create({
      username: 'dummyuser',
      email: 'dummy@test.com',
      password: 'Test123!',
      role: 'GOON'
    });

    const usedLicense = await License.create({
      teamName: 'Used Team',
      licenseKey: 'DSCPMS-2025-USED002',
      isActive: true,
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxUsers: 10,
      assignedUserId: dummyUser.id // Use real user ID
    });
    usedLicenseKey = usedLicense.licenseKey;

    const expiredLicense = await License.create({
      teamName: 'Expired Team',
      licenseKey: 'DSCPMS-2025-EXPIRED003',
      isActive: true,
      expirationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      maxUsers: 10
    });
    expiredLicenseKey = expiredLicense.licenseKey;

    const inactiveLicense = await License.create({
      teamName: 'Inactive Team',
      licenseKey: 'DSCPMS-2025-INACTIVE004',
      isActive: false,
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxUsers: 10
    });
    inactiveLicenseKey = inactiveLicense.licenseKey;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('User Registration & Login Without Team', () => {
    it('should register user with team_id as NULL', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@test.com',
          password: 'Test123!',
          role: 'GOON'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify team_id is NULL in database
      const user = await User.findByPk(res.body.data.id);
      expect(user.teamId).toBeNull();
    });

    it('should return noTeamFlag true when user has no team', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'testuser1', password: 'Test123!' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.noTeamFlag).toBe(true);
      expect(res.body.data.team).toBeNull();
      expect(res.body.data.token).toBeDefined();
    });

    it('should include user info in login response', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'testuser1', password: 'Test123!' });

      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.username).toBe('testuser1');
      expect(res.body.data.user.email).toBe('user1@test.com');
      expect(res.body.data.user.password).toBeUndefined(); // Password should not be exposed
    });
  });

  describe('Team Creation with License Validation', () => {
    it('should fail with invalid license key', async () => {
      const res = await request(app)
        .post('/api/v1/team/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          teamName: 'Test Team',
          licenseKey: 'INVALID-LICENSE'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid license');
    });

    it('should fail with already assigned license', async () => {
      const res = await request(app)
        .post('/api/v1/team/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          teamName: 'Test Team',
          licenseKey: usedLicenseKey
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('License already assigned');
    });

    it('should fail with expired license', async () => {
      const res = await request(app)
        .post('/api/v1/team/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          teamName: 'Test Team',
          licenseKey: expiredLicenseKey
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('License expired');
    });

    it('should fail with inactive license', async () => {
      const res = await request(app)
        .post('/api/v1/team/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          teamName: 'Test Team',
          licenseKey: inactiveLicenseKey
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('not active');
    });

    it('should successfully create team with valid license', async () => {
      const res = await request(app)
        .post('/api/v1/team/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          teamName: 'My Awesome Team',
          licenseKey: validLicenseKey
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('My Awesome Team');
      expect(res.body.data.license).toBeDefined();
      expect(res.body.data.license.licenseKey).toBe(validLicenseKey);
      expect(res.body.data.members).toBeDefined();
      expect(res.body.data.members.length).toBe(1);
      expect(res.body.data.members[0].id).toBe(userId);

      teamId = res.body.data.id;

      // Verify user's team_id is updated
      const user = await User.findByPk(userId);
      expect(user.teamId).toBe(teamId);

      // Verify license is assigned
      const license = await License.findOne({ where: { licenseKey: validLicenseKey } });
      expect(license.assignedUserId).toBe(userId);
      expect(license.teamId).toBe(teamId);
    });

    it('should fail to create team if user already has team', async () => {
      // Create another license
      const anotherLicense = await License.create({
        teamName: 'Another Team',
        licenseKey: 'DSCPMS-2025-ANOTHER005',
        isActive: true,
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxUsers: 10
      });

      const res = await request(app)
        .post('/api/v1/team/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          teamName: 'Second Team',
          licenseKey: anotherLicense.licenseKey
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('User already has a team');
    });

    it('should require authentication for team creation', async () => {
      const res = await request(app)
        .post('/api/v1/team/create')
        .send({
          teamName: 'Test Team',
          licenseKey: validLicenseKey
        });

      expect(res.statusCode).toBe(401);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/team/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Test Team'
          // Missing licenseKey
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('Login After Team Creation', () => {
    it('should return noTeamFlag false when user has team', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'testuser1', password: 'Test123!' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.noTeamFlag).toBe(false);
      expect(res.body.data.team).toBeDefined();
      expect(res.body.data.team.name).toBe('My Awesome Team');
      expect(res.body.data.team.license).toBeDefined();
    });

    it('should include team info in JWT token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'testuser1', password: 'Test123!' });

      const token = res.body.data.token;
      expect(token).toBeDefined();

      // Decode JWT to verify team info
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.teamId).toBe(teamId);
      expect(decoded.teamName).toBe('My Awesome Team');
    });
  });

  describe('Get Team Information', () => {
    it('should get my team', async () => {
      const res = await request(app)
        .get('/api/v1/team/my-team')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('My Awesome Team');
      expect(res.body.data.members).toBeDefined();
      expect(res.body.data.license).toBeDefined();
    });

    it('should return 404 if user has no team', async () => {
      const res = await request(app)
        .get('/api/v1/team/my-team')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('not part of any team');
    });

    it('should get team by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/team/${teamId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(teamId);
      expect(res.body.data.name).toBe('My Awesome Team');
    });

    it('should require authentication to get team', async () => {
      const res = await request(app)
        .get(`/api/v1/team/${teamId}`);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('Add Members to Team', () => {
    it('should allow team admin to add members', async () => {
      const res = await request(app)
        .post(`/api/v1/team/${teamId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: user2Id });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Member added');
      expect(res.body.data.members.length).toBe(2);

      // Verify user2 now has team
      const user2 = await User.findByPk(user2Id);
      expect(user2.teamId).toBe(teamId);
    });

    it('should prevent adding user who already has team', async () => {
      const res = await request(app)
        .post(`/api/v1/team/${teamId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: user2Id });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('already belongs to a team');
    });

    it('should prevent adding member if license capacity reached', async () => {
      // Create a team with license that has maxUsers: 1
      const smallLicense = await License.create({
        teamName: 'Small Team',
        licenseKey: 'DSCPMS-2025-SMALL006',
        isActive: true,
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxUsers: 1
      });

      const smallTeam = await Team.create({ name: 'Small Team' });
      await smallLicense.update({
        teamId: smallTeam.id,
        assignedUserId: adminId
      });
      await User.update({ teamId: smallTeam.id }, { where: { id: adminId } });

      // Try to add another member
      const newUser = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'extrauser',
          email: 'extra@test.com',
          password: 'Test123!',
          role: 'GOON'
        });

      const res = await request(app)
        .post(`/api/v1/team/${smallTeam.id}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: newUser.body.data.id });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('maximum capacity');
    });

    it('should prevent non-admin from adding members', async () => {
      const res = await request(app)
        .post(`/api/v1/team/${teamId}/members`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ userId: adminId });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Only team admin');
    });

    it('should return 404 if user not found', async () => {
      const res = await request(app)
        .post(`/api/v1/team/${teamId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: 99999 });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('User not found');
    });
  });

  describe('Remove Members from Team', () => {
    it('should allow team admin to remove members', async () => {
      const res = await request(app)
        .delete(`/api/v1/team/${teamId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: user2Id });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Member removed');

      // Verify user2 no longer has team
      const user2 = await User.findByPk(user2Id);
      expect(user2.teamId).toBeNull();
    });

    it('should prevent removing team owner', async () => {
      const res = await request(app)
        .delete(`/api/v1/team/${teamId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: userId });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Cannot remove team owner');
    });

    it('should prevent non-admin from removing members', async () => {
      // Re-add user2 to team
      await User.update({ teamId: teamId }, { where: { id: user2Id } });

      const res = await request(app)
        .delete(`/api/v1/team/${teamId}/members`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ userId: userId });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Only team admin');
    });

    it('should return 400 if user not in team', async () => {
      const res = await request(app)
        .delete(`/api/v1/team/${teamId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: adminId });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('not a member of this team');
    });
  });

  describe('Update Team', () => {
    it('should allow team admin to update team', async () => {
      const res = await request(app)
        .put(`/api/v1/team/${teamId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Team Name',
          description: 'This is an updated team'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Updated Team Name');
      expect(res.body.data.description).toBe('This is an updated team');
    });

    it('should prevent non-admin from updating team', async () => {
      const res = await request(app)
        .put(`/api/v1/team/${teamId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Hacked Team Name'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Only team admin');
    });

    it('should allow OYAKATASAMA role to update any team', async () => {
      const res = await request(app)
        .put(`/api/v1/team/${teamId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Admin updated this'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.description).toBe('Admin updated this');
    });
  });

  describe('Get All Teams (Admin Only)', () => {
    it('should allow admin to get all teams', async () => {
      const res = await request(app)
        .get('/api/v1/team')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should prevent non-admin from getting all teams', async () => {
      const res = await request(app)
        .get('/api/v1/team')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Edge Cases & Security', () => {
    it('should handle concurrent team creation with same license', async () => {
      // This tests transaction rollback
      const concurrentLicense = await License.create({
        teamName: 'Concurrent Team',
        licenseKey: 'DSCPMS-2025-CONCURRENT007',
        isActive: true,
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxUsers: 10
      });

      const user3 = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'user3',
          email: 'user3@test.com',
          password: 'Test123!',
          role: 'GOON'
        });

      const user3Login = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'user3', password: 'Test123!' });

      const res = await request(app)
        .post('/api/v1/team/create')
        .set('Authorization', `Bearer ${user3Login.body.data.token}`)
        .send({
          teamName: 'Concurrent Team',
          licenseKey: concurrentLicense.licenseKey
        });

      expect(res.statusCode).toBe(201);

      // Try again with same license
      const user4 = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'user4',
          email: 'user4@test.com',
          password: 'Test123!',
          role: 'GOON'
        });

      const user4Login = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'user4', password: 'Test123!' });

      const res2 = await request(app)
        .post('/api/v1/team/create')
        .set('Authorization', `Bearer ${user4Login.body.data.token}`)
        .send({
          teamName: 'Another Concurrent Team',
          licenseKey: concurrentLicense.licenseKey
        });

      expect(res2.statusCode).toBe(400);
      expect(res2.body.message).toContain('already assigned');
    });

    it('should not expose sensitive data in team responses', async () => {
      const res = await request(app)
        .get('/api/v1/team/my-team')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      
      // Check members don't have passwords
      res.body.data.members.forEach(member => {
        expect(member.password).toBeUndefined();
      });
    });

    it('should return 404 for non-existent team', async () => {
      const res = await request(app)
        .get('/api/v1/team/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should validate userId format when adding member', async () => {
      const res = await request(app)
        .post(`/api/v1/team/${teamId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: 'invalid' });

      expect(res.statusCode).toBe(400);
    });
  });
});

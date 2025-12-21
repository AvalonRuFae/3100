const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/database/connection');
const { User, Team, License } = require('../src/models');
const TeamService = require('../src/services/TeamService');

describe('Team API and Service', () => {
  let adminToken, hashiraToken, goonToken;
  let adminUser, hashiraUser, goonUser;
  let testTeam;

  // Mock environment licenses
  const MOCK_LICENSES = [
    { key: 'RIKUGAN-2025-TEAM-A', max_users: 50, expiry_date: '2026-12-31' },
    { key: 'RIKUGAN-2025-TEAM-B', max_users: 25, expiry_date: '2026-12-31' },
    { key: 'RIKUGAN-2025-TEAM-C', max_users: 10, expiry_date: '2026-12-31' }
  ];

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Mock environment variable for licenses
    process.env.LICENSES = JSON.stringify(MOCK_LICENSES);

    // Create admin user
    const adminResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'adminUser',
        email: 'admin@test.com',
        password: 'Test123!',
        role: 'OYAKATASAMA'
      });
    adminUser = adminResponse.body.data;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'adminUser', password: 'Test123!' });
    adminToken = adminLogin.body.data.token;

    // Create Hashira user
    const hashiraResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'hashiraUser',
        email: 'hashira@test.com',
        password: 'Test123!',
        role: 'HASHIRA'
      });
    hashiraUser = hashiraResponse.body.data;

    const hashiraLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'hashiraUser', password: 'Test123!' });
    hashiraToken = hashiraLogin.body.data.token;

    // Create Goon user
    const goonResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'goonUser',
        email: 'goon@test.com',
        password: 'Test123!',
        role: 'GOON'
      });
    goonUser = goonResponse.body.data;

    const goonLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'goonUser', password: 'Test123!' });
    goonToken = goonLogin.body.data.token;
  }, 30000);

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up teams and licenses before each test
    await Team.destroy({ where: {}, force: true });
    await License.destroy({ where: {}, force: true });
    await User.update({ teamId: null }, { where: {} });
  });

  describe('POST /api/v1/teams/create - Create Team', () => {
    /**
     * Test: Successfully create a team with valid license
     * Purpose: Verify team creation flow with license validation per PUML
     */
    test('should create a team with valid license key', async () => {
      const response = await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Alpha Team',
          licenseKey: 'RIKUGAN-2025-TEAM-A'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.team).toBeDefined();
      expect(response.body.data.team.name).toBe('Alpha Team');
      expect(response.body.data.token).toBeDefined();

      // Verify creator is assigned to team
      const updatedUser = await User.findByPk(adminUser.id);
      expect(updatedUser.teamId).toBe(response.body.data.team.id);

      // Verify license was created
      const license = await License.findOne({
        where: { teamId: response.body.data.team.id }
      });
      expect(license).toBeDefined();
      expect(license.licenseKey).toBe('RIKUGAN-2025-TEAM-A');
    });

    /**
     * Test: Reject team creation with invalid license
     * Purpose: Ensure only valid licenses can be used per PUML
     */
    test('should reject team creation with invalid license key', async () => {
      const response = await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Invalid Team',
          licenseKey: 'INVALID-LICENSE-KEY'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * Test: Reject team creation with duplicate name
     * Purpose: Ensure team names are unique
     */
    test('should reject duplicate team names', async () => {
      // Create first team
      await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Duplicate Team',
          licenseKey: 'RIKUGAN-2025-TEAM-A'
        });

      // Try to create second team with same name
      const response = await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          teamName: 'Duplicate Team',
          licenseKey: 'RIKUGAN-2025-TEAM-B'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * Test: Reject team creation without required fields
     * Purpose: Validate input requirements per PUML
     */
    test('should require teamName and license key', async () => {
      const response = await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Missing required fields'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message || response.body.error).toMatch(/required|teamName|licenseKey/i);
    });
  });

  describe('GET /api/v1/teams/:id - Get Team by ID', () => {
    /**
     * Test: Retrieve team with members and license
     * Purpose: Verify team data retrieval with relationships
     */
    test('should get team by ID with members and license', async () => {
      // Create team
      const createResponse = await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Beta Team',
          licenseKey: 'RIKUGAN-2025-TEAM-A'
        });

      const teamId = createResponse.body.data.team.id;

      // Get team
      const response = await request(app)
        .get(`/api/v1/teams/${teamId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(teamId);
      expect(response.body.data.name).toBe('Beta Team');
      expect(response.body.data.members).toBeDefined();
      expect(response.body.data.license).toBeDefined();
    });

    /**
     * Test: Return 404 for non-existent team
     * Purpose: Verify error handling for invalid team ID
     */
    test('should return 404 for non-existent team', async () => {
      const response = await request(app)
        .get('/api/v1/teams/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/teams - Get All Teams', () => {
    /**
     * Test: List all teams with pagination (Admin only)
     * Purpose: Verify team listing with pagination
     */
    test('should get all teams with pagination (admin only)', async () => {
      // Create multiple teams
      await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Team 1',
          licenseKey: 'RIKUGAN-2025-TEAM-A'
        });

      await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          teamName: 'Team 2',
          licenseKey: 'RIKUGAN-2025-TEAM-B'
        });

      const response = await request(app)
        .get('/api/v1/teams?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.teams).toBeDefined();
      expect(response.body.data.teams.length).toBe(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBe(2);
    });

    /**
     * Test: Deny access to non-admin users
     * Purpose: Verify authorization for team listing
     */
    test('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/teams')
        .set('Authorization', `Bearer ${goonToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/v1/teams/:id - Update Team', () => {
    /**
     * Test: Update team information
     * Purpose: Verify team update functionality
     */
    test('should update team information', async () => {
      // Create team
      const createResponse = await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Original Name',
          licenseKey: 'RIKUGAN-2025-TEAM-A'
        });

      const teamId = createResponse.body.data.team.id;

      // Update team
      const response = await request(app)
        .put(`/api/v1/teams/${teamId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.description).toBe('Updated description');
    });

    /**
     * Test: Deny update access to Goon users
     * Purpose: Verify role-based authorization
     */
    test('should deny update to Goon users', async () => {
      const createResponse = await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Test Team',
          licenseKey: 'RIKUGAN-2025-TEAM-A'
        });

      const teamId = createResponse.body.data.team.id;

      const response = await request(app)
        .put(`/api/v1/teams/${teamId}`)
        .set('Authorization', `Bearer ${goonToken}`)
        .send({ name: 'Hacked Name' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/teams/:id - Delete Team', () => {
    /**
     * Test: Deactivate team (soft delete)
     * Purpose: Verify team deletion deactivates and removes members
     */
    test('should deactivate team and remove members', async () => {
      // Create team
      const createResponse = await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Team to Delete',
          licenseKey: 'RIKUGAN-2025-TEAM-A'
        });

      const teamId = createResponse.body.data.team.id;

      // Delete team
      const response = await request(app)
        .delete(`/api/v1/teams/${teamId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify team is deactivated
      const team = await Team.findByPk(teamId);
      expect(team.isActive).toBe(false);

      // Verify creator is removed from team
      const user = await User.findByPk(adminUser.id);
      expect(user.teamId).toBeNull();
    });
  });

  describe('POST /api/v1/teams/:id/members - Add Member', () => {
    /**
     * Test: Add member to team
     * Purpose: Verify member addition functionality
     */
    test('should add member to team', async () => {
      // Create team
      const createResponse = await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Member Test Team',
          licenseKey: 'RIKUGAN-2025-TEAM-A'
        });

      const teamId = createResponse.body.data.team.id;

      // Add member
      const response = await request(app)
        .post(`/api/v1/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: goonUser.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user is added to team
      const user = await User.findByPk(goonUser.id);
      expect(user.teamId).toBe(teamId);
    });

    /**
     * Test: Reject adding user already in a team
     * Purpose: Ensure users can only be in one team
     */
    test('should reject adding user already in a team', async () => {
      // Create first team
      const team1Response = await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Team 1',
          licenseKey: 'RIKUGAN-2025-TEAM-A'
        });

      // Create second team
      const team2Response = await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({
          teamName: 'Team 2',
          licenseKey: 'RIKUGAN-2025-TEAM-B'
        });

      const team1Id = team1Response.body.data.team.id;
      const team2Id = team2Response.body.data.team.id;

      // Add goon to team 1
      await request(app)
        .post(`/api/v1/teams/${team1Id}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: goonUser.id });

      // Try to add goon to team 2
      const response = await request(app)
        .post(`/api/v1/teams/${team2Id}/members`)
        .set('Authorization', `Bearer ${hashiraToken}`)
        .send({ userId: goonUser.id });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/teams/:id/members/:userId - Remove Member', () => {
    /**
     * Test: Remove member from team
     * Purpose: Verify member removal functionality
     */
    test('should remove member from team', async () => {
      // Refresh goonUser to get current teamId state
      await User.update({ teamId: null }, { where: { id: goonUser.id } });
      
      // Create team
      const createResponse = await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Removal Test Team',
          licenseKey: 'RIKUGAN-2025-TEAM-A'
        });

      const teamId = createResponse.body.data.team.id;

      // Add member
      const addResponse = await request(app)
        .post(`/api/v1/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: goonUser.id });
      
      expect(addResponse.status).toBe(200);

      // Verify member was added
      const checkUser = await User.findByPk(goonUser.id);
      expect(checkUser.teamId).toBe(teamId);

      // Remove member
      const response = await request(app)
        .delete(`/api/v1/teams/${teamId}/members/${goonUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status !== 200) {
        console.log('Remove member error:', response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user is removed from team
      const user = await User.findByPk(goonUser.id);
      expect(user.teamId).toBeNull();
    });
  });

  describe('GET /api/v1/teams/:id/members - Get Team Members', () => {
    /**
     * Test: Get all team members
     * Purpose: Verify member listing functionality
     */
    test('should get all team members', async () => {
      // Create team
      const createResponse = await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Members List Team',
          licenseKey: 'RIKUGAN-2025-TEAM-A'
        });

      const teamId = createResponse.body.data.team.id;

      // Add members
      await request(app)
        .post(`/api/v1/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: goonUser.id });

      await request(app)
        .post(`/api/v1/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: hashiraUser.id });

      // Get members
      const response = await request(app)
        .get(`/api/v1/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3); // Creator + 2 added
    });
  });

  describe('GET /api/v1/teams/:id/statistics - Get Team Statistics', () => {
    /**
     * Test: Get team statistics
     * Purpose: Verify statistics calculation
     */
    test('should get team statistics', async () => {
      // Create team
      const createResponse = await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Stats Team',
          licenseKey: 'RIKUGAN-2025-TEAM-A'
        });

      const teamId = createResponse.body.data.team.id;

      // Get statistics
      const response = await request(app)
        .get(`/api/v1/teams/${teamId}/statistics`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('memberCount');
      expect(response.body.data).toHaveProperty('totalTasks');
      expect(response.body.data).toHaveProperty('completedTasks');
      expect(response.body.data).toHaveProperty('totalEarnings');
    });
  });

  describe('GET /api/v1/teams/my-team - Get Current User Team', () => {
    /**
     * Test: Get current user's team
     * Purpose: Verify user can retrieve their own team
     */
    test('should get current user team', async () => {
      // Create team
      const createResponse = await request(app)
        .post('/api/v1/teams/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'My Team',
          licenseKey: 'RIKUGAN-2025-TEAM-A'
        });

      // Get my team
      const response = await request(app)
        .get('/api/v1/teams/my-team')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('My Team');
    });

    /**
     * Test: Return 404 when user has no team
     * Purpose: Verify error handling for users without teams
     */
    test('should return 404 when user has no team', async () => {
      const response = await request(app)
        .get('/api/v1/teams/my-team')
        .set('Authorization', `Bearer ${goonToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('TeamService - Unit Tests', () => {
    /**
     * Test: Validate license capacity enforcement
     * Purpose: Ensure teams cannot exceed license limits
     */
    test('should enforce license capacity limits', async () => {
      // Create team with small capacity license (10 users)
      const team = await Team.create({
        name: 'Capacity Test Team',
        description: 'Test capacity limits',
        createdBy: adminUser.id,
        isActive: true
      });

      await License.create({
        teamId: team.id,
        teamName: team.name,
        licenseKey: 'RIKUGAN-2025-TEAM-C',
        maxUsers: 10,
        expirationDate: '2026-12-31',
        isActive: true
      });

      // Add users up to capacity (10 users total)
      for (let i = 0; i < 10; i++) {
        const user = await User.create({
          username: `capacityuser${i}`,
          email: `capacityuser${i}@test.com`,
          password: 'Test123!',
          role: 'GOON'
        });
        await TeamService.addMember(team.id, user.id);
      }

      // Try to add one more user beyond capacity
      const extraUser = await User.create({
        username: 'extrauser',
        email: 'extra@test.com',
        password: 'Test123!',
        role: 'GOON'
      });

      await expect(
        TeamService.addMember(team.id, extraUser.id)
      ).rejects.toThrow('maximum user capacity');
    });
  });
});

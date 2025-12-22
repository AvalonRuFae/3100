const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/database/connection');
const { User, Team, License } = require('../src/models');

/**
 * User Management Tests
 * 
 * Test Documentation References:
 * - TC-USER-001: User Profile with Team Isolation (Section 4.6)
 * 
 * See TESTING_DOCUMENTATION.pdf Section 4.6 for detailed test cases
 */

describe('User Controller - Comprehensive Tests', () => {
  let goonToken, hashiraToken, adminToken;
  let goonId, hashiraId, adminId;
  let testTeam;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Mock environment licenses for team creation
    process.env.LICENSES = JSON.stringify([
      { key: 'USER-TEST-2025', max_users: 50, expiry_date: '2026-12-31' }
    ]);

    // Create test users with different roles (team_id=NULL per PUML)
    const goonRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testgoon',
        email: 'goon@test.com',
        password: 'Test123!',
        role: 'GOON'
      });
    goonId = goonRes.body.data.id;
    expect(goonRes.body.data.teamId == null).toBe(true); // Verify team_id=NULL per PUML (null or undefined)

    const hashiraRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testhashira',
        email: 'hashira@test.com',
        password: 'Test123!',
        role: 'HASHIRA'
      });
    hashiraId = hashiraRes.body.data.id;

    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testadmin',
        email: 'admin@test.com',
        password: 'Test123!',
        role: 'OYAKATASAMA'
      });
    adminId = adminRes.body.data.id;

    // Login to get tokens - should return no_team: true per PUML
    const goonLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testgoon', password: 'Test123!' });
    goonToken = goonLogin.body.data.token;
    expect(goonLogin.body.data.no_team === true || !goonLogin.body.data.team).toBe(true); // Verify no_team flag per PUML

    const hashiraLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testhashira', password: 'Test123!' });
    hashiraToken = hashiraLogin.body.data.token;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testadmin', password: 'Test123!' });
    adminToken = adminLogin.body.data.token;

    // Create team for testing team isolation
    const teamResponse = await request(app)
      .post('/api/v1/teams/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        teamName: 'User Test Team',
        licenseKey: 'USER-TEST-2025'
      });
    testTeam = teamResponse.body.data.team;

    // Add goon and hashira users to the team
    await request(app)
      .post(`/api/v1/teams/${testTeam.id}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: goonId });

    await request(app)
      .post(`/api/v1/teams/${testTeam.id}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: hashiraId });

    // Re-login to get tokens with team_id (no_team should now be false)
    const goonRelogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testgoon', password: 'Test123!' });
    goonToken = goonRelogin.body.data.token;

    const hashiraRelogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testhashira', password: 'Test123!' });
    hashiraToken = hashiraRelogin.body.data.token;

    const adminRelogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testadmin', password: 'Test123!' });
    adminToken = adminRelogin.body.data.token;
  }, 30000);

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/v1/users - Get All Users', () => {
    describe('Authorization', () => {
      /**
       * Test: Admin can get all users from their team
       * Purpose: Verify team isolation - users can only see team members per new system
       */
      it('should allow admin to get all users from their team (team isolation)', async () => {
        const res = await request(app)
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        // Should only see users from same team
        expect(res.body.data.every(user => user.teamId === testTeam.id || user.teamId === null)).toBe(true);
      });

      it('should deny access to non-admin users (GOON)', async () => {
        const res = await request(app)
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${goonToken}`);

        expect(res.statusCode).toBe(403);
      });

      it('should deny access to non-admin users (HASHIRA)', async () => {
        const res = await request(app)
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${hashiraToken}`);

        expect(res.statusCode).toBe(403);
      });

      it('should deny access without token', async () => {
        const res = await request(app)
          .get('/api/v1/users');

        expect(res.statusCode).toBe(401);
      });
    });

    describe('Response Data', () => {
      it('should not include passwords in response', async () => {
        const res = await request(app)
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`);

        res.body.data.forEach(user => {
          expect(user).not.toHaveProperty('password');
        });
      });

      it('should return user with all expected fields', async () => {
        const res = await request(app)
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`);

        const user = res.body.data[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('balance');
        expect(user).toHaveProperty('isActive');
      });
    });
  });

  describe('GET /api/v1/users/:id - Get User By ID', () => {
    describe('Successful Retrieval', () => {
      it('should get user by ID with valid token', async () => {
        const res = await request(app)
          .get(`/api/v1/users/${goonId}`)
          .set('Authorization', `Bearer ${goonToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(goonId);
        expect(res.body.data.username).toBe('testgoon');
      });

      /**
       * Test: Users can view team member profiles
       * Purpose: Verify users can see profiles of other users in their team
       */
      it('should allow users to view team member profiles (team isolation)', async () => {
        const res = await request(app)
          .get(`/api/v1/users/${hashiraId}`)
          .set('Authorization', `Bearer ${goonToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.username).toBe('testhashira');
      });

      it('should not include password in response', async () => {
        const res = await request(app)
          .get(`/api/v1/users/${goonId}`)
          .set('Authorization', `Bearer ${goonToken}`);

        expect(res.body.data).not.toHaveProperty('password');
      });
    });

    describe('Error Handling', () => {
      it('should return 404 for non-existent user', async () => {
        const res = await request(app)
          .get('/api/v1/users/99999')
          .set('Authorization', `Bearer ${goonToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toContain('User not found');
      });

      it('should return 400 for invalid ID format', async () => {
        const res = await request(app)
          .get('/api/v1/users/invalid')
          .set('Authorization', `Bearer ${goonToken}`);

        expect(res.statusCode).toBe(400);
      });

      it('should deny access without token', async () => {
        const res = await request(app)
          .get(`/api/v1/users/${goonId}`);

        expect(res.statusCode).toBe(401);
      });
    });
  });

  describe('PUT /api/v1/users/:id - Update User', () => {
    describe('Successful Updates', () => {
      it('should allow user to update their own profile', async () => {
        const res = await request(app)
          .put(`/api/v1/users/${goonId}`)
          .set('Authorization', `Bearer ${goonToken}`)
          .send({
            bio: 'Updated bio for test',
            profilePicture: 'https://example.com/avatar.jpg'
          });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.bio).toBe('Updated bio for test');
      });

      it('should allow admin to update any user', async () => {
        const res = await request(app)
          .put(`/api/v1/users/${goonId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            bio: 'Admin updated bio'
          });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.bio).toBe('Admin updated bio');
      });

      it('should update only provided fields', async () => {
        const originalUser = await User.findByPk(hashiraId);
        
        const res = await request(app)
          .put(`/api/v1/users/${hashiraId}`)
          .set('Authorization', `Bearer ${hashiraToken}`)
          .send({
            bio: 'New bio only'
          });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.bio).toBe('New bio only');
        expect(res.body.data.email).toBe(originalUser.email);
        expect(res.body.data.username).toBe(originalUser.username);
      });
    });

    describe('Authorization Rules', () => {
      it('should prevent user from updating another user', async () => {
        const res = await request(app)
          .put(`/api/v1/users/${hashiraId}`)
          .set('Authorization', `Bearer ${goonToken}`)
          .send({
            bio: 'Trying to hack'
          });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toContain('only update your own profile');
      });

      it('should prevent changing role without admin', async () => {
        const res = await request(app)
          .put(`/api/v1/users/${goonId}`)
          .set('Authorization', `Bearer ${goonToken}`)
          .send({
            role: 'OYAKATASAMA'
          });

        // Role is silently stripped, update succeeds but role doesn't change
        expect(res.statusCode).toBe(200);
        expect(res.body.data.role).toBe('GOON'); // Role unchanged
      });

      it('should allow admin to change user role', async () => {
        // Create new user to change role
        const newUser = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'rolechange',
            email: 'role@test.com',
            password: 'Test123!',
            role: 'GOON'
          });

        const res = await request(app)
          .put(`/api/v1/users/${newUser.body.data.id}/role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            role: 'HASHIRA'
          });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.role).toBe('HASHIRA');
      });
    });

    describe('Validation', () => {
      it('should validate email format on update', async () => {
        const res = await request(app)
          .put(`/api/v1/users/${goonId}`)
          .set('Authorization', `Bearer ${goonToken}`)
          .send({
            email: 'invalid-email'
          });

        expect(res.statusCode).toBe(400);
      });

      it('should prevent duplicate email', async () => {
        const res = await request(app)
          .put(`/api/v1/users/${goonId}`)
          .set('Authorization', `Bearer ${goonToken}`)
          .send({
            email: 'hashira@test.com' // Already used by testhashira
          });

        expect(res.statusCode).toBe(409);
      });

      it('should prevent duplicate username', async () => {
        const res = await request(app)
          .put(`/api/v1/users/${goonId}`)
          .set('Authorization', `Bearer ${goonToken}`)
          .send({
            username: 'testhashira' // Already exists
          });

        expect(res.statusCode).toBe(409);
      });
    });

    describe('Security', () => {
      it('should not allow updating password through this endpoint', async () => {
        const res = await request(app)
          .put(`/api/v1/users/${goonId}`)
          .set('Authorization', `Bearer ${goonToken}`)
          .send({
            password: 'NewPassword123!'
          });

        // Verify password wasn't changed
        const loginRes = await request(app)
          .post('/api/v1/auth/login')
          .send({
            username: 'testgoon',
            password: 'Test123!' // Original password
          });

        expect(loginRes.statusCode).toBe(200);
      });

      it('should not allow updating id', async () => {
        const res = await request(app)
          .put(`/api/v1/users/${goonId}`)
          .set('Authorization', `Bearer ${goonToken}`)
          .send({
            id: 99999
          });

        const user = await User.findByPk(goonId);
        expect(user.id).toBe(goonId);
      });
    });
  });

  describe('DELETE /api/v1/users/:id - Delete User', () => {
    let userToDelete;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: `deleteme${Date.now()}`,
          email: `delete${Date.now()}@test.com`,
          password: 'Test123!',
          role: 'GOON'
        });
      userToDelete = res.body.data.id;
    });

    describe('Authorization', () => {
      it('should allow admin to delete users', async () => {
        const res = await request(app)
          .delete(`/api/v1/users/${userToDelete}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);

        // Verify user is soft deleted (deactivated, not removed)
        const checkRes = await request(app)
          .get(`/api/v1/users/${userToDelete}`)
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(checkRes.statusCode).toBe(200);
        expect(checkRes.body.data.isActive).toBe(false);
      });

      it('should prevent non-admin from deleting users', async () => {
        const res = await request(app)
          .delete(`/api/v1/users/${userToDelete}`)
          .set('Authorization', `Bearer ${goonToken}`);

        expect(res.statusCode).toBe(403);
      });

      it('should prevent user from deleting themselves', async () => {
        const res = await request(app)
          .delete(`/api/v1/users/${adminId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('cannot delete yourself');
      });
    });

    describe('Error Handling', () => {
      it('should return 404 for non-existent user', async () => {
        const res = await request(app)
          .delete('/api/v1/users/99999')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toContain('User not found');
      });

      it('should deny access without token', async () => {
        const res = await request(app)
          .delete(`/api/v1/users/${userToDelete}`);

        expect(res.statusCode).toBe(401);
      });
    });
  });

  describe('User Balance Operations', () => {
    it('should initialize balance to 0 for new users', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${goonId}`)
        .set('Authorization', `Bearer ${goonToken}`);

      expect(parseFloat(res.body.data.balance)).toBe(0);
    });

    it('should store balance with 2 decimal precision', async () => {
      await User.update({ balance: 123.456 }, { where: { id: goonId } });
      
      const res = await request(app)
        .get(`/api/v1/users/${goonId}`)
        .set('Authorization', `Bearer ${goonToken}`);

      expect(parseFloat(res.body.data.balance)).toBe(123.46);
    });
  });

  describe('User Status Management', () => {
    it('should set isActive to true by default', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${goonId}`)
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.body.data.isActive).toBe(true);
    });

    it('should allow admin to deactivate user', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${goonId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });
  });

  describe('User Profile Information', () => {
    // Reactivate goon user before profile tests since it was deactivated earlier
    beforeAll(async () => {
      await User.update({ isActive: true }, { where: { id: goonId } });
    }, 30000);

    it('should allow setting custom bio', async () => {
      const customBio = 'This is my custom bio with special characters: !@#$%';
      
      const res = await request(app)
        .put(`/api/v1/users/${goonId}`)
        .set('Authorization', `Bearer ${goonToken}`)
        .send({
          bio: customBio
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.bio).toBe(customBio);
    });

    it('should allow setting profile picture URL', async () => {
      const pictureUrl = 'https://example.com/profile.jpg';
      
      const res = await request(app)
        .put(`/api/v1/users/${goonId}`)
        .set('Authorization', `Bearer ${goonToken}`)
        .send({
          profilePicture: pictureUrl
        });

      expect(res.body.data.profilePicture).toBe(pictureUrl);
    });

    it('should allow clearing bio', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${goonId}`)
        .set('Authorization', `Bearer ${goonToken}`)
        .send({
          bio: null
        });

      expect(res.body.data.bio).toBeNull();
    });
  });









  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent update requests', async () => {
      const updates = [
        request(app)
          .put(`/api/v1/users/${goonId}`)
          .set('Authorization', `Bearer ${goonToken}`)
          .send({ bio: 'Update 1' }),
        request(app)
          .put(`/api/v1/users/${goonId}`)
          .set('Authorization', `Bearer ${goonToken}`)
          .send({ bio: 'Update 2' })
      ];

      const results = await Promise.all(updates);
      
      // Both should succeed
      results.forEach(res => {
        expect(res.statusCode).toBe(200);
      });
    });

    it('should handle invalid user ID format gracefully', async () => {
      const res = await request(app)
        .get('/api/v1/users/not-a-number')
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.statusCode).toBe(400);
    });

    it('should handle null values in update', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${goonId}`)
        .set('Authorization', `Bearer ${goonToken}`)
        .send({
          bio: null,
          profilePicture: null
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.bio).toBeNull();
      expect(res.body.data.profilePicture).toBeNull();
    });

    it('should handle empty update request', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${goonId}`)
        .set('Authorization', `Bearer ${goonToken}`)
        .send({});

      expect(res.statusCode).toBe(200);
    });

    it('should validate role values when updating', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${goonId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'INVALID_ROLE'
        });

      expect(res.statusCode).toBe(400);
    });

    it('should prevent SQL injection in user ID', async () => {
      const res = await request(app)
        .get('/api/v1/users/1 OR 1=1')
        .set('Authorization', `Bearer ${goonToken}`);

      expect(res.statusCode).toBe(400);
    });

    it('should handle very long bio text', async () => {
      const longBio = 'a'.repeat(10000); // 10k characters
      
      const res = await request(app)
        .put(`/api/v1/users/${goonId}`)
        .set('Authorization', `Bearer ${goonToken}`)
        .send({
          bio: longBio
        });

      // Should either accept or reject based on validation
      expect([200, 400]).toContain(res.statusCode);
    });

    it('should handle special characters in profile data', async () => {
      const specialBio = 'Test <script>alert("xss")</script> & special chars: éñ™£¥';
      
      const res = await request(app)
        .put(`/api/v1/users/${goonId}`)
        .set('Authorization', `Bearer ${goonToken}`)
        .send({
          bio: specialBio
        });

      expect(res.statusCode).toBe(200);
      // Bio should be stored as-is (XSS protection happens on frontend)
      expect(res.body.data.bio).toBe(specialBio);
    });
  });




});
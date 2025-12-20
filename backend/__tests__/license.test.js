const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/database/connection');
const { User, License } = require('../src/models');
const LicenseService = require('../src/services/LicenseService');

describe('License API and Service', () => {
  let adminToken, hashiraToken, goonToken;
  let adminUser, hashiraUser, goonUser;
  let testLicense;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test users with different roles
    const adminResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'admin',
        email: 'admin@test.com',
        password: 'Test123!',
        role: 'OYAKATASAMA'
      });

    const hashiraResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'hashira',
        email: 'hashira@test.com',
        password: 'Test123!',
        role: 'HASHIRA'
      });

    const goonResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'goon',
        email: 'goon@test.com',
        password: 'Test123!',
        role: 'GOON'
      });

    adminUser = adminResponse.body.data;
    hashiraUser = hashiraResponse.body.data;
    goonUser = goonResponse.body.data;

    // Login to get tokens
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Test123!' });
    adminToken = adminLogin.body.data.token;

    const hashiraLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'hashira', password: 'Test123!' });
    hashiraToken = hashiraLogin.body.data.token;

    const goonLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'goon', password: 'Test123!' });
    goonToken = goonLogin.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up licenses before each test
    await License.destroy({ where: {}, force: true });
  });

  describe('License Service', () => {
    describe('createLicense', () => {
      /**
       * Test: Verify license creation with auto-generated key
       * Purpose: Ensures that a license can be created with team name and that
       * a license key is automatically generated in the correct format (DSCPMS-YEAR-RANDOM)
       */
      test('should create license with auto-generated key', async () => {
        const licenseData = {
          teamName: 'Test Team',
          maxUsers: 10,
          isActive: true
        };

        const license = await LicenseService.createLicense(licenseData);

        expect(license).toBeDefined();
        expect(license.teamName).toBe('Test Team');
        expect(license.maxUsers).toBe(10);
        expect(license.isActive).toBe(true);
        expect(license.licenseKey).toMatch(/^DSCPMS-\d{4}-[A-F0-9]{16}$/);
      });

      /**
       * Test: Verify license creation with custom key
       * Purpose: Tests that a custom license key can be provided and will be used
       * instead of the auto-generated one
       */
      test('should create license with custom key', async () => {
        const licenseData = {
          teamName: 'Custom Team',
          licenseKey: 'CUSTOM-2025-KEY',
          maxUsers: 5,
          isActive: true
        };

        const license = await LicenseService.createLicense(licenseData);

        expect(license.licenseKey).toBe('CUSTOM-2025-KEY');
        expect(license.teamName).toBe('Custom Team');
      });

      /**
       * Test: Verify license creation with expiration date
       * Purpose: Ensures that licenses can be created with an expiration date
       */
      test('should create license with expiration date', async () => {
        const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
        const licenseData = {
          teamName: 'Expiring Team',
          maxUsers: 10,
          isActive: true,
          expirationDate
        };

        const license = await LicenseService.createLicense(licenseData);

        expect(license.expirationDate).toBeDefined();
        expect(new Date(license.expirationDate).getTime()).toBeCloseTo(expirationDate.getTime(), -3);
      });
    });

    describe('getAllLicenses', () => {
      /**
       * Test: Verify retrieval of all licenses
       * Purpose: Tests that all licenses can be retrieved without filters
       */
      test('should get all licenses', async () => {
        await License.create({
          teamName: 'Team 1',
          licenseKey: 'KEY-1',
          maxUsers: 10,
          isActive: true
        });

        await License.create({
          teamName: 'Team 2',
          licenseKey: 'KEY-2',
          maxUsers: 5,
          isActive: false
        });

        const licenses = await LicenseService.getAllLicenses();

        expect(licenses).toHaveLength(2);
      });

      /**
       * Test: Verify filtering by active status
       * Purpose: Tests that licenses can be filtered by their active status
       */
      test('should filter licenses by active status', async () => {
        await License.create({
          teamName: 'Active Team',
          licenseKey: 'ACTIVE-KEY',
          maxUsers: 10,
          isActive: true
        });

        await License.create({
          teamName: 'Inactive Team',
          licenseKey: 'INACTIVE-KEY',
          maxUsers: 5,
          isActive: false
        });

        const activeLicenses = await LicenseService.getAllLicenses({ isActive: true });

        expect(activeLicenses).toHaveLength(1);
        expect(activeLicenses[0].isActive).toBe(true);
      });

      /**
       * Test: Verify filtering by team name
       * Purpose: Tests that licenses can be searched by team name using LIKE query
       */
      test('should filter licenses by team name', async () => {
        await License.create({
          teamName: 'Development Team',
          licenseKey: 'DEV-KEY',
          maxUsers: 10,
          isActive: true
        });

        await License.create({
          teamName: 'Marketing Team',
          licenseKey: 'MKT-KEY',
          maxUsers: 5,
          isActive: true
        });

        const devLicenses = await LicenseService.getAllLicenses({ teamName: 'Development' });

        expect(devLicenses).toHaveLength(1);
        expect(devLicenses[0].teamName).toBe('Development Team');
      });
    });

    describe('getLicenseById', () => {
      /**
       * Test: Verify retrieval of license by ID
       * Purpose: Tests that a specific license can be retrieved by its ID
       */
      test('should get license by ID', async () => {
        const license = await License.create({
          teamName: 'Test Team',
          licenseKey: 'TEST-KEY',
          maxUsers: 10,
          isActive: true
        });

        const foundLicense = await LicenseService.getLicenseById(license.id);

        expect(foundLicense).toBeDefined();
        expect(foundLicense.id).toBe(license.id);
        expect(foundLicense.teamName).toBe('Test Team');
      });

      /**
       * Test: Verify error when license not found
       * Purpose: Tests that an appropriate error is thrown when trying to get a non-existent license
       */
      test('should throw error when license not found', async () => {
        await expect(LicenseService.getLicenseById(99999))
          .rejects.toThrow('License not found');
      });
    });

    describe('updateLicense', () => {
      /**
       * Test: Verify license update
       * Purpose: Tests that license properties can be updated
       */
      test('should update license', async () => {
        const license = await License.create({
          teamName: 'Old Team',
          licenseKey: 'OLD-KEY',
          maxUsers: 10,
          isActive: true
        });

        const updated = await LicenseService.updateLicense(license.id, {
          teamName: 'New Team',
          maxUsers: 20
        });

        expect(updated.teamName).toBe('New Team');
        expect(updated.maxUsers).toBe(20);
      });

      /**
       * Test: Verify error on updating non-existent license
       * Purpose: Tests that an error is thrown when trying to update a license that doesn't exist
       */
      test('should throw error when updating non-existent license', async () => {
        await expect(LicenseService.updateLicense(99999, { teamName: 'New' }))
          .rejects.toThrow('License not found');
      });
    });

    describe('revokeLicense', () => {
      /**
       * Test: Verify license revocation
       * Purpose: Tests that a license can be revoked (set to inactive)
       */
      test('should revoke license', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true
        });

        const revoked = await LicenseService.revokeLicense(license.id);

        expect(revoked.isActive).toBe(false);
      });

      /**
       * Test: Verify error when revoking non-existent license
       * Purpose: Tests that an error is thrown when trying to revoke a non-existent license
       */
      test('should throw error when revoking non-existent license', async () => {
        await expect(LicenseService.revokeLicense(99999))
          .rejects.toThrow('License not found');
      });
    });

    describe('deleteLicense', () => {
      /**
       * Test: Verify license deletion
       * Purpose: Tests that a license can be permanently deleted
       */
      test('should delete license', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true
        });

        const result = await LicenseService.deleteLicense(license.id);

        expect(result).toBe(true);

        const found = await License.findByPk(license.id);
        expect(found).toBeNull();
      });

      /**
       * Test: Verify error when deleting non-existent license
       * Purpose: Tests that an error is thrown when trying to delete a non-existent license
       */
      test('should throw error when deleting non-existent license', async () => {
        await expect(LicenseService.deleteLicense(99999))
          .rejects.toThrow('License not found');
      });
    });

    describe('assignLicenseToUser', () => {
      /**
       * Test: Verify license assignment to user
       * Purpose: Tests that a license can be successfully assigned to a user
       */
      test('should assign license to user', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true
        });

        const result = await LicenseService.assignLicenseToUser(license.id, goonUser.id);

        expect(result).toBe(true);

        const user = await User.findByPk(goonUser.id, {
          include: [License]
        });

        expect(user.Licenses).toHaveLength(1);
        expect(user.Licenses[0].id).toBe(license.id);
      });

      /**
       * Test: Verify error when license is inactive
       * Purpose: Tests that inactive licenses cannot be assigned to users
       */
      test('should throw error when assigning inactive license', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: false
        });

        await expect(LicenseService.assignLicenseToUser(license.id, goonUser.id))
          .rejects.toThrow('License is not active');
      });

      /**
       * Test: Verify error when license max users reached
       * Purpose: Tests that a license cannot be assigned to more users than its maxUsers limit
       */
      test('should throw error when license max users reached', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 1,
          isActive: true
        });

        await LicenseService.assignLicenseToUser(license.id, goonUser.id);

        await expect(LicenseService.assignLicenseToUser(license.id, hashiraUser.id))
          .rejects.toThrow('License has reached maximum users (1)');
      });

      /**
       * Test: Verify error when user not found
       * Purpose: Tests that an error is thrown when trying to assign a license to a non-existent user
       */
      test('should throw error when user not found', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true
        });

        await expect(LicenseService.assignLicenseToUser(license.id, 99999))
          .rejects.toThrow('User not found');
      });

      /**
       * Test: Verify error when license not found
       * Purpose: Tests that an error is thrown when trying to assign a non-existent license
       */
      test('should throw error when license not found', async () => {
        await expect(LicenseService.assignLicenseToUser(99999, goonUser.id))
          .rejects.toThrow('License not found');
      });
    });

    describe('removeLicenseFromUser', () => {
      /**
       * Test: Verify license removal from user
       * Purpose: Tests that a license can be successfully removed from a user
       */
      test('should remove license from user', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true
        });

        await LicenseService.assignLicenseToUser(license.id, goonUser.id);
        const result = await LicenseService.removeLicenseFromUser(license.id, goonUser.id);

        expect(result).toBe(true);

        const user = await User.findByPk(goonUser.id, {
          include: [License]
        });

        expect(user.Licenses).toHaveLength(0);
      });

      /**
       * Test: Verify error when removing from non-existent user
       * Purpose: Tests that an error is thrown when trying to remove a license from a non-existent user
       */
      test('should throw error when user not found', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true
        });

        await expect(LicenseService.removeLicenseFromUser(license.id, 99999))
          .rejects.toThrow('User not found');
      });

      /**
       * Test: Verify error when removing non-existent license
       * Purpose: Tests that an error is thrown when trying to remove a non-existent license
       */
      test('should throw error when license not found', async () => {
        await expect(LicenseService.removeLicenseFromUser(99999, goonUser.id))
          .rejects.toThrow('License not found');
      });
    });

    describe('validateUserLicense', () => {
      /**
       * Test: Verify valid license validation
       * Purpose: Tests that a user with a valid, active license passes validation
       */
      test('should validate user with active license', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true,
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });

        await LicenseService.assignLicenseToUser(license.id, goonUser.id);

        const validation = await LicenseService.validateUserLicense(goonUser.id);

        expect(validation.valid).toBe(true);
        expect(validation.license).toBeDefined();
        expect(validation.license.id).toBe(license.id);
      });

      /**
       * Test: Verify validation fails for user without license
       * Purpose: Tests that validation fails for a user with no assigned licenses
       */
      test('should return invalid for user without license', async () => {
        const validation = await LicenseService.validateUserLicense(goonUser.id);

        expect(validation.valid).toBe(false);
        expect(validation.reason).toBe('No license assigned');
      });

      /**
       * Test: Verify validation fails for inactive license
       * Purpose: Tests that validation fails when user has only inactive licenses
       */
      test('should return invalid for user with inactive license', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true
        });

        await LicenseService.assignLicenseToUser(license.id, goonUser.id);
        await license.update({ isActive: false });

        const validation = await LicenseService.validateUserLicense(goonUser.id);

        expect(validation.valid).toBe(false);
        expect(validation.reason).toBe('No valid license');
      });

      /**
       * Test: Verify validation fails for expired license
       * Purpose: Tests that validation fails when user has only expired licenses
       */
      test('should return invalid for user with expired license', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true,
          expirationDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
        });

        const user = await User.findByPk(goonUser.id);
        await user.addLicense(license);

        const validation = await LicenseService.validateUserLicense(goonUser.id);

        expect(validation.valid).toBe(false);
        expect(validation.reason).toBe('No valid license');
      });

      /**
       * Test: Verify error for non-existent user
       * Purpose: Tests that validation returns invalid for non-existent users
       */
      test('should return invalid for non-existent user', async () => {
        const validation = await LicenseService.validateUserLicense(99999);

        expect(validation.valid).toBe(false);
        expect(validation.reason).toBe('User not found');
      });
    });

    describe('checkExpiringLicenses', () => {
      /**
       * Test: Verify detection of expiring licenses
       * Purpose: Tests that licenses expiring within a threshold period are correctly identified
       */
      test('should find licenses expiring within threshold', async () => {
        const expiringDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

        await License.create({
          teamName: 'Expiring Team',
          licenseKey: 'EXPIRING-KEY',
          maxUsers: 10,
          isActive: true,
          expirationDate: expiringDate
        });

        await License.create({
          teamName: 'Valid Team',
          licenseKey: 'VALID-KEY',
          maxUsers: 10,
          isActive: true,
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        const expiring = await LicenseService.checkExpiringLicenses(7);

        expect(expiring).toHaveLength(1);
        expect(expiring[0].teamName).toBe('Expiring Team');
      });

      /**
       * Test: Verify only active licenses are checked
       * Purpose: Tests that inactive licenses are not included in expiring licenses check
       */
      test('should only check active licenses', async () => {
        await License.create({
          teamName: 'Inactive Expiring',
          licenseKey: 'INACTIVE-KEY',
          maxUsers: 10,
          isActive: false,
          expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        });

        const expiring = await LicenseService.checkExpiringLicenses(7);

        expect(expiring).toHaveLength(0);
      });

      /**
       * Test: Verify custom threshold
       * Purpose: Tests that custom day thresholds work correctly
       */
      test('should respect custom threshold', async () => {
        await License.create({
          teamName: 'Team 1',
          licenseKey: 'KEY-1',
          maxUsers: 10,
          isActive: true,
          expirationDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
        });

        const expiring7 = await LicenseService.checkExpiringLicenses(7);
        const expiring30 = await LicenseService.checkExpiringLicenses(30);

        expect(expiring7).toHaveLength(0);
        expect(expiring30).toHaveLength(1);
      });
    });

    describe('getLicenseStatistics', () => {
      /**
       * Test: Verify license statistics calculation
       * Purpose: Tests that license statistics are correctly calculated including totals,
       * active, expired, and revoked licenses
       */
      test('should calculate license statistics', async () => {
        await License.create({
          teamName: 'Active Team',
          licenseKey: 'ACTIVE-KEY',
          maxUsers: 10,
          isActive: true
        });

        await License.create({
          teamName: 'Inactive Team',
          licenseKey: 'INACTIVE-KEY',
          maxUsers: 5,
          isActive: false
        });

        await License.create({
          teamName: 'Expired Team',
          licenseKey: 'EXPIRED-KEY',
          maxUsers: 3,
          isActive: true,
          expirationDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
        });

        const stats = await LicenseService.getLicenseStatistics();

        expect(stats.total).toBe(3);
        expect(stats.active).toBe(2);
        expect(stats.expired).toBe(1);
      });

      /**
       * Test: Verify user assignment count in statistics
       * Purpose: Tests that the total number of user-license assignments is correctly counted
       */
      test('should count assigned users', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true
        });

        await LicenseService.assignLicenseToUser(license.id, goonUser.id);
        await LicenseService.assignLicenseToUser(license.id, hashiraUser.id);

        const stats = await LicenseService.getLicenseStatistics();

        expect(stats.totalAssignedUsers).toBe(2);
      });
    });
  });

  describe('License API Endpoints', () => {
    describe('GET /api/v1/licenses', () => {
      /**
       * Test: Verify admin can get all licenses
       * Purpose: Tests that admin users can retrieve all licenses via the API
       */
      test('should allow admin to get all licenses', async () => {
        await License.create({
          teamName: 'Team 1',
          licenseKey: 'KEY-1',
          maxUsers: 10,
          isActive: true
        });

        const res = await request(app)
          .get('/api/v1/licenses')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
      });

      /**
       * Test: Verify non-admin cannot get all licenses
       * Purpose: Tests that non-admin users are denied access to license listing
       */
      test('should deny non-admin access to get all licenses', async () => {
        const res = await request(app)
          .get('/api/v1/licenses')
          .set('Authorization', `Bearer ${goonToken}`);

        expect(res.statusCode).toBe(403);
      });

      /**
       * Test: Verify query parameters work
       * Purpose: Tests that filter query parameters are properly passed and applied
       */
      test('should filter licenses with query parameters', async () => {
        await License.create({
          teamName: 'Active Team',
          licenseKey: 'ACTIVE-KEY',
          maxUsers: 10,
          isActive: true
        });

        await License.create({
          teamName: 'Inactive Team',
          licenseKey: 'INACTIVE-KEY',
          maxUsers: 5,
          isActive: false
        });

        const res = await request(app)
          .get('/api/v1/licenses?isActive=true')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(1);
        // isActive should be truthy when filtering for active licenses
        expect(res.body.data[0].teamName).toBe('Active Team');
      });
    });

    describe('GET /api/v1/licenses/:id', () => {
      /**
       * Test: Verify getting license by ID
       * Purpose: Tests that a specific license can be retrieved by its ID
       */
      test('should get license by ID', async () => {
        const license = await License.create({
          teamName: 'Test Team',
          licenseKey: 'TEST-KEY',
          maxUsers: 10,
          isActive: true
        });

        const res = await request(app)
          .get(`/api/v1/licenses/${license.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(license.id);
        expect(res.body.data.teamName).toBe('Test Team');
      });

      /**
       * Test: Verify error for non-existent license
       * Purpose: Tests that the API returns appropriate error for non-existent licenses
       */
      test('should return error for non-existent license', async () => {
        const res = await request(app)
          .get('/api/v1/licenses/99999')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
      });
    });

    describe('POST /api/v1/licenses', () => {
      /**
       * Test: Verify admin can create license
       * Purpose: Tests that admin users can create new licenses via the API
       */
      test('should allow admin to create license', async () => {
        const res = await request(app)
          .post('/api/v1/licenses')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            teamName: 'New Team',
            licenseKey: 'TEST-NEW-KEY-2025',
            maxUsers: 15,
            isActive: true
          });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('License created successfully');
        expect(res.body.data.teamName).toBe('New Team');
        expect(res.body.data.maxUsers).toBe(15);
        expect(res.body.data.licenseKey).toBe('TEST-NEW-KEY-2025');
      });

      /**
       * Test: Verify non-admin cannot create license
       * Purpose: Tests that non-admin users are denied permission to create licenses
       */
      test('should deny non-admin from creating license', async () => {
        const res = await request(app)
          .post('/api/v1/licenses')
          .set('Authorization', `Bearer ${hashiraToken}`)
          .send({
            teamName: 'New Team',
            maxUsers: 15
          });

        expect(res.statusCode).toBe(403);
      });

      /**
       * Test: Verify validation for required fields
       * Purpose: Tests that the API validates required fields when creating a license
       */
      test('should validate required fields', async () => {
        const res = await request(app)
          .post('/api/v1/licenses')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            maxUsers: 15
          });

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
      });
    });

    describe('PUT /api/v1/licenses/:id', () => {
      /**
       * Test: Verify admin can update license
       * Purpose: Tests that admin users can update existing licenses
       */
      test('should allow admin to update license', async () => {
        const license = await License.create({
          teamName: 'Old Team',
          licenseKey: 'OLD-KEY',
          maxUsers: 10,
          isActive: true
        });

        const res = await request(app)
          .put(`/api/v1/licenses/${license.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            teamName: 'Updated Team',
            maxUsers: 20
          });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('License updated successfully');
        expect(res.body.data.teamName).toBe('Updated Team');
        expect(res.body.data.maxUsers).toBe(20);
      });

      /**
       * Test: Verify non-admin cannot update license
       * Purpose: Tests that non-admin users are denied permission to update licenses
       */
      test('should deny non-admin from updating license', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true
        });

        const res = await request(app)
          .put(`/api/v1/licenses/${license.id}`)
          .set('Authorization', `Bearer ${goonToken}`)
          .send({
            teamName: 'Updated Team'
          });

        expect(res.statusCode).toBe(403);
      });
    });

    describe('POST /api/v1/licenses/:id/revoke', () => {
      /**
       * Test: Verify admin can revoke license
       * Purpose: Tests that admin users can revoke licenses
       */
      test('should allow admin to revoke license', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true
        });

        const res = await request(app)
          .put(`/api/v1/licenses/${license.id}/revoke`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('License revoked successfully');
        expect(res.body.data.isActive).toBeFalsy();
      });

      /**
       * Test: Verify non-admin cannot revoke license
       * Purpose: Tests that non-admin users are denied permission to revoke licenses
       */
      test('should deny non-admin from revoking license', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true
        });

        const res = await request(app)
          .put(`/api/v1/licenses/${license.id}/revoke`)
          .set('Authorization', `Bearer ${hashiraToken}`);

        expect(res.statusCode).toBe(403);
      });
    });

    describe('DELETE /api/v1/licenses/:id', () => {
      /**
       * Test: Verify admin can delete license
       * Purpose: Tests that admin users can permanently delete licenses
       */
      test('should allow admin to delete license', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true
        });

        const res = await request(app)
          .delete(`/api/v1/licenses/${license.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('License deleted successfully');

        const found = await License.findByPk(license.id);
        expect(found).toBeNull();
      });

      /**
       * Test: Verify non-admin cannot delete license
       * Purpose: Tests that non-admin users are denied permission to delete licenses
       */
      test('should deny non-admin from deleting license', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true
        });

        const res = await request(app)
          .delete(`/api/v1/licenses/${license.id}`)
          .set('Authorization', `Bearer ${goonToken}`);

        expect(res.statusCode).toBe(403);
      });
    });

    describe('POST /api/v1/licenses/:id/assign', () => {
      /**
       * Test: Verify admin can assign license to user
       * Purpose: Tests that admin users can assign licenses to users
       */
      test('should allow admin to assign license to user', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true
        });

        const res = await request(app)
          .post(`/api/v1/licenses/${license.id}/assign`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            userId: goonUser.id
          });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('License assigned to user successfully');
      });

      /**
       * Test: Verify cannot assign inactive license
       * Purpose: Tests that inactive licenses cannot be assigned to users
       */
      test('should not allow assigning inactive license', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: false
        });

        const res = await request(app)
          .post(`/api/v1/licenses/${license.id}/assign`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            userId: goonUser.id
          });

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
      });
    });

    describe('POST /api/v1/licenses/:id/remove', () => {
      /**
       * Test: Verify admin can remove license from user
       * Purpose: Tests that admin users can remove licenses from users
       */
      test('should allow admin to remove license from user', async () => {
        const license = await License.create({
          teamName: 'Team',
          licenseKey: 'KEY',
          maxUsers: 10,
          isActive: true
        });

        await LicenseService.assignLicenseToUser(license.id, goonUser.id);

        const res = await request(app)
          .delete(`/api/v1/licenses/${license.id}/users`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            userId: goonUser.id
          });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('License removed from user successfully');
      });
    });

    describe('GET /api/v1/licenses/expiring', () => {
      /**
       * Test: Verify admin can check expiring licenses
       * Purpose: Tests that admin users can retrieve licenses expiring within a threshold
       */
      test('should allow admin to check expiring licenses', async () => {
        await License.create({
          teamName: 'Expiring Team',
          licenseKey: 'EXPIRING-KEY',
          maxUsers: 10,
          isActive: true,
          expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        });

        const res = await request(app)
          .get('/api/v1/licenses/expiring?days=7')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
      });

      /**
       * Test: Verify default threshold is used
       * Purpose: Tests that a default threshold of 7 days is used when not specified
       */
      test('should use default threshold when not specified', async () => {
        const res = await request(app)
          .get('/api/v1/licenses/expiring')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('GET /api/v1/licenses/statistics', () => {
      /**
       * Test: Verify admin can get license statistics
       * Purpose: Tests that admin users can retrieve license statistics
       */
      test('should allow admin to get license statistics', async () => {
        await License.create({
          teamName: 'Team 1',
          licenseKey: 'KEY-1',
          maxUsers: 10,
          isActive: true
        });

        await License.create({
          teamName: 'Team 2',
          licenseKey: 'KEY-2',
          maxUsers: 5,
          isActive: false
        });

        const res = await request(app)
          .get('/api/v1/licenses/statistics')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('total');
        expect(res.body.data).toHaveProperty('active');
        expect(res.body.data).toHaveProperty('expired');
        expect(res.body.data).toHaveProperty('revoked');
        expect(res.body.data).toHaveProperty('totalAssignedUsers');
      });

      /**
       * Test: Verify non-admin cannot get statistics
       * Purpose: Tests that non-admin users are denied access to license statistics
       */
      test('should deny non-admin from getting statistics', async () => {
        const res = await request(app)
          .get('/api/v1/licenses/statistics')
          .set('Authorization', `Bearer ${goonToken}`);

        expect(res.statusCode).toBe(403);
      });
    });
  });
});

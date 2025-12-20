const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/database/connection');
const { User, License, Team } = require('../src/models');
const LicenseService = require('../src/services/LicenseService');
const { validateLicenseKey } = require('../src/middleware/validateLicense');

describe('License API and Service (New Flow)', () => {
  let userToken, teamUserToken;
  let userWithoutTeam, userWithTeam;
  let testTeam, testLicense;

  // Mock environment licenses
  const MOCK_LICENSES = [
    { key: 'RIKUGAN-2025-VALID-KEY-A', max_users: 50, expiry_date: '2026-12-31' },
    { key: 'RIKUGAN-2025-VALID-KEY-B', max_users: 100, expiry_date: '2026-12-31' },
    { key: 'RIKUGAN-2025-EXPIRED-KEY', max_users: 25, expiry_date: '2020-12-31' }
  ];

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Mock environment variable for licenses
    process.env.LICENSES = JSON.stringify(MOCK_LICENSES);

    // Create a user without team
    const userResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'noTeamUser',
        email: 'noteam@test.com',
        password: 'Test123!',
        role: 'OYAKATASAMA'
      });

    userWithoutTeam = userResponse.body.data;

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'noTeamUser', password: 'Test123!' });
    userToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up licenses before each test
    await License.destroy({ where: {}, force: true });
  });

  describe('License Service', () => {
    describe('validateForTeamCreation', () => {
      /**
       * Test: Verify valid license key validation for team creation
       * Purpose: Tests that a valid license key from environment config can be validated
       */
      test('should validate correct license key from environment', async () => {
        const result = await LicenseService.validateForTeamCreation('RIKUGAN-2025-VALID-KEY-A');

        expect(result.valid).toBe(true);
        expect(result.config).toBeDefined();
        expect(result.config.maxUsers).toBe(50);
        expect(result.config.key).toBe('RIKUGAN-2025-VALID-KEY-A');
      });

      /**
       * Test: Verify invalid license key is rejected
       * Purpose: Tests that a license key not in environment config is rejected
       */
      test('should reject invalid license key', async () => {
        const result = await LicenseService.validateForTeamCreation('INVALID-KEY-12345');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid or expired license key');
      });

      /**
       * Test: Verify expired license key is rejected
       * Purpose: Tests that an expired license from environment config is rejected
       */
      test('should reject expired license key', async () => {
        const result = await LicenseService.validateForTeamCreation('RIKUGAN-2025-EXPIRED-KEY');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid or expired license key');
      });

      /**
       * Test: Verify already assigned license key is rejected
       * Purpose: Tests that a license key already assigned to another team is rejected
       */
      test('should reject already assigned license key', async () => {
        // Create a license record (simulating assignment to a team)
        await License.create({
          teamId: 1,
          teamName: 'Existing Team',
          licenseKey: 'RIKUGAN-2025-VALID-KEY-B',
          maxUsers: 100,
          expirationDate: new Date('2026-12-31'),
          isActive: true
        });

        const result = await LicenseService.validateForTeamCreation('RIKUGAN-2025-VALID-KEY-B');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('License key is already assigned to another team');
      });
    });

    describe('createLicenseForTeam', () => {
      /**
       * Test: Verify license creation for team
       * Purpose: Tests that a license record can be created when assigning to a team
       */
      test('should create license record for team', async () => {
        const licenseData = {
          teamId: 1,
          teamName: 'Test Team',
          key: 'RIKUGAN-2025-VALID-KEY-A',
          maxUsers: 50,
          expiryDate: new Date('2026-12-31')
        };

        const license = await LicenseService.createLicenseForTeam(licenseData);

        expect(license).toBeDefined();
        expect(license.teamId).toBe(1);
        expect(license.teamName).toBe('Test Team');
        expect(license.licenseKey).toBe('RIKUGAN-2025-VALID-KEY-A');
        expect(license.maxUsers).toBe(50);
        expect(license.isActive).toBe(true);
      });
    });

    describe('getLicenseByTeamId', () => {
      /**
       * Test: Verify retrieval of license by team ID
       * Purpose: Tests that a team's license can be retrieved by team ID
       */
      test('should get license by team ID', async () => {
        await License.create({
          teamId: 1,
          teamName: 'Test Team',
          licenseKey: 'TEST-KEY',
          maxUsers: 50,
          expirationDate: new Date('2026-12-31'),
          isActive: true
        });

        const license = await LicenseService.getLicenseByTeamId(1);

        expect(license).toBeDefined();
        expect(license.teamId).toBe(1);
        expect(license.teamName).toBe('Test Team');
      });

      /**
       * Test: Verify null returned when team has no license
       * Purpose: Tests that null is returned for teams without assigned licenses
       */
      test('should return null when team has no license', async () => {
        const license = await LicenseService.getLicenseByTeamId(999);

        expect(license).toBeNull();
      });
    });

    describe('isLicenseValid', () => {
      /**
       * Test: Verify active license is valid
       * Purpose: Tests that an active, non-expired license is validated as valid
       */
      test('should return true for active non-expired license', async () => {
        await License.create({
          teamId: 1,
          teamName: 'Test Team',
          licenseKey: 'TEST-KEY',
          maxUsers: 50,
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isActive: true
        });

        const isValid = await LicenseService.isLicenseValid(1);

        expect(isValid).toBe(true);
      });

      /**
       * Test: Verify inactive license is invalid
       * Purpose: Tests that inactive licenses are validated as invalid
       */
      test('should return false for inactive license', async () => {
        await License.create({
          teamId: 1,
          teamName: 'Test Team',
          licenseKey: 'TEST-KEY',
          maxUsers: 50,
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isActive: false
        });

        const isValid = await LicenseService.isLicenseValid(1);

        expect(isValid).toBe(false);
      });

      /**
       * Test: Verify expired license is auto-deactivated
       * Purpose: Tests that expired licenses are automatically deactivated and validated as invalid
       */
      test('should auto-deactivate and return false for expired license', async () => {
        const license = await License.create({
          teamId: 1,
          teamName: 'Test Team',
          licenseKey: 'TEST-KEY',
          maxUsers: 50,
          expirationDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          isActive: true
        });

        const isValid = await LicenseService.isLicenseValid(1);

        expect(isValid).toBe(false);

        // Verify license was deactivated
        await license.reload();
        expect(license.isActive).toBe(false);
      });

      /**
       * Test: Verify returns false when no license found
       * Purpose: Tests that validation returns false for teams without licenses
       */
      test('should return false when no license found', async () => {
        const isValid = await LicenseService.isLicenseValid(999);

        expect(isValid).toBe(false);
      });
    });
  });

  describe('License API Endpoints', () => {
    describe('POST /api/v1/licenses/validate', () => {
      /**
       * Test: Verify valid license key validation endpoint
       * Purpose: Tests that the API can validate a correct license key from environment
       */
      test('should validate correct license key', async () => {
        const res = await request(app)
          .post('/api/v1/licenses/validate')
          .send({ licenseKey: 'RIKUGAN-2025-VALID-KEY-A' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.valid).toBe(true);
        expect(res.body.config.maxUsers).toBe(50);
      });

      /**
       * Test: Verify invalid license key rejection
       * Purpose: Tests that the API rejects invalid license keys
       */
      test('should reject invalid license key', async () => {
        const res = await request(app)
          .post('/api/v1/licenses/validate')
          .send({ licenseKey: 'INVALID-KEY-123' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.valid).toBe(false);
      });

      /**
       * Test: Verify expired license key rejection
       * Purpose: Tests that the API rejects expired license keys
       */
      test('should reject expired license key', async () => {
        const res = await request(app)
          .post('/api/v1/licenses/validate')
          .send({ licenseKey: 'RIKUGAN-2025-EXPIRED-KEY' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.valid).toBe(false);
      });

      /**
       * Test: Verify already assigned license key rejection
       * Purpose: Tests that the API rejects license keys already assigned to teams
       */
      test('should reject already assigned license key', async () => {
        await License.create({
          teamId: 1,
          teamName: 'Existing Team',
          licenseKey: 'RIKUGAN-2025-VALID-KEY-B',
          maxUsers: 100,
          expirationDate: new Date('2026-12-31'),
          isActive: true
        });

        const res = await request(app)
          .post('/api/v1/licenses/validate')
          .send({ licenseKey: 'RIKUGAN-2025-VALID-KEY-B' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.valid).toBe(false);
        expect(res.body.message).toContain('already assigned');
      });

      /**
       * Test: Verify missing license key validation
       * Purpose: Tests that the API validates required licenseKey parameter
       */
      test('should return error when license key is missing', async () => {
        const res = await request(app)
          .post('/api/v1/licenses/validate')
          .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Validation failed');
      });
    });

    describe('GET /api/v1/licenses/me', () => {
      /**
       * Test: Verify getting current team license
       * Purpose: Tests that authenticated users can retrieve their team's license
       * Note: In real flow, teamId is assigned during team creation, not manually
       */
      test.skip('should get current team license for authenticated user', async () => {
        // This test is skipped because it tests an artificial scenario
        // In the real application flow, users get teamId during team creation via the team routes
        // Testing this would require setting up the entire team creation flow
      });

      /**
       * Test: Verify error when user has no team
       * Purpose: Tests that users without team assignment get appropriate error from middleware
       */
      test('should return error when user has no team', async () => {
        // Create a new user without team
        const newUser = await request(app)
          .post('/api/v1/auth/register')
          .send({
            username: 'noteam2',
            email: 'noteam2@test.com',
            password: 'Test123!',
            role: 'GOON'
          });

        const login = await request(app)
          .post('/api/v1/auth/login')
          .send({ username: 'noteam2', password: 'Test123!' });

        const res = await request(app)
          .get('/api/v1/licenses/me')
          .set('Authorization', `Bearer ${login.body.data.token}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('No team assigned');
      });

      /**
       * Test: Verify error when not authenticated
       * Purpose: Tests that unauthenticated requests are rejected
       */
      test('should return error when not authenticated', async () => {
        const res = await request(app)
          .get('/api/v1/licenses/me');

        expect(res.statusCode).toBe(401);
      });
    });
  });

  describe('License Middleware - validateLicense', () => {
    /**
     * Test: Verify middleware blocks access when no team assigned
     * Purpose: Tests that middleware rejects requests from users without team assignment
     */
    test('should block access when user has no team assignment', async () => {
      const res = await request(app)
        .get('/api/v1/licenses/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No team assigned');
    });

    /**
     * Test: Verify middleware blocks access when license not found
     * Purpose: Tests that middleware rejects requests when team has no license in database
     */
    test('should block access when license not found for team', async () => {
      // Update user to have a teamId but no license exists
      const userWithFakeTeam = await User.findOne({ where: { username: 'noTeamUser' } });
      userWithFakeTeam.teamId = 999;
      await userWithFakeTeam.save();

      // Re-login to get new token with updated teamId
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'noTeamUser', password: 'Test123!' });
      
      const newToken = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/v1/licenses/me')
        .set('Authorization', `Bearer ${newToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No valid license found');

      // Reset teamId
      userWithFakeTeam.teamId = null;
      await userWithFakeTeam.save();
    });

    /**
     * Test: Verify middleware blocks access when license is inactive
     * Purpose: Tests that middleware rejects requests when license is deactivated
     */
    test('should block access when license is inactive', async () => {
      const user = await User.findOne({ where: { username: 'noTeamUser' } });
      user.teamId = 1;
      await user.save();

      await License.create({
        teamId: 1,
        teamName: 'Test Team',
        licenseKey: 'INACTIVE-KEY',
        maxUsers: 50,
        expirationDate: new Date('2026-12-31'),
        isActive: false
      });

      // Re-login to get token with updated teamId
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'noTeamUser', password: 'Test123!' });
      
      const res = await request(app)
        .get('/api/v1/licenses/me')
        .set('Authorization', `Bearer ${loginRes.body.data.token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('revoked');

      // Cleanup
      user.teamId = null;
      await user.save();
      await License.destroy({ where: { teamId: 1 } });
    });

    /**
     * Test: Verify middleware blocks access when license is expired
     * Purpose: Tests that middleware auto-deactivates expired licenses and blocks access
     */
    test('should block access and auto-deactivate expired license', async () => {
      const user = await User.findOne({ where: { username: 'noTeamUser' } });
      user.teamId = 2;
      await user.save();

      const license = await License.create({
        teamId: 2,
        teamName: 'Test Team',
        licenseKey: 'EXPIRED-KEY',
        maxUsers: 50,
        expirationDate: new Date('2020-01-01'),
        isActive: true
      });

      // Re-login to get token with updated teamId
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'noTeamUser', password: 'Test123!' });
      
      const res = await request(app)
        .get('/api/v1/licenses/me')
        .set('Authorization', `Bearer ${loginRes.body.data.token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('expired');

      // Verify license was auto-deactivated
      await license.reload();
      expect(license.isActive).toBe(false);

      // Cleanup
      user.teamId = null;
      await user.save();
      await License.destroy({ where: { teamId: 2 } });
    });

    /**
     * Test: Verify middleware allows access with valid license
     * Purpose: Tests that middleware allows requests when license is valid
     */
    test('should allow access with valid license', async () => {
      const user = await User.findOne({ where: { username: 'noTeamUser' } });
      user.teamId = 3;
      await user.save();

      await License.create({
        teamId: 3,
        teamName: 'Test Team',
        licenseKey: 'VALID-KEY',
        maxUsers: 50,
        expirationDate: new Date('2026-12-31'),
        isActive: true
      });

      // Re-login to get token with updated teamId
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'noTeamUser', password: 'Test123!' });
      
      const res = await request(app)
        .get('/api/v1/licenses/me')
        .set('Authorization', `Bearer ${loginRes.body.data.token}`);

      // Should pass middleware and return license data
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Cleanup
      user.teamId = null;
      await user.save();
      await License.destroy({ where: { teamId: 3 } });
    });
  });

  describe('License Utility Functions', () => {
    describe('loadLicensesFromConfig', () => {
      const { loadLicensesFromConfig } = require('../src/middleware/validateLicense');

      /**
       * Test: Verify license config loading from environment
       * Purpose: Tests that licenses can be loaded and parsed from environment variable
       */
      test('should load licenses from environment config', () => {
        const licenses = loadLicensesFromConfig();

        expect(licenses).toBeDefined();
        expect(Array.isArray(licenses)).toBe(true);
        expect(licenses.length).toBe(3);
        expect(licenses[0].key).toBe('RIKUGAN-2025-VALID-KEY-A');
      });

      /**
       * Test: Verify handling of missing LICENSES env variable
       * Purpose: Tests that function returns empty array when env variable is missing
       */
      test('should return empty array when LICENSES env is missing', () => {
        const originalLicenses = process.env.LICENSES;
        delete process.env.LICENSES;

        const licenses = loadLicensesFromConfig();

        expect(licenses).toEqual([]);

        // Restore
        process.env.LICENSES = originalLicenses;
      });

      /**
       * Test: Verify handling of invalid JSON in LICENSES env variable
       * Purpose: Tests that function handles malformed JSON gracefully
       */
      test('should return empty array when LICENSES env has invalid JSON', () => {
        const originalLicenses = process.env.LICENSES;
        process.env.LICENSES = 'invalid json {';

        const licenses = loadLicensesFromConfig();

        expect(licenses).toEqual([]);

        // Restore
        process.env.LICENSES = originalLicenses;
      });

      /**
       * Test: Verify handling of non-array LICENSES env variable
       * Purpose: Tests that function validates the structure of parsed JSON
       */
      test('should return empty array when LICENSES env is not an array', () => {
        const originalLicenses = process.env.LICENSES;
        process.env.LICENSES = '{"key": "value"}';

        const licenses = loadLicensesFromConfig();

        expect(licenses).toEqual([]);

        // Restore
        process.env.LICENSES = originalLicenses;
      });
    });

    describe('validateLicenseKey', () => {
      const { validateLicenseKey } = require('../src/middleware/validateLicense');

      /**
       * Test: Verify valid license key returns config
       * Purpose: Tests that valid license keys return proper configuration
       */
      test('should return config for valid license key', () => {
        const config = validateLicenseKey('RIKUGAN-2025-VALID-KEY-A');

        expect(config).toBeDefined();
        expect(config.key).toBe('RIKUGAN-2025-VALID-KEY-A');
        expect(config.maxUsers).toBe(50);
        expect(config.expiryDate).toBeInstanceOf(Date);
      });

      /**
       * Test: Verify invalid license key returns null
       * Purpose: Tests that non-existent license keys are rejected
       */
      test('should return null for invalid license key', () => {
        const config = validateLicenseKey('NON-EXISTENT-KEY');

        expect(config).toBeNull();
      });

      /**
       * Test: Verify expired license key returns null
       * Purpose: Tests that expired licenses from config are rejected
       */
      test('should return null for expired license key', () => {
        const config = validateLicenseKey('RIKUGAN-2025-EXPIRED-KEY');

        expect(config).toBeNull();
      });

      /**
       * Test: Verify case-sensitive license key validation
       * Purpose: Tests that license key validation is case-sensitive
       */
      test('should be case-sensitive for license keys', () => {
        const config = validateLicenseKey('rikugan-2025-valid-key-a');

        expect(config).toBeNull();
      });

      /**
       * Test: Verify empty string returns null
       * Purpose: Tests handling of empty license keys
       */
      test('should return null for empty string', () => {
        const config = validateLicenseKey('');

        expect(config).toBeNull();
      });
    });
  });

  describe('License Service - Error Handling', () => {
    /**
     * Test: Verify service handles database errors in getLicenseByTeamId
     * Purpose: Tests error handling when database queries fail
     */
    test('should throw error when database query fails in getLicenseByTeamId', async () => {
      // Mock License.findOne to throw error
      const originalFindOne = License.findOne;
      License.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(LicenseService.getLicenseByTeamId(1)).rejects.toThrow('Database error');

      // Restore
      License.findOne = originalFindOne;
    });

    /**
     * Test: Verify service handles database errors in createLicenseForTeam
     * Purpose: Tests error handling when license creation fails
     */
    test('should throw error when license creation fails', async () => {
      const originalCreate = License.create;
      License.create = jest.fn().mockRejectedValue(new Error('Creation failed'));

      const licenseData = {
        teamId: 1,
        teamName: 'Test',
        key: 'TEST-KEY',
        maxUsers: 50,
        expiryDate: new Date('2026-12-31')
      };

      await expect(LicenseService.createLicenseForTeam(licenseData)).rejects.toThrow('Creation failed');

      // Restore
      License.create = originalCreate;
    });

    /**
     * Test: Verify service handles errors in validateForTeamCreation
     * Purpose: Tests error handling in validation logic
     */
    test('should throw error when validation fails unexpectedly', async () => {
      const originalFindOne = License.findOne;
      License.findOne = jest.fn().mockRejectedValue(new Error('Validation error'));

      await expect(LicenseService.validateForTeamCreation('RIKUGAN-2025-VALID-KEY-A')).rejects.toThrow('Validation error');

      // Restore
      License.findOne = originalFindOne;
    });

    /**
     * Test: Verify isLicenseValid returns false on database error
     * Purpose: Tests that validation gracefully handles database errors
     */
    test('should return false when isLicenseValid encounters database error', async () => {
      const originalFindOne = License.findOne;
      License.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

      const result = await LicenseService.isLicenseValid(1);

      expect(result).toBe(false);

      // Restore
      License.findOne = originalFindOne;
    });

    /**
     * Test: Verify isLicenseValid handles far future expiration date
     * Purpose: Tests that licenses with far future expiration dates are valid
     */
    test('should return true for active license with far future expiration', async () => {
      await License.create({
        teamId: 10,
        teamName: 'Long Term Team',
        licenseKey: 'LONG-TERM-KEY',
        maxUsers: 50,
        expirationDate: new Date('2099-12-31'),
        isActive: true
      });

      const result = await LicenseService.isLicenseValid(10);

      expect(result).toBe(true);

      // Cleanup
      await License.destroy({ where: { teamId: 10 } });
    });
  });

  describe('License Controller - Additional Edge Cases', () => {
    /**
     * Test: Verify controller handles missing licenseKey in request body
     * Purpose: Tests validation of required request parameters
     */
    test('should return 400 when licenseKey is missing in validate endpoint', async () => {
      const res = await request(app)
        .post('/api/v1/licenses/validate')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    /**
     * Test: Verify controller handles empty string licenseKey
     * Purpose: Tests validation of empty license keys
     */
    test('should reject empty string license key', async () => {
      const res = await request(app)
        .post('/api/v1/licenses/validate')
        .send({ licenseKey: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    /**
     * Test: Verify controller handles whitespace-only licenseKey
     * Purpose: Tests validation of whitespace license keys
     */
    test('should reject whitespace-only license key', async () => {
      const res = await request(app)
        .post('/api/v1/licenses/validate')
        .send({ licenseKey: '   ' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    /**
     * Test: Verify getCurrentTeamLicense endpoint blocked by middleware when no license
     * Purpose: Tests that middleware blocks access before controller when license missing
     */
    test('should return 403 when team has no license (middleware blocks)', async () => {
      const user = await User.findOne({ where: { username: 'noTeamUser' } });
      user.teamId = 999;
      await user.save();

      // Re-login to get token with updated teamId
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'noTeamUser', password: 'Test123!' });

      const res = await request(app)
        .get('/api/v1/licenses/me')
        .set('Authorization', `Bearer ${loginRes.body.data.token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No valid license found');

      // Cleanup
      user.teamId = null;
      await user.save();
    });

    /**
     * Test: Verify getCurrentTeamLicense returns license details
     * Purpose: Tests successful retrieval of team license
     */
    test('should return license details for user with valid team license', async () => {
      const user = await User.findOne({ where: { username: 'noTeamUser' } });
      user.teamId = 5;
      await user.save();

      await License.create({
        teamId: 5,
        teamName: 'Test Team',
        licenseKey: 'TEST-LICENSE-KEY',
        maxUsers: 75,
        expirationDate: new Date('2026-12-31'),
        isActive: true
      });

      // Re-login to get token with updated teamId
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'noTeamUser', password: 'Test123!' });

      const res = await request(app)
        .get('/api/v1/licenses/me')
        .set('Authorization', `Bearer ${loginRes.body.data.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.licenseKey).toBe('TEST-LICENSE-KEY');
      expect(res.body.data.maxUsers).toBe(75);
      expect(res.body.data.isActive).toBe(true);
      expect(res.body.data.teamName).toBe('Test Team');

      // Cleanup
      user.teamId = null;
      await user.save();
      await License.destroy({ where: { teamId: 5 } });
    });
  });

  describe('License Model - Edge Cases', () => {
    /**
     * Test: Verify unique constraint on teamId
     * Purpose: Tests that each team can only have one license
     */
    test('should enforce unique constraint on teamId', async () => {
      await License.create({
        teamId: 100,
        teamName: 'Team A',
        licenseKey: 'KEY-A',
        maxUsers: 50,
        expirationDate: new Date('2026-12-31'),
        isActive: true
      });

      await expect(
        License.create({
          teamId: 100,
          teamName: 'Team B',
          licenseKey: 'KEY-B',
          maxUsers: 50,
          expirationDate: new Date('2026-12-31'),
          isActive: true
        })
      ).rejects.toThrow();

      // Cleanup
      await License.destroy({ where: { teamId: 100 } });
    });

    /**
     * Test: Verify unique constraint on licenseKey
     * Purpose: Tests that each license key can only be used once
     */
    test('should enforce unique constraint on licenseKey', async () => {
      await License.create({
        teamId: 101,
        teamName: 'Team A',
        licenseKey: 'DUPLICATE-KEY',
        maxUsers: 50,
        expirationDate: new Date('2026-12-31'),
        isActive: true
      });

      await expect(
        License.create({
          teamId: 102,
          teamName: 'Team B',
          licenseKey: 'DUPLICATE-KEY',
          maxUsers: 50,
          expirationDate: new Date('2026-12-31'),
          isActive: true
        })
      ).rejects.toThrow();

      // Cleanup
      await License.destroy({ where: { teamId: 101 } });
    });

    /**
     * Test: Verify license can have notes
     * Purpose: Tests that optional notes field works correctly
     */
    test('should allow creating license with notes', async () => {
      const license = await License.create({
        teamId: 103,
        teamName: 'Test Team',
        licenseKey: 'KEY-WITH-NOTES',
        maxUsers: 50,
        expirationDate: new Date('2026-12-31'),
        isActive: true,
        notes: 'This is a test license with notes'
      });

      expect(license.notes).toBe('This is a test license with notes');

      // Cleanup
      await License.destroy({ where: { teamId: 103 } });
    });

    /**
     * Test: Verify license defaults
     * Purpose: Tests that default values are applied correctly
     */
    test('should apply default values for isActive and maxUsers', async () => {
      const license = await License.create({
        teamId: 104,
        teamName: 'Test Team',
        licenseKey: 'KEY-DEFAULTS',
        expirationDate: new Date('2026-12-31')
      });

      expect(license.isActive).toBe(true);
      expect(license.maxUsers).toBe(50);

      // Cleanup
      await License.destroy({ where: { teamId: 104 } });
    });
  });
});

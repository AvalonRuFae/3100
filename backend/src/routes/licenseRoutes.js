const express = require('express');
const router = express.Router();
const LicenseController = require('../controllers/LicenseController');
const { authenticateToken } = require('../middleware/auth');
const { validateLicense } = require('../middleware/validateLicense');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');

/**
 * License Routes
 * 
 * Simplified routes aligned with new license flow:
 * - Licenses configured in environment variables
 * - Validation happens during team creation
 * - No manual license CRUD operations
 */

// Validate license key (public endpoint for team creation)
router.post('/validate',
  validate([
    body('licenseKey')
      .notEmpty()
      .withMessage('License key is required')
      .isString()
      .withMessage('License key must be a string')
  ]),
  LicenseController.validateLicenseKey
);

// Get current team's license (requires authentication)
router.get('/me',
  authenticateToken,
  validateLicense,
  LicenseController.getCurrentTeamLicense
);

module.exports = router;

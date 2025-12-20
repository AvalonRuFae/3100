const { License } = require('../models');
const logger = require('../utils/logger');

/**
 * Middleware to validate user's team license on every protected request
 * 
 * This middleware:
 * 1. Checks if user has a team assignment (team_id in JWT)
 * 2. Retrieves the team's license from database
 * 3. Validates license status and expiration
 * 4. Blocks access if license is invalid, expired, or revoked
 * 
 * Should be used after authenticateToken middleware
 */
const validateLicense = async (req, res, next) => {
  try {
    // Check if user has team assignment
    if (!req.user.teamId) {
      logger.warn(`Access denied: User ${req.user.id} has no team assignment`);
      return res.status(403).json({
        success: false,
        message: 'No team assigned. Please complete team creation to access this resource.'
      });
    }

    // Get team's license from database
    const license = await License.findOne({
      where: { teamId: req.user.teamId }
    });

    // Check if license exists
    if (!license) {
      logger.error(`License not found for team ${req.user.teamId}`);
      return res.status(403).json({
        success: false,
        message: 'No valid license found for your team.'
      });
    }

    // Check if license is active
    if (!license.isActive) {
      logger.warn(`Inactive license for team ${req.user.teamId}`);
      return res.status(403).json({
        success: false,
        message: 'Team license has been revoked. Please contact administrator.'
      });
    }

    // Check if license has expired
    const now = new Date();
    if (license.expirationDate && new Date(license.expirationDate) < now) {
      // Auto-update status to expired
      await license.update({ isActive: false });
      
      logger.warn(`Expired license for team ${req.user.teamId}`);
      return res.status(403).json({
        success: false,
        message: 'Team license has expired. Please renew your license.'
      });
    }

    // Attach license info to request for downstream use
    req.license = {
      id: license.id,
      key: license.licenseKey,
      maxUsers: license.maxUsers,
      expirationDate: license.expirationDate
    };

    // License is valid, proceed to next middleware/handler
    next();
  } catch (error) {
    logger.error('License validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating license',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Load available licenses from environment configuration
 * Should be called on server startup
 */
const loadLicensesFromConfig = () => {
  try {
    const licensesConfig = process.env.LICENSES;
    
    if (!licensesConfig) {
      logger.warn('No LICENSES configuration found in environment variables');
      return [];
    }

    const licenses = JSON.parse(licensesConfig);
    
    if (!Array.isArray(licenses)) {
      logger.error('LICENSES configuration is not an array');
      return [];
    }

    logger.info(`Loaded ${licenses.length} license configurations from environment`);
    return licenses;
  } catch (error) {
    logger.error('Error loading licenses from config:', error);
    return [];
  }
};

/**
 * Validate a license key against environment configuration
 * Used during team creation
 * 
 * @param {string} licenseKey - The license key to validate
 * @returns {Object|null} - License configuration if valid, null otherwise
 */
const validateLicenseKey = (licenseKey) => {
  const availableLicenses = loadLicensesFromConfig();
  
  const licenseConfig = availableLicenses.find(
    license => license.key === licenseKey
  );

  if (!licenseConfig) {
    return null;
  }

  // Check if license has expired
  const expiryDate = new Date(licenseConfig.expiry_date);
  if (expiryDate < new Date()) {
    return null;
  }

  return {
    key: licenseConfig.key,
    maxUsers: licenseConfig.max_users,
    expiryDate: expiryDate
  };
};

module.exports = {
  validateLicense,
  loadLicensesFromConfig,
  validateLicenseKey
};

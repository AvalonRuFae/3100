const { License } = require('../models');
const logger = require('../utils/logger');
const { validateLicenseKey } = require('../middleware/validateLicense');

class LicenseService {
  /**
   * Validate license key against environment configuration
   * and check if it's already assigned to a team
   * 
   * @param {string} licenseKey - License key to validate
   * @returns {Object} Validation result with license config if valid
   */
  async validateForTeamCreation(licenseKey) {
    try {
      // First check if license exists in environment config
      const licenseConfig = validateLicenseKey(licenseKey);
      
      if (!licenseConfig) {
        return {
          valid: false,
          error: 'Invalid or expired license key'
        };
      }

      // Check if license is already assigned to a team
      const existingLicense = await License.findOne({
        where: { licenseKey }
      });

      if (existingLicense) {
        return {
          valid: false,
          error: 'License key is already assigned to another team'
        };
      }

      return {
        valid: true,
        config: licenseConfig
      };
    } catch (error) {
      logger.error('License validation error:', error);
      throw error;
    }
  }

  /**
   * Create a new license record when assigning to a team
   * 
   * @param {Object} licenseData - License data including teamId, key, maxUsers, expiryDate
   * @returns {Object} Created license
   */
  async createLicenseForTeam(licenseData) {
    try {
      const license = await License.create({
        teamId: licenseData.teamId,
        teamName: licenseData.teamName,
        licenseKey: licenseData.key,
        maxUsers: licenseData.maxUsers,
        expirationDate: licenseData.expiryDate,
        isActive: true
      });

      logger.info(`License ${license.licenseKey} assigned to team ${license.teamName}`);
      return license;
    } catch (error) {
      logger.error('Create license error:', error);
      throw error;
    }
  }

  /**
   * Get license by team ID
   * 
   * @param {number} teamId - Team ID
   * @returns {Object|null} License or null if not found
   */
  async getLicenseByTeamId(teamId) {
    try {
      const license = await License.findOne({
        where: { teamId }
      });
      return license;
    } catch (error) {
      logger.error('Get license by team error:', error);
      throw error;
    }
  }

  /**
   * Check if license is valid (active and not expired)
   * 
   * @param {number} teamId - Team ID
   * @returns {boolean} True if valid, false otherwise
   */
  async isLicenseValid(teamId) {
    try {
      const license = await this.getLicenseByTeamId(teamId);
      
      if (!license || !license.isActive) {
        return false;
      }

      // Check expiration
      if (license.expirationDate && new Date(license.expirationDate) < new Date()) {
        // Auto-deactivate expired license
        await license.update({ isActive: false });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('License validation error:', error);
      return false;
    }
  }
}

module.exports = new LicenseService();

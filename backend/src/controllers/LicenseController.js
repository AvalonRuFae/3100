const LicenseService = require('../services/LicenseService');

/**
 * LicenseController
 * 
 * Simplified controller for license validation during team creation.
 * Most license operations are handled by middleware and services.
 * Admin endpoints removed as licenses are managed via environment config.
 */
class LicenseController {
  /**
   * Validate a license key (used during team creation)
   * 
   * Request:
   * - Body:
   *   {
   *     licenseKey: string (required)
   *   }
   * 
   * Response:
   * {
   *   success: true,
   *   valid: boolean,
   *   message: string,
   *   config: {
   *     maxUsers: number,
   *     expiryDate: date
   *   }
   * }
   */
  async validateLicenseKey(req, res, next) {
    try {
      const { licenseKey } = req.body;

      if (!licenseKey) {
        return res.status(400).json({
          success: false,
          message: 'License key is required'
        });
      }

      const result = await LicenseService.validateForTeamCreation(licenseKey);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          valid: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        valid: true,
        message: 'License key is valid',
        config: {
          maxUsers: result.config.maxUsers,
          expiryDate: result.config.expiryDate
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current team's license information
   * 
   * Request:
   * - Headers:
   *   - Authorization: Bearer {token}
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     licenseKey: string,
   *     isActive: boolean,
   *     expirationDate: date,
   *     maxUsers: number,
   *     teamName: string
   *   }
   * }
   */
  async getCurrentTeamLicense(req, res, next) {
    try {
      const license = await LicenseService.getLicenseByTeamId(req.user.teamId);

      if (!license) {
        return res.status(404).json({
          success: false,
          message: 'No license found for your team'
        });
      }

      res.json({
        success: true,
        data: {
          licenseKey: license.licenseKey,
          isActive: license.isActive,
          expirationDate: license.expirationDate,
          maxUsers: license.maxUsers,
          teamName: license.teamName
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LicenseController();

const LicenseService = require('../services/LicenseService');

class LicenseController {
  /**
   * Get all licenses
   * 
   * Request:
   * - Query params (optional):
   *   - status: string ('active', 'inactive', 'revoked')
   *   - type: string
   *   - expiringWithin: number (days)
   * - Headers:
   *   - Authorization: Bearer {token} (admin only)
   * 
   * Response:
   * {
   *   success: true,
   *   data: [
   *     {
   *       id: number,
   *       type: string,
   *       maxUsers: number,
   *       currentUsers: number,
   *       issuedDate: timestamp,
   *       expiryDate: timestamp,
   *       status: string,
   *       createdAt: timestamp,
   *       updatedAt: timestamp
   *     }
   *   ]
   * }
   */
  async getAllLicenses(req, res, next) {
    try {
      const licenses = await LicenseService.getAllLicenses(req.query);

      res.json({
        success: true,
        data: licenses
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get license by ID
   * 
   * Request:
   * - URL params:
   *   - id: license ID
   * - Headers:
   *   - Authorization: Bearer {token}
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     id: number,
   *     type: string,
   *     maxUsers: number,
   *     currentUsers: number,
   *     issuedDate: timestamp,
   *     expiryDate: timestamp,
   *     status: string,
   *     createdAt: timestamp,
   *     updatedAt: timestamp
   *   }
   * }
   */
  async getLicenseById(req, res, next) {
    try {
      const license = await LicenseService.getLicenseById(req.params.id);

      res.json({
        success: true,
        data: license
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new license
   * 
   * Request:
   * - Body:
   *   {
   *     type: string (required),
   *     maxUsers: number (required),
   *     issuedDate: timestamp (required),
   *     expiryDate: timestamp (required),
   *     status: string (default: 'active')
   *   }
   * - Headers:
   *   - Authorization: Bearer {token} (admin only)
   * 
   * Response:
   * {
   *   success: true,
   *   message: 'License created successfully',
   *   data: {
   *     id: number,
   *     type: string,
   *     maxUsers: number,
   *     currentUsers: number,
   *     issuedDate: timestamp,
   *     expiryDate: timestamp,
   *     status: string,
   *     createdAt: timestamp,
   *     updatedAt: timestamp
   *   }
   * }
   */
  async createLicense(req, res, next) {
    try {
      const license = await LicenseService.createLicense(req.body);

      res.status(201).json({
        success: true,
        message: 'License created successfully',
        data: license
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update license
   * 
   * Request:
   * - URL params:
   *   - id: license ID
   * - Body:
   *   {
   *     type: string (optional),
   *     maxUsers: number (optional),
   *     expiryDate: timestamp (optional),
   *     status: string (optional)
   *   }
   * - Headers:
   *   - Authorization: Bearer {token} (admin only)
   * 
   * Response:
   * {
   *   success: true,
   *   message: 'License updated successfully',
   *   data: {
   *     id: number,
   *     type: string,
   *     maxUsers: number,
   *     currentUsers: number,
   *     issuedDate: timestamp,
   *     expiryDate: timestamp,
   *     status: string,
   *     createdAt: timestamp,
   *     updatedAt: timestamp
   *   }
   * }
   */
  async updateLicense(req, res, next) {
    try {
      const license = await LicenseService.updateLicense(req.params.id, req.body);

      res.json({
        success: true,
        message: 'License updated successfully',
        data: license
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke license
   * 
   * Request:
   * - URL params:
   *   - id: license ID
   * - Headers:
   *   - Authorization: Bearer {token} (admin only)
   * 
   * Response:
   * {
   *   success: true,
   *   message: 'License revoked successfully',
   *   data: {
   *     id: number,
   *     type: string,
   *     maxUsers: number,
   *     currentUsers: number,
   *     issuedDate: timestamp,
   *     expiryDate: timestamp,
   *     status: 'revoked',
   *     createdAt: timestamp,
   *     updatedAt: timestamp
   *   }
   * }
   */
  async revokeLicense(req, res, next) {
    try {
      const license = await LicenseService.revokeLicense(req.params.id);

      res.json({
        success: true,
        message: 'License revoked successfully',
        data: license
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete license
   * 
   * Request:
   * - URL params:
   *   - id: license ID
   * - Headers:
   *   - Authorization: Bearer {token} (admin only)
   * 
   * Response:
   * {
   *   success: true,
   *   message: 'License deleted successfully'
   * }
   */
  async deleteLicense(req, res, next) {
    try {
      await LicenseService.deleteLicense(req.params.id);

      res.json({
        success: true,
        message: 'License deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign license to user
   * 
   * Request:
   * - URL params:
   *   - id: license ID
   * - Body:
   *   {
   *     userId: number (required)
   *   }
   * - Headers:
   *   - Authorization: Bearer {token} (admin only)
   * 
   * Response:
   * {
   *   success: true,
   *   message: 'License assigned to user successfully'
   * }
   */
  async assignLicenseToUser(req, res, next) {
    try {
      await LicenseService.assignLicenseToUser(req.params.id, req.body.userId);

      res.json({
        success: true,
        message: 'License assigned to user successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove license from user
   * 
   * Request:
   * - URL params:
   *   - id: license ID
   * - Body:
   *   {
   *     userId: number (required)
   *   }
   * - Headers:
   *   - Authorization: Bearer {token} (admin only)
   * 
   * Response:
   * {
   *   success: true,
   *   message: 'License removed from user successfully'
   * }
   */
  async removeLicenseFromUser(req, res, next) {
    try {
      await LicenseService.removeLicenseFromUser(req.params.id, req.body.userId);

      res.json({
        success: true,
        message: 'License removed from user successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check expiring licenses
   * 
   * Request:
   * - Query params:
   *   - days: number (optional, default: 7) - number of days to check ahead
   * - Headers:
   *   - Authorization: Bearer {token} (admin only)
   * 
   * Response:
   * {
   *   success: true,
   *   data: [
   *     {
   *       id: number,
   *       type: string,
   *       maxUsers: number,
   *       currentUsers: number,
   *       issuedDate: timestamp,
   *       expiryDate: timestamp,
   *       status: string,
   *       createdAt: timestamp,
   *       updatedAt: timestamp
   *     }
   *   ]
   * }
   */
  async checkExpiringLicenses(req, res, next) {
    try {
      const licenses = await LicenseService.checkExpiringLicenses(req.query.days || 7);

      res.json({
        success: true,
        data: licenses
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get license statistics
   * 
   * Request:
   * - Headers:
   *   - Authorization: Bearer {token} (admin only)
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     total: number,
   *     active: number,
   *     inactive: number,
   *     revoked: number,
   *     expiringWithin7Days: number,
   *     expiringWithin30Days: number
   *   }
   * }
   */
  async getLicenseStatistics(req, res, next) {
    try {
      const stats = await LicenseService.getLicenseStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LicenseController();

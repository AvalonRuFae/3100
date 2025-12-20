const { License, User } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const logger = require('../utils/logger');

class LicenseService {
  generateLicenseKey(teamName) {
    const prefix = 'DSCPMS';
    const year = new Date().getFullYear();
    const random = crypto.randomBytes(8).toString('hex').toUpperCase();
    return `${prefix}-${year}-${random}`;
  }

  async createLicense(licenseData) {
    try {
      // Generate license key if not provided
      if (!licenseData.licenseKey) {
        licenseData.licenseKey = this.generateLicenseKey(licenseData.teamName);
      }

      const license = await License.create(licenseData);

      logger.info(`License created: ${license.licenseKey} for ${license.teamName}`);

      return license;
    } catch (error) {
      logger.error('Create license error:', error);
      throw error;
    }
  }

  async getAllLicenses(filters = {}) {
    try {
      const where = {};

      if (filters.isActive !== undefined) {
        // Convert string "true"/"false" to boolean
        where.isActive = filters.isActive === 'true' || filters.isActive === true;
      }

      if (filters.teamName) {
        where.teamName = {
          [Op.like]: `%${filters.teamName}%`
        };
      }

      const licenses = await License.findAll({
        where,
        include: [{
          model: User,
          through: { attributes: [] },
          attributes: ['id', 'username', 'email', 'role']
        }],
        order: [['created_at', 'DESC']]
      });

      return licenses;
    } catch (error) {
      logger.error('Get all licenses error:', error);
      throw error;
    }
  }

  async getLicenseById(licenseId) {
    try {
      const license = await License.findByPk(licenseId, {
        include: [{
          model: User,
          through: { attributes: ['created_at'] },
          attributes: ['id', 'username', 'email', 'role']
        }]
      });

      if (!license) {
        throw new Error('License not found');
      }

      return license;
    } catch (error) {
      logger.error('Get license error:', error);
      throw error;
    }
  }

  async updateLicense(licenseId, updates) {
    try {
      const license = await License.findByPk(licenseId);

      if (!license) {
        throw new Error('License not found');
      }

      await license.update(updates);

      logger.info(`License updated: ${license.licenseKey}`);

      return license;
    } catch (error) {
      logger.error('Update license error:', error);
      throw error;
    }
  }

  async revokeLicense(licenseId) {
    try {
      const license = await License.findByPk(licenseId);

      if (!license) {
        throw new Error('License not found');
      }

      license.isActive = false;
      await license.save();

      logger.info(`License revoked: ${license.licenseKey}`);

      return license;
    } catch (error) {
      logger.error('Revoke license error:', error);
      throw error;
    }
  }

  async deleteLicense(licenseId) {
    try {
      const license = await License.findByPk(licenseId);

      if (!license) {
        throw new Error('License not found');
      }

      await license.destroy();

      logger.info(`License deleted: ${license.licenseKey}`);

      return true;
    } catch (error) {
      logger.error('Delete license error:', error);
      throw error;
    }
  }

  async assignLicenseToUser(licenseId, userId) {
    try {
      const license = await License.findByPk(licenseId);
      const user = await User.findByPk(userId);

      if (!license) {
        throw new Error('License not found');
      }

      if (!user) {
        throw new Error('User not found');
      }

      if (!license.isActive) {
        throw new Error('License is not active');
      }

      // Check if license has reached max users
      const currentUsers = await license.countUsers();
      if (currentUsers >= license.maxUsers) {
        throw new Error(`License has reached maximum users (${license.maxUsers})`);
      }

      await user.addLicense(license);

      logger.info(`License ${license.licenseKey} assigned to user ${user.username}`);

      return true;
    } catch (error) {
      logger.error('Assign license error:', error);
      throw error;
    }
  }

  async removeLicenseFromUser(licenseId, userId) {
    try {
      const license = await License.findByPk(licenseId);
      const user = await User.findByPk(userId);

      if (!license) {
        throw new Error('License not found');
      }

      if (!user) {
        throw new Error('User not found');
      }

      await user.removeLicense(license);

      logger.info(`License ${license.licenseKey} removed from user ${user.username}`);

      return true;
    } catch (error) {
      logger.error('Remove license error:', error);
      throw error;
    }
  }

  async validateUserLicense(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [{
          model: License,
          through: { attributes: [] }
        }]
      });

      if (!user) {
        return { valid: false, reason: 'User not found' };
      }

      if (!user.Licenses || user.Licenses.length === 0) {
        return { valid: false, reason: 'No license assigned' };
      }

      // Check if user has at least one active, non-expired license
      const validLicense = user.Licenses.find(license => 
        license.isActive && 
        (!license.expirationDate || new Date(license.expirationDate) > new Date())
      );

      if (validLicense) {
        return {
          valid: true,
          license: validLicense
        };
      }

      return { valid: false, reason: 'No valid license' };
    } catch (error) {
      logger.error('Validate user license error:', error);
      throw error;
    }
  }

  async checkExpiringLicenses(daysThreshold = 7) {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

      const expiringLicenses = await License.findAll({
        where: {
          isActive: true,
          expirationDate: {
            [Op.lte]: thresholdDate,
            [Op.gte]: new Date()
          }
        },
        include: [{
          model: User,
          through: { attributes: [] },
          attributes: ['id', 'username', 'email']
        }]
      });

      return expiringLicenses;
    } catch (error) {
      logger.error('Check expiring licenses error:', error);
      throw error;
    }
  }

  async getLicenseStatistics() {
    try {
      const total = await License.count();
      const active = await License.count({ where: { isActive: true } });
      const expired = await License.count({
        where: {
          expirationDate: {
            [Op.lt]: new Date()
          }
        }
      });

      const totalUsers = await require('../database/connection').sequelize.models.UserLicense.count();

      return {
        total,
        active,
        expired,
        revoked: total - active - expired,
        totalAssignedUsers: totalUsers
      };
    } catch (error) {
      logger.error('Get license statistics error:', error);
      throw error;
    }
  }
}

module.exports = new LicenseService();

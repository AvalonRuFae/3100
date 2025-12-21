const jwt = require('jsonwebtoken');
const { User, License } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class AuthService {
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username: userData.username },
            { email: userData.email }
          ]
        }
      });

      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      // Create user
      const user = await User.create(userData);
      
      logger.info(`New user registered: ${user.username}`);
      
      return user;
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(username, password) {
    try {
      // Find user by username or email with team and license
      const { Team } = require('../models');
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { username: username },
            { email: username }
          ]
        },
        include: [
          {
            model: Team,
            as: 'team',
            include: [{
              model: License,
              as: 'license',
              attributes: ['licenseKey', 'expirationDate', 'isActive']
            }]
          }
        ]
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        throw new Error('Account is disabled');
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      // Check if user has expired/inactive license
      if (user.team && user.team.license) {
        const license = user.team.license;
        const isExpired = new Date(license.expirationDate) < new Date();
        if (!license.isActive || isExpired) {
          const error = new Error('License expired or invalid');
          error.status = 403;
          throw error;
        }
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Build response with no_team flag and team data per PUML
      const response = {
        user,
        token: this.generateToken({
          id: user.id,
          username: user.username,
          role: user.role,
          teamId: user.teamId,
          teamName: user.team?.name,
          licenseKey: user.team?.license?.licenseKey,
          licenseExpiry: user.team?.license?.expirationDate
        })
      };

      // Add no_team flag if user has no team (PUML spec)
      if (!user.teamId) {
        response.no_team = true;
      }

      // Add team data if user has team (PUML spec)
      if (user.team) {
        response.team = {
          id: user.team.id,
          name: user.team.name,
          license_key: user.team.license?.licenseKey,
          license_expiry: user.team.license?.expirationDate
        };
      }

      logger.info(`User logged in: ${user.username}`);

      return response;
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  generateToken(userOrPayload) {
    // Support both user object and custom payload
    const payload = userOrPayload.id ? {
      id: userOrPayload.id,
      username: userOrPayload.username,
      role: userOrPayload.role,
      teamId: userOrPayload.teamId,
      teamName: userOrPayload.teamName,
      licenseKey: userOrPayload.licenseKey,
      licenseExpiry: userOrPayload.licenseExpiry
    } : userOrPayload;

    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
      }
    );
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      
      if (!user || !user.isActive) {
        throw new Error('Invalid token');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }

      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.username}`);
      
      return true;
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();

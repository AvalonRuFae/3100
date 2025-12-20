const jwt = require('jsonwebtoken');
const { User, License, Team } = require('../models');
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
      // Find user by username or email with team info
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
            include: [
              {
                model: License,
                as: 'license',
                attributes: ['id', 'licenseKey', 'maxUsers', 'expirationDate', 'isActive']
              }
            ]
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

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token with team info
      const token = this.generateToken(user);

      logger.info(`User logged in: ${user.username}`);

      // Check if user has no team
      const noTeamFlag = user.teamId === null;

      return {
        user,
        token,
        noTeamFlag,
        team: user.team
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    // Include team info if user has team
    if (user.teamId) {
      payload.teamId = user.teamId;
      if (user.team) {
        payload.teamName = user.team.name;
      }
    }

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

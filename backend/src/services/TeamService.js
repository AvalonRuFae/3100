const { Team, User, License } = require('../models');
const LicenseService = require('./LicenseService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { sequelize } = require('../database/connection');

class TeamService {
  /**
   * Create a new team with license validation
   * 
   * @param {Object} teamData - Team data including name, description, licenseKey
   * @param {number} userId - ID of user creating the team
   * @returns {Object} Created team with license
   */
  async createTeam(teamData, userId) {
    try {
      const { name, description, licenseKey } = teamData;

      // Validate license key
      const licenseValidation = await LicenseService.validateForTeamCreation(licenseKey);
      
      if (!licenseValidation.valid) {
        throw new Error(licenseValidation.error);
      }

      // Check if team name already exists
      const existingTeam = await Team.findOne({ where: { name } });
      if (existingTeam) {
        throw new Error('Team name already exists');
      }

      // Create team
      const team = await Team.create({
        name,
        description,
        createdBy: userId,
        isActive: true
      });

      // Create license for team
      await LicenseService.createLicenseForTeam({
        teamId: team.id,
        teamName: team.name,
        key: licenseKey,
        maxUsers: licenseValidation.config.maxUsers,
        expiryDate: licenseValidation.config.expiryDate
      });

      // Assign creator to team
      await User.update(
        { teamId: team.id },
        { where: { id: userId } }
      );

      logger.info(`Team ${team.name} created by user ${userId}`);
      
      return team;
    } catch (error) {
      logger.error('Create team error:', error);
      throw error;
    }
  }

  /**
   * Get team by ID with members and license
   * 
   * @param {number} teamId - Team ID
   * @returns {Object|null} Team with members and license
   */
  async getTeamById(teamId) {
    try {
      const team = await Team.findByPk(teamId, {
        include: [
          {
            model: User,
            as: 'members',
            attributes: ['id', 'username', 'email', 'role', 'balance', 'isActive']
          },
          {
            model: License,
            as: 'license',
            attributes: ['licenseKey', 'isActive', 'expirationDate', 'maxUsers']
          }
        ]
      });

      return team;
    } catch (error) {
      logger.error('Get team by ID error:', error);
      throw error;
    }
  }

  /**
   * Get all teams with pagination
   * 
   * @param {Object} options - Query options (page, limit, search)
   * @returns {Object} Teams with pagination info
   */
  async getAllTeams(options = {}) {
    try {
      const { page = 1, limit = 10, search = '' } = options;
      const offset = (page - 1) * limit;

      const where = search ? {
        name: { [Op.like]: `%${search}%` }
      } : {};

      const { count, rows } = await Team.findAndCountAll({
        where,
        include: [
          {
            model: License,
            as: 'license',
            attributes: ['licenseKey', 'isActive', 'expirationDate']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      return {
        teams: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Get all teams error:', error);
      throw error;
    }
  }

  /**
   * Update team information
   * 
   * @param {number} teamId - Team ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated team
   */
  async updateTeam(teamId, updateData) {
    try {
      const team = await Team.findByPk(teamId);
      
      if (!team) {
        throw new Error('Team not found');
      }

      // Only allow updating name, description, and isActive
      const allowedFields = ['name', 'description', 'isActive'];
      const filteredData = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });

      await team.update(filteredData);
      
      logger.info(`Team ${teamId} updated`);
      
      return team;
    } catch (error) {
      logger.error('Update team error:', error);
      throw error;
    }
  }

  /**
   * Delete/deactivate team
   * 
   * @param {number} teamId - Team ID
   * @returns {boolean} Success status
   */
  async deleteTeam(teamId) {
    try {
      const team = await Team.findByPk(teamId);
      
      if (!team) {
        throw new Error('Team not found');
      }

      // Soft delete - just deactivate
      await team.update({ isActive: false });
      
      // Remove team assignment from all members
      await User.update(
        { teamId: null },
        { where: { teamId } }
      );

      logger.info(`Team ${teamId} deactivated`);
      
      return true;
    } catch (error) {
      logger.error('Delete team error:', error);
      throw error;
    }
  }

  /**
   * Add member to team
   * 
   * @param {number} teamId - Team ID
   * @param {number} userId - User ID to add
   * @returns {Object} Updated user
   */
  async addMember(teamId, userId) {
    try {
      const team = await Team.findByPk(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.teamId) {
        throw new Error('User is already a member of a team');
      }

      // Check license capacity
      const license = await LicenseService.getLicenseByTeamId(teamId);
      
      if (license) {
        const memberCount = await User.count({ where: { teamId } });
        if (memberCount >= license.maxUsers) {
          throw new Error('Team has reached maximum user capacity');
        }
      }

      // Add user to team
      await user.update({ teamId });
      
      logger.info(`User ${userId} added to team ${teamId}`);
      
      return user;
    } catch (error) {
      logger.error('Add member error:', error);
      throw error;
    }
  }

  /**
   * Remove member from team
   * 
   * @param {number} teamId - Team ID
   * @param {number} userId - User ID to remove
   * @returns {Object} Updated user
   */
  async removeMember(teamId, userId) {
    try {
      const user = await User.findByPk(userId, { reloadOnUpdate: true });
      
      if (!user) {
        throw new Error('User not found');
      }

      if (user.teamId !== parseInt(teamId)) {
        throw new Error(`User is not a member of this team (user teamId: ${user.teamId}, requested: ${teamId})`);
      }

      // Remove user from team
      await user.update({ teamId: null });
      
      logger.info(`User ${userId} removed from team ${teamId}`);
      
      return user;
    } catch (error) {
      logger.error('Remove member error:', error);
      throw error;
    }
  }

  /**
   * Get team members
   * 
   * @param {number} teamId - Team ID
   * @returns {Array} Team members
   */
  async getTeamMembers(teamId) {
    try {
      const members = await User.findAll({
        where: { teamId },
        attributes: {
          exclude: ['password']
        }
      });

      return members;
    } catch (error) {
      logger.error('Get team members error:', error);
      throw error;
    }
  }

  /**
   * Get team statistics
   * 
   * @param {number} teamId - Team ID
   * @returns {Object} Team statistics
   */
  async getTeamStatistics(teamId) {
    try {
      const { Task, Transaction } = require('../models');
      
      const memberCount = await User.count({ 
        where: { teamId, isActive: true } 
      });

      const taskStats = await Task.findAll({
        include: [{
          model: User,
          as: 'assignee',
          where: { teamId },
          attributes: []
        }],
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('Task.id')), 'totalTasks'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "COMPLETED" THEN 1 ELSE 0 END')), 'completedTasks'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "IN_PROGRESS" THEN 1 ELSE 0 END')), 'inProgressTasks']
        ],
        raw: true
      });

      const totalEarnings = await Transaction.sum('amount', {
        include: [{
          model: User,
          where: { teamId },
          attributes: []
        }],
        where: { type: 'BOUNTY' }
      });

      return {
        memberCount,
        totalTasks: taskStats[0]?.totalTasks || 0,
        completedTasks: taskStats[0]?.completedTasks || 0,
        inProgressTasks: taskStats[0]?.inProgressTasks || 0,
        totalEarnings: totalEarnings || 0
      };
    } catch (error) {
      logger.error('Get team statistics error:', error);
      throw error;
    }
  }
}

module.exports = new TeamService();

const { Team, License, User } = require('../models');
const { sequelize } = require('../database/connection');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class TeamService {
  async createTeamWithLicense(userId, teamName, licenseKey) {
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Validate license exists
      const license = await License.findOne({
        where: { licenseKey },
        transaction
      });

      if (!license) {
        await transaction.rollback();
        const error = new Error('Invalid license');
        error.status = 400;
        throw error;
      }

      // 2. Check if license already assigned
      if (license.assignedUserId !== null) {
        await transaction.rollback();
        const error = new Error('License already assigned');
        error.status = 400;
        throw error;
      }

      // 3. Check if license expired
      if (license.expirationDate && new Date(license.expirationDate) < new Date()) {
        await transaction.rollback();
        const error = new Error('License expired');
        error.status = 400;
        throw error;
      }

      // 4. Check if license is active
      if (!license.isActive) {
        await transaction.rollback();
        const error = new Error('License is not active');
        error.status = 400;
        throw error;
      }

      // 5. Check if user already has a team
      const user = await User.findByPk(userId, { transaction });
      if (user.teamId !== null) {
        await transaction.rollback();
        const error = new Error('User already has a team');
        error.status = 400;
        throw error;
      }

      // 6. Create team
      const team = await Team.create({
        name: teamName
      }, { transaction });

      // 7. Update license with team and assigned user
      await license.update({
        teamId: team.id,
        assignedUserId: userId
      }, { transaction });

      // 8. Update user with team
      await User.update(
        { teamId: team.id },
        { where: { id: userId }, transaction }
      );

      await transaction.commit();

      logger.info(`Team created: ${teamName} by user ${userId} with license ${licenseKey}`);

      // Return team with license info
      return await Team.findByPk(team.id, {
        include: [
          {
            model: License,
            as: 'license',
            attributes: ['id', 'licenseKey', 'maxUsers', 'expirationDate']
          },
          {
            model: User,
            as: 'members',
            attributes: ['id', 'username', 'email', 'role']
          }
        ]
      });
    } catch (error) {
      // Only rollback if transaction hasn't been rolled back yet
      if (!transaction.finished) {
        await transaction.rollback();
      }
      logger.error('Create team with license error:', error);
      // Re-throw error preserving status code
      if (error.status) {
        const err = new Error(error.message);
        err.status = error.status;
        throw err;
      }
      throw error;
    }
  }

  async getTeamById(teamId, includeMembers = true) {
    // Parse ID to ensure correct comparison
    teamId = parseInt(teamId);

    try {
      const include = [
        {
          model: License,
          as: 'license',
          attributes: ['id', 'licenseKey', 'maxUsers', 'expirationDate', 'isActive']
        }
      ];

      if (includeMembers) {
        include.push({
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'email', 'role', 'isActive']
        });
      }

      const team = await Team.findByPk(teamId, { include });

      if (!team) {
        const error = new Error('Team not found');
        error.status = 404;
        throw error;
      }

      return team;
    } catch (error) {
      logger.error('Get team error:', error);
      throw error;
    }
  }

  async getUserTeam(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Team,
            as: 'team',
            include: [
              {
                model: License,
                as: 'license',
                attributes: ['id', 'licenseKey', 'maxUsers', 'expirationDate', 'isActive']
              },
              {
                model: User,
                as: 'members',
                attributes: ['id', 'username', 'email', 'role']
              }
            ]
          }
        ]
      });

      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      return user.team;
    } catch (error) {
      logger.error('Get user team error:', error);
      throw error;
    }
  }

  async updateTeam(teamId, updates, requestingUserId) {
    // Parse IDs to ensure correct comparison
    teamId = parseInt(teamId);
    requestingUserId = parseInt(requestingUserId);

    try {
      const team = await Team.findByPk(teamId, {
        include: [
          {
            model: License,
            as: 'license',
            attributes: ['assignedUserId']
          }
        ]
      });

      if (!team) {
        const error = new Error('Team not found');
        error.status = 404;
        throw error;
      }

      // Check if user is team admin (license owner)
      const user = await User.findByPk(requestingUserId);
      if (user.role !== 'OYAKATASAMA' && team.license?.assignedUserId !== requestingUserId) {
        const error = new Error('Only team admin can update team');
        error.status = 403;
        throw error;
      }

      await team.update(updates);

      logger.info(`Team updated: ${team.name}`);

      return await this.getTeamById(teamId);
    } catch (error) {
      logger.error('Update team error:', error);
      throw error;
    }
  }

  async addMemberToTeam(teamId, userId, requestingUserId) {
    // Parse IDs to ensure correct comparison
    teamId = parseInt(teamId);
    userId = parseInt(userId);
    requestingUserId = parseInt(requestingUserId);

    try {
      const team = await Team.findByPk(teamId, {
        include: [
          {
            model: License,
            as: 'license'
          },
          {
            model: User,
            as: 'members'
          }
        ]
      });

      if (!team) {
        const error = new Error('Team not found');
        error.status = 404;
        throw error;
      }

      // Check if requester is team admin
      const requester = await User.findByPk(requestingUserId);
      if (requester.role !== 'OYAKATASAMA' && team.license?.assignedUserId !== requestingUserId) {
        const error = new Error('Only team admin can add members');
        error.status = 403;
        throw error;
      }

      // Check license capacity
      const currentMemberCount = team.members.length;
      if (currentMemberCount >= team.license.maxUsers) {
        const error = new Error(`Team has reached maximum capacity (${team.license.maxUsers} users)`);
        error.status = 400;
        throw error;
      }

      // Add user to team
      const user = await User.findByPk(userId);
      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      if (user.teamId) {
        const error = new Error('User already belongs to a team');
        error.status = 400;
        throw error;
      }

      await user.update({ teamId: team.id });

      logger.info(`User ${user.username} added to team ${team.name}`);

      return await this.getTeamById(teamId);
    } catch (error) {
      logger.error('Add member to team error:', error);
      throw error;
    }
  }

  async removeMemberFromTeam(teamId, userId, requestingUserId) {
    // Parse IDs to ensure correct comparison
    teamId = parseInt(teamId);
    userId = parseInt(userId);
    requestingUserId = parseInt(requestingUserId);

    try {
      const team = await Team.findByPk(teamId, {
        include: [
          {
            model: License,
            as: 'license',
            attributes: ['assignedUserId']
          }
        ]
      });

      if (!team) {
        const error = new Error('Team not found');
        error.status = 404;
        throw error;
      }

      // Check if requester is team admin
      const requester = await User.findByPk(requestingUserId);
      if (requester.role !== 'OYAKATASAMA' && team.license?.assignedUserId !== requestingUserId) {
        const error = new Error('Only team admin can remove members');
        error.status = 403;
        throw error;
      }

      // Cannot remove team owner
      if (userId === team.license?.assignedUserId) {
        const error = new Error('Cannot remove team owner');
        error.status = 400;
        throw error;
      }

      const user = await User.findByPk(userId);
      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      if (user.teamId !== teamId) {
        const error = new Error('User is not a member of this team');
        error.status = 400;
        throw error;
      }

      await user.update({ teamId: null });

      logger.info(`User ${user.username} removed from team ${team.name}`);

      return await this.getTeamById(teamId);
    } catch (error) {
      logger.error('Remove member from team error:', error);
      throw error;
    }
  }

  async getAllTeams(filters = {}) {
    try {
      const where = {};

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.name) {
        where.name = {
          [Op.like]: `%${filters.name}%`
        };
      }

      const teams = await Team.findAll({
        where,
        include: [
          {
            model: License,
            as: 'license',
            attributes: ['id', 'licenseKey', 'maxUsers', 'expirationDate', 'isActive']
          },
          {
            model: User,
            as: 'members',
            attributes: ['id', 'username', 'email', 'role']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return teams;
    } catch (error) {
      logger.error('Get all teams error:', error);
      throw error;
    }
  }
}

module.exports = new TeamService();

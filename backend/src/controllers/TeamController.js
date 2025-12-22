const TeamService = require('../services/TeamService');

/**
 * TeamController
 * 
 * Handles team management operations including creation, updates,
 * member management, and team statistics.
 */
class TeamController {
  /**
   * Create a new team
   * 
   * POST /api/v1/teams/create (PUML spec) or POST /api/v1/teams (legacy)
   * 
   * Request:
   * - Body:
   *   {
   *     teamName: string (required, 3-100 chars),
   *     name: string (legacy support),
   *     description: string (optional),
   *     licenseKey: string (required)
   *   }
   * 
   * Response:
   * {
   *   success: true,
   *   message: string,
   *   data: {
   *     team: {...},
   *     token: string (new JWT with team info)
   *   }
   * }
   */
  async createTeam(req, res, next) {
    try {
      const { teamName, name, description, licenseKey } = req.body;
      const finalTeamName = teamName || name; // Support both PUML (teamName) and legacy (name)

      if (!finalTeamName || !licenseKey) {
        return res.status(400).json({
          success: false,
          message: 'Team name and license key are required'
        });
      }

      const team = await TeamService.createTeam(
        { name: finalTeamName, description, licenseKey },
        req.user.id
      );

      // Get updated user with team and license info
      const { User, Team, License } = require('../models');
      const updatedUser = await User.findByPk(req.user.id, {
        include: [
          {
            model: Team,
            as: 'team',
            include: [{
              model: License,
              as: 'license',
              attributes: ['licenseKey', 'expirationDate']
            }]
          }
        ]
      });

      // Generate new token with team information per PUML spec
      const AuthService = require('../services/AuthService');
      const token = AuthService.generateToken({
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        teamId: updatedUser.teamId,
        teamName: updatedUser.team?.name,
        licenseKey: updatedUser.team?.license?.licenseKey,
        licenseExpiry: updatedUser.team?.license?.expirationDate
      });

      res.status(200).json({
        success: true,
        message: 'Team created successfully',
        data: {
          team,
          token
        }
      });
    } catch (error) {
      // Handle validation errors (invalid license, duplicate team name, etc.) as 400
      if (error.message.includes('license') || 
          error.message.includes('already exists') ||
          error.message.includes('Invalid') ||
          error.message.includes('expired')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Get team by ID
   * 
   * GET /api/v1/teams/:id
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     id: number,
   *     name: string,
   *     description: string,
   *     isActive: boolean,
   *     members: Array,
   *     license: Object
   *   }
   * }
   */
  async getTeamById(req, res, next) {
    try {
      const { id } = req.params;
      const team = await TeamService.getTeamById(id);

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      res.json({
        success: true,
        data: team
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all teams with pagination
   * 
   * GET /api/v1/teams?page=1&limit=10&search=teamname
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     teams: Array,
   *     pagination: {
   *       total: number,
   *       page: number,
   *       limit: number,
   *       totalPages: number
   *     }
   *   }
   * }
   */
  async getAllTeams(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const result = await TeamService.getAllTeams({ page, limit, search });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update team
   * 
   * PUT /api/v1/teams/:id
   * 
   * Request:
   * - Body:
   *   {
   *     name: string (optional),
   *     description: string (optional),
   *     isActive: boolean (optional)
   *   }
   * 
   * Response:
   * {
   *   success: true,
   *   message: string,
   *   data: Object
   * }
   */
  async updateTeam(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const team = await TeamService.updateTeam(id, updateData);

      res.json({
        success: true,
        message: 'Team updated successfully',
        data: team
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete/deactivate team
   * 
   * DELETE /api/v1/teams/:id
   * 
   * Response:
   * {
   *   success: true,
   *   message: string
   * }
   */
  async deleteTeam(req, res, next) {
    try {
      const { id } = req.params;
      await TeamService.deleteTeam(id);

      res.json({
        success: true,
        message: 'Team deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add member to team (Create new user account)
   * 
   * POST /api/v1/teams/:id/members
   * 
   * Request:
   * - Body:
   *   {
   *     username: string (required),
   *     email: string (required),
   *     password: string (required),
   *     role: string (GOON or HASHIRA, required)
   *   }
   * 
   * Response:
   * {
   *   success: true,
   *   message: string,
   *   data: {
   *     user: Object,
   *     credentials: { username, email, password }
   *   }
   * }
   */
  async addMember(req, res, next) {
    try {
      const { id } = req.params;
      const { username, email, password, role } = req.body;

      if (!username || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, password, and role are required'
        });
      }

      if (!['GOON', 'HASHIRA'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role must be either GOON or HASHIRA'
        });
      }

      const result = await TeamService.addMember(id, { username, email, password, role });

      res.status(201).json({
        success: true,
        message: 'Member created and added to team successfully',
        data: result
      });
    } catch (error) {
      if (error.message.includes('already exists') || 
          error.message.includes('capacity') ||
          error.message.includes('invalid')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Remove member from team
   * 
   * DELETE /api/v1/teams/:id/members/:userId
   * 
   * Response:
   * {
   *   success: true,
   *   message: string
   * }
   */
  async removeMember(req, res, next) {
    try {
      const { id, userId } = req.params;
      await TeamService.removeMember(id, userId);

      res.json({
        success: true,
        message: 'Member removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get team members
   * 
   * GET /api/v1/teams/:id/members
   * 
   * Response:
   * {
   *   success: true,
   *   data: Array
   * }
   */
  async getTeamMembers(req, res, next) {
    try {
      const { id } = req.params;
      const members = await TeamService.getTeamMembers(id);

      res.json({
        success: true,
        data: members
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get team statistics
   * 
   * GET /api/v1/teams/:id/statistics
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     memberCount: number,
   *     totalTasks: number,
   *     completedTasks: number,
   *     inProgressTasks: number,
   *     totalEarnings: number
   *   }
   * }
   */
  async getTeamStatistics(req, res, next) {
    try {
      const { id } = req.params;
      const stats = await TeamService.getTeamStatistics(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's team
   * 
   * GET /api/v1/teams/my-team
   * 
   * Response:
   * {
   *   success: true,
   *   data: Object
   * }
   */
  async getMyTeam(req, res, next) {
    try {
      if (!req.user.teamId) {
        return res.status(404).json({
          success: false,
          message: 'You are not a member of any team'
        });
      }

      const team = await TeamService.getTeamById(req.user.teamId);

      res.json({
        success: true,
        data: team
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TeamController();

const TeamService = require('../services/TeamService');

class TeamController {
  async createTeam(req, res, next) {
    try {
      const { teamName, licenseKey } = req.body;
      const userId = req.user.id;

      const team = await TeamService.createTeamWithLicense(userId, teamName, licenseKey);

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: team
      });
    } catch (error) {
      next(error);
    }
  }

  async getTeam(req, res, next) {
    try {
      const team = await TeamService.getTeamById(req.params.id);

      res.json({
        success: true,
        data: team
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyTeam(req, res, next) {
    try {
      const team = await TeamService.getUserTeam(req.user.id);

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'You are not part of any team'
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

  async updateTeam(req, res, next) {
    try {
      const team = await TeamService.updateTeam(
        req.params.id,
        req.body,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Team updated successfully',
        data: team
      });
    } catch (error) {
      next(error);
    }
  }

  async addMember(req, res, next) {
    try {
      const { userId } = req.body;
      const team = await TeamService.addMemberToTeam(
        req.params.id,
        userId,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Member added to team successfully',
        data: team
      });
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      const { userId } = req.body;
      const team = await TeamService.removeMemberFromTeam(
        req.params.id,
        userId,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Member removed from team successfully',
        data: team
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllTeams(req, res, next) {
    try {
      const teams = await TeamService.getAllTeams(req.query);

      res.json({
        success: true,
        data: teams
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TeamController();

const UserService = require('../services/UserService');

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const users = await UserService.getAllUsers(req.query);

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      // Validate ID format
      const userId = parseInt(req.params.id);
      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }

      const user = await UserService.getUserById(userId);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserProfile(req, res, next) {
    try {
      const userId = req.params.id || req.user.id;
      const profile = await UserService.getUserProfile(userId);

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await UserService.updateUser(req.params.id, req.body, req.user);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await UserService.deleteUser(req.params.id, req.user);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const user = await UserService.updateUserRole(req.params.id, req.body.role);

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserTasks(req, res, next) {
    try {
      const tasks = await UserService.getUserTasks(req.params.id, req.query.status);

      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserTransactions(req, res, next) {
    try {
      const transactions = await UserService.getUserTransactions(
        req.params.id,
        req.query.limit
      );

      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      next(error);
    }
  }

  async getLeaderboard(req, res, next) {
    try {
      const leaderboard = await UserService.getLeaderboard(req.query.limit);

      res.json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();

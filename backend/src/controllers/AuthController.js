const AuthService = require('../services/AuthService');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const user = await AuthService.register(req.body);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user
      });
    } catch (error) {
      // Handle validation errors as 400
      if (error.message.includes('already exists') ||
          error.message.includes('Invalid') ||
          error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      // Use error status if provided (e.g., 403 for expired license)
      const status = error.status || 401;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  async getMe(req, res, next) {
    try {
      res.json({
        success: true,
        data: req.user
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user.id, oldPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

const BountyService = require('../services/BountyService');

class BountyController {
  async adjustBalance(req, res, next) {
    try {
      const { userId, amount, reason } = req.body;
      const result = await BountyService.adjustBalance(
        userId,
        amount,
        reason,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Balance adjusted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserTransactions(req, res, next) {
    try {
      const transactions = await BountyService.getUserTransactions(
        req.params.userId,
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

  async getBountyStatistics(req, res, next) {
    try {
      const stats = await BountyService.getBountyStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BountyController();

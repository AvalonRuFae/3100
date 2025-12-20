const { User, Transaction, Task } = require('../models');
const { sequelize } = require('../database/connection');
const logger = require('../utils/logger');
const NotificationService = require('./NotificationService');

class BountyService {
  async processBounty(userId, taskId, amount) {
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findByPk(userId, { transaction });

      if (!user) {
        throw new Error('User not found');
      }

      const balanceBefore = parseFloat(user.balance);
      const balanceAfter = balanceBefore + parseFloat(amount);

      // Update user balance
      user.balance = balanceAfter;
      await user.save({ transaction });

      // Create transaction record
      await Transaction.create({
        userId,
        taskId,
        type: 'BOUNTY',
        amount: parseFloat(amount),
        description: 'Task completion bounty',
        balanceBefore,
        balanceAfter
      }, { transaction });

      await transaction.commit();

      // Send notification
      await NotificationService.createNotification(
        userId,
        'BOUNTY_RECEIVED',
        {
          amount,
          taskId
        }
      );

      logger.info(`Bounty processed: $${amount} for user ${userId}, task ${taskId}`);

      return {
        balanceBefore,
        balanceAfter,
        amount
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Process bounty error:', error);
      throw error;
    }
  }

  async applyPenalty(userId, taskId, amount, reason = 'Missed deadline') {
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findByPk(userId, { transaction });

      if (!user) {
        throw new Error('User not found');
      }

      const balanceBefore = parseFloat(user.balance);
      const penaltyAmount = parseFloat(amount);
      const balanceAfter = Math.max(0, balanceBefore - penaltyAmount); // Don't go negative

      // Update user balance
      user.balance = balanceAfter;
      await user.save({ transaction });

      // Create transaction record
      await Transaction.create({
        userId,
        taskId,
        type: 'PENALTY',
        amount: -penaltyAmount, // Negative for penalty
        description: reason,
        balanceBefore,
        balanceAfter
      }, { transaction });

      await transaction.commit();

      // Send notification
      await NotificationService.createNotification(
        userId,
        'PENALTY_APPLIED',
        {
          amount: penaltyAmount,
          reason
        }
      );

      logger.info(`Penalty applied: $${penaltyAmount} for user ${userId}, reason: ${reason}`);

      return {
        balanceBefore,
        balanceAfter,
        penaltyAmount
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Apply penalty error:', error);
      throw error;
    }
  }

  async adjustBalance(userId, amount, reason, adminId) {
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findByPk(userId, { transaction });

      if (!user) {
        throw new Error('User not found');
      }

      const balanceBefore = parseFloat(user.balance);
      const adjustment = parseFloat(amount);
      const balanceAfter = Math.max(0, balanceBefore + adjustment);

      // Update user balance
      user.balance = balanceAfter;
      await user.save({ transaction });

      // Create transaction record
      await Transaction.create({
        userId,
        type: 'ADJUSTMENT',
        amount: adjustment,
        description: `Admin adjustment: ${reason}`,
        balanceBefore,
        balanceAfter
      }, { transaction });

      await transaction.commit();

      logger.info(`Balance adjusted: ${adjustment > 0 ? '+' : ''}$${adjustment} for user ${userId} by admin ${adminId}`);

      return {
        balanceBefore,
        balanceAfter,
        adjustment
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Adjust balance error:', error);
      throw error;
    }
  }

  async getUserTransactions(userId, limit = 50) {
    try {
      const transactions = await Transaction.findAll({
        where: { userId },
        include: [{
          model: Task,
          attributes: ['id', 'title']
        }],
        order: [['created_at', 'DESC']],
        limit
      });

      return transactions;
    } catch (error) {
      logger.error('Get user transactions error:', error);
      throw error;
    }
  }

  async getBountyStatistics() {
    try {
      const totalBountiesPaid = await Transaction.sum('amount', {
        where: { type: 'BOUNTY' }
      }) || 0;

      const totalPenalties = await Transaction.sum('amount', {
        where: { type: 'PENALTY' }
      }) || 0;

      const bountyCount = await Transaction.count({
        where: { type: 'BOUNTY' }
      });

      const penaltyCount = await Transaction.count({
        where: { type: 'PENALTY' }
      });

      const avgBounty = bountyCount > 0 ? totalBountiesPaid / bountyCount : 0;

      return {
        totalBountiesPaid: parseFloat(totalBountiesPaid).toFixed(2),
        totalPenalties: Math.abs(parseFloat(totalPenalties)).toFixed(2),
        bountyCount,
        penaltyCount,
        averageBounty: parseFloat(avgBounty).toFixed(2)
      };
    } catch (error) {
      logger.error('Get bounty statistics error:', error);
      throw error;
    }
  }
}

module.exports = new BountyService();

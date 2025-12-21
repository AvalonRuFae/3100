const cron = require('node-cron');
const TaskService = require('../services/TaskService');
const NotificationService = require('../services/NotificationService');
const LicenseService = require('../services/LicenseService');
const logger = require('../utils/logger');

// Check for upcoming deadlines every hour
cron.schedule('0 * * * *', async () => {
  try {
    logger.info('Running deadline reminder job...');
    await TaskService.checkDeadlines();
  } catch (error) {
    logger.error('Deadline reminder job error:', error);
  }
});

// Clean up old notifications every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    logger.info('Running notification cleanup job...');
    await NotificationService.cleanupOldNotifications(30);
  } catch (error) {
    logger.error('Notification cleanup job error:', error);
  }
});

// Check for expiring licenses every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  try {
    logger.info('Checking for expiring licenses...');
    const expiringLicenses = await LicenseService.checkExpiringLicenses(7);
    
    for (const license of expiringLicenses) {
      const daysRemaining = Math.ceil(
        (new Date(license.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
      );

      // Notify all users with this license
      const userIds = license.Users.map(user => user.id);
      if (userIds.length > 0) {
        await NotificationService.notifyMultipleUsers(
          userIds,
          'LICENSE_EXPIRING',
          {
            daysRemaining,
            teamName: license.teamName
          }
        );
      }
    }
  } catch (error) {
    logger.error('License expiration check job error:', error);
  }
});

logger.info('Scheduled jobs initialized');

module.exports = cron;

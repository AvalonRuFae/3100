const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const { authenticateToken } = require('../middleware/auth');
const { validateLicense } = require('../middleware/validateLicense');

// All routes require authentication and valid license
router.use(authenticateToken);
router.use(validateLicense);

// Get user notifications
router.get('/', NotificationController.getUserNotifications);

// Get unread count
router.get('/unread', NotificationController.getUnreadCount);

// Mark notification as read
router.put('/:id/read', NotificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', NotificationController.markAllAsRead);

// Delete notification
router.delete('/:id', NotificationController.deleteNotification);

module.exports = router;

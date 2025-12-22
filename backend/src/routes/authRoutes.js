const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticateToken } = require('../middleware/auth');
const { validate, userValidation } = require('../middleware/validation');
const { body } = require('express-validator');

// Public routes
router.post('/register', 
  validate(userValidation.register),
  AuthController.register
);

router.post('/login',
  validate(userValidation.login),
  AuthController.login
);

// Protected routes
router.get('/me', authenticateToken, AuthController.getMe);

router.post('/change-password',
  authenticateToken,
  validate([
    body('oldPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
  ]),
  AuthController.changePassword
);

module.exports = router;

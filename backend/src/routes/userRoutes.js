const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validate, userValidation } = require('../middleware/validation');
const { validateLicense } = require('../middleware/validateLicense');
const { body } = require('express-validator');

// All routes require authentication
router.use(authenticateToken);

// Get all users - Admin only
router.get('/', 
  authorize('OYAKATASAMA'),
  validateLicense,
  UserController.getAllUsers
);

// Get user by ID
router.get('/:id', UserController.getUserById);

// Get user profile with statistics
router.get('/:id/profile', UserController.getUserProfile);

// Get user tasks
router.get('/:id/tasks', UserController.getUserTasks);

// Get user transactions
router.get('/:id/transactions', UserController.getUserTransactions);

// Update user
router.put('/:id',
  validate(userValidation.update),
  UserController.updateUser
);

// Update user role - Admin only
router.put('/:id/role',
  authorize('OYAKATASAMA'),
  validateLicense,
  validate([
    body('role').isIn(['GOON', 'HASHIRA', 'OYAKATASAMA']).withMessage('Invalid role')
  ]),
  UserController.updateUserRole
);

// Delete user - Admin only
router.delete('/:id',
  authorize('OYAKATASAMA'),
  UserController.deleteUser
);

// Get leaderboard
// router.get('/stats/leaderboard', UserController.getLeaderboard);

module.exports = router;

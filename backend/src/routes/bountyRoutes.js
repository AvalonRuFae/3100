const express = require('express');
const router = express.Router();
const BountyController = require('../controllers/BountyController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { validateLicense } = require('../middleware/validateLicense');

// All routes require authentication and valid license
router.use(authenticateToken);
router.use(validateLicense);

// Get bounty statistics
router.get('/statistics', BountyController.getBountyStatistics);

// Get user transactions
router.get('/transactions/:userId', BountyController.getUserTransactions);

// Adjust user balance - Admin only
router.post('/adjust',
  authorize('OYAKATASAMA'),
  validate([
    body('userId').isInt().withMessage('User ID is required'),
    body('amount').isFloat().withMessage('Amount must be a number'),
    body('reason').notEmpty().withMessage('Reason is required')
  ]),
  BountyController.adjustBalance
);

module.exports = router;

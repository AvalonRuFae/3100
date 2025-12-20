const express = require('express');
const router = express.Router();
const TeamController = require('../controllers/TeamController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { body } = require('express-validator');

// All routes require authentication
router.use(authenticateToken);

// Create team with license (any authenticated user)
router.post('/create',
  validate([
    body('teamName').notEmpty().withMessage('Team name is required'),
    body('licenseKey').notEmpty().withMessage('License key is required')
  ]),
  TeamController.createTeam
);

// Get my team
router.get('/my-team', TeamController.getMyTeam);

// Get all teams (admin only)
router.get('/', authorize('OYAKATASAMA'), TeamController.getAllTeams);

// Get specific team
router.get('/:id', TeamController.getTeam);

// Update team (team admin only)
router.put('/:id', TeamController.updateTeam);

// Add member to team
router.post('/:id/members',
  validate([
    body('userId').isInt().withMessage('User ID is required')
  ]),
  TeamController.addMember
);

// Remove member from team
router.delete('/:id/members',
  validate([
    body('userId').isInt().withMessage('User ID is required')
  ]),
  TeamController.removeMember
);

module.exports = router;

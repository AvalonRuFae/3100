const express = require('express');
const router = express.Router();
const TeamController = require('../controllers/TeamController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get current user's team
router.get('/my-team', TeamController.getMyTeam);

// Team CRUD operations
router.post('/', TeamController.createTeam);
router.post('/create', TeamController.createTeam); // PUML spec endpoint
router.get('/', authorize('OYAKATASAMA'), TeamController.getAllTeams);
router.get('/:id', TeamController.getTeamById);
router.put('/:id', authorize('HASHIRA', 'OYAKATASAMA'), TeamController.updateTeam);
router.delete('/:id', authorize('OYAKATASAMA'), TeamController.deleteTeam);

// Team member management
router.get('/:id/members', TeamController.getTeamMembers);
router.post('/:id/members', authorize('HASHIRA', 'OYAKATASAMA'), TeamController.addMember);
router.delete('/:id/members/:userId', authorize('HASHIRA', 'OYAKATASAMA'), TeamController.removeMember);

// Team statistics
router.get('/:id/statistics', TeamController.getTeamStatistics);

module.exports = router;

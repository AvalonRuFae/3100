const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/TaskController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validate, taskValidation } = require('../middleware/validation');
const validateLicense = require('../middleware/validateLicense');

// All routes require authentication and valid license
router.use(authenticateToken);
router.use(validateLicense);

// Get kanban board
router.get('/board', TaskController.getKanbanBoard);

// Get task statistics
router.get('/statistics', TaskController.getTaskStatistics);

// Get all tasks
router.get('/', TaskController.getAllTasks);

// Get task by ID
router.get('/:id', TaskController.getTaskById);

// Create task - Hashira and Admin only
router.post('/',
  authorize('HASHIRA', 'OYAKATASAMA'),
  validate(taskValidation.create),
  TaskController.createTask
);

// Update task
router.put('/:id',
  validate(taskValidation.update),
  TaskController.updateTask
);

// Delete task - Hashira and Admin only
router.delete('/:id',
  authorize('HASHIRA', 'OYAKATASAMA'),
  TaskController.deleteTask
);

// Assign task to current user (Goons)
router.post('/:id/assign', TaskController.assignTask);

// Update task status
router.put('/:id/status',
  validate(taskValidation.updateStatus),
  TaskController.updateTaskStatus
);

module.exports = router;

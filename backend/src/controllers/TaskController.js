const TaskService = require('../services/TaskService');

class TaskController {
  async getAllTasks(req, res, next) {
    try {
      const tasks = await TaskService.getAllTasks(req.query);

      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req, res, next) {
    try {
      const task = await TaskService.getTaskById(req.params.id);

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  async createTask(req, res, next) {
    try {
      const task = await TaskService.createTask(req.body, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req, res, next) {
    try {
      const task = await TaskService.updateTask(req.params.id, req.body, req.user.id);

      res.json({
        success: true,
        message: 'Task updated successfully',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req, res, next) {
    try {
      await TaskService.deleteTask(req.params.id, req.user.id);

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async assignTask(req, res, next) {
    try {
      const task = await TaskService.assignTask(req.params.id, req.user.id);

      res.json({
        success: true,
        message: 'Task assigned successfully',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTaskStatus(req, res, next) {
    try {
      const task = await TaskService.updateTaskStatus(
        req.params.id,
        req.body.status,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Task status updated successfully',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  async getKanbanBoard(req, res, next) {
    try {
      const board = await TaskService.getKanbanBoard(req.user.id, req.user.role);

      res.json({
        success: true,
        data: board
      });
    } catch (error) {
      next(error);
    }
  }

  async getTaskStatistics(req, res, next) {
    try {
      const stats = await TaskService.getTaskStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaskController();

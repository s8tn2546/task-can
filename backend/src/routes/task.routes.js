const express = require('express');
const {
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');

const router = express.Router();

router.post('/boards/:id/tasks', createTask);
router.patch('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

module.exports = router;

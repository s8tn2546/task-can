const express = require('express');
const {
  getBoard,
  deleteBoard,
  getBoardTasks,
} = require('../controllers/board.controller');

const router = express.Router();

router.get('/:id', getBoard);
router.delete('/:id', deleteBoard);
router.get('/:id/tasks', getBoardTasks);

module.exports = router;

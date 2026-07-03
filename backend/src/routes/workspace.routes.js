const express = require('express');
const {
  listWorkspaces,
  createWorkspace,
  getWorkspace,
} = require('../controllers/workspace.controller');
const { createBoard } = require('../controllers/board.controller');

const router = express.Router();

router.get('/', listWorkspaces);
router.post('/', createWorkspace);
router.get('/:id', getWorkspace);
router.post('/:id/boards', createBoard);

module.exports = router;

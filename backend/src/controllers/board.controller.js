const mongoose = require('mongoose');
const Board = require('../models/Board');
const Task = require('../models/Task');
const Workspace = require('../models/Workspace');

function isMember(workspace, userId) {
  return workspace.ownerId === userId || workspace.members.some((member) => member.userId === userId);
}

async function getWorkspaceForBoard(boardId) {
  const board = await Board.findById(boardId);
  if (!board) {
    return null;
  }

  const workspace = await Workspace.findById(board.workspaceId);
  if (!workspace) {
    return null;
  }

  return { board, workspace };
}

async function createBoard(req, res, next) {
  try {
    const { id: workspaceId } = req.params;
    const { name } = req.body;
    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Board name is required' });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (!isMember(workspace, req.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const board = await Board.create({
      workspaceId,
      name,
      createdBy: req.userId,
    });

    return res.status(201).json(board);
  } catch (error) {
    return next(error);
  }
}

async function getBoard(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const result = await getWorkspaceForBoard(id);
    if (!result) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const { board, workspace } = result;
    if (!isMember(workspace, req.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const tasks = await Task.find({ boardId: board._id }).sort({ status: 1, order: 1 });
    return res.json({ ...board.toObject(), tasks });
  } catch (error) {
    return next(error);
  }
}

async function deleteBoard(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const result = await getWorkspaceForBoard(id);
    if (!result) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const { board, workspace } = result;
    if (!isMember(workspace, req.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await Task.deleteMany({ boardId: board._id });
    await board.deleteOne();

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function getBoardTasks(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const result = await getWorkspaceForBoard(id);
    if (!result) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const { board, workspace } = result;
    if (!isMember(workspace, req.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const tasks = await Task.find({ boardId: board._id }).sort({ status: 1, order: 1 });
    return res.json(tasks);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createBoard,
  getBoard,
  deleteBoard,
  getBoardTasks,
};

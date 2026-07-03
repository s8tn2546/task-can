const mongoose = require('mongoose');
const Board = require('../models/Board');
const Task = require('../models/Task');
const Workspace = require('../models/Workspace');
const { generateTaskBreakdown } = require('../services/groq.service');

function isMember(workspace, userId) {
  return workspace.ownerId === userId || workspace.members.some((member) => member.userId === userId);
}

async function getBoardAndWorkspace(boardId) {
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

async function aiGenerateTasks(req, res, next) {
  try {
    const { id: boardId } = req.params;
    const { prompt } = req.body;

    if (!mongoose.isValidObjectId(boardId)) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await getBoardAndWorkspace(boardId);
    if (!result) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const { board, workspace } = result;
    if (!isMember(workspace, req.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const breakdown = await generateTaskBreakdown(prompt);
    const existingTasks = await Task.find({ boardId: board._id }).sort({ status: 1, order: 1 });
    const nextOrderByStatus = existingTasks.reduce((accumulator, task) => {
      accumulator[task.status] = Math.max(accumulator[task.status] ?? -1, task.order);
      return accumulator;
    }, {});

    const createdTasks = [];
    for (const item of breakdown) {
      const status = 'todo';
      nextOrderByStatus[status] = (nextOrderByStatus[status] ?? -1) + 1;
      const task = await Task.create({
        boardId: board._id,
        title: item.title,
        description: item.description,
        status,
        order: nextOrderByStatus[status],
        parentTaskId: null,
        aiGenerated: true,
        createdBy: req.userId,
      });
      createdTasks.push(task);
    }

    return res.status(201).json(createdTasks);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  aiGenerateTasks,
};

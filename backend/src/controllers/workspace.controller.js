const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');
const Board = require('../models/Board');

function isMember(workspace, userId) {
  return workspace.ownerId === userId || workspace.members.some((member) => member.userId === userId);
}

async function listWorkspaces(req, res, next) {
  try {
    const workspaces = await Workspace.find({
      $or: [{ ownerId: req.userId }, { 'members.userId': req.userId }],
    }).sort({ createdAt: -1 });

    return res.json(workspaces);
  } catch (error) {
    return next(error);
  }
}

async function createWorkspace(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({
      name,
      ownerId: req.userId,
      members: [{ userId: req.userId, role: 'owner' }],
    });

    return res.status(201).json(workspace);
  } catch (error) {
    return next(error);
  }
}

async function getWorkspace(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (!isMember(workspace, req.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const boards = await Board.find({ workspaceId: workspace._id }).sort({ createdAt: -1 });
    return res.json({ ...workspace.toObject(), boards });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listWorkspaces,
  createWorkspace,
  getWorkspace,
};

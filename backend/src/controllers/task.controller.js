const mongoose = require('mongoose');
const Board = require('../models/Board');
const Task = require('../models/Task');
const Workspace = require('../models/Workspace');

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

async function getTaskContext(taskId) {
  const task = await Task.findById(taskId);
  if (!task) {
    return null;
  }

  const board = await Board.findById(task.boardId);
  if (!board) {
    return null;
  }

  const workspace = await Workspace.findById(board.workspaceId);
  if (!workspace) {
    return null;
  }

  return { task, board, workspace };
}

async function recalculateColumnOrders(boardId, status) {
  const tasks = await Task.find({ boardId, status }).sort({ order: 1, createdAt: 1 });
  for (let index = 0; index < tasks.length; index += 1) {
    tasks[index].order = index;
  }
  await Promise.all(tasks.map((task) => task.save()));
}

async function createTask(req, res, next) {
  try {
    const { id: boardId } = req.params;
    const { title, description, status, dueDate, parentTaskId } = req.body;

    if (!mongoose.isValidObjectId(boardId)) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const result = await getBoardAndWorkspace(boardId);
    if (!result) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const { board, workspace } = result;
    if (!isMember(workspace, req.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const taskStatus = status || 'todo';
    const nextOrderTask = await Task.find({ boardId: board._id, status: taskStatus }).sort({ order: -1 }).limit(1);
    const nextOrder = nextOrderTask.length ? nextOrderTask[0].order + 1 : 0;

    const task = await Task.create({
      boardId: board._id,
      title,
      description,
      status: taskStatus,
      order: nextOrder,
      parentTaskId: parentTaskId || null,
      dueDate,
      createdBy: req.userId,
      aiGenerated: false,
    });

    return res.status(201).json(task);
  } catch (error) {
    return next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const { status, order, title, description, dueDate } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const context = await getTaskContext(id);
    if (!context) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { task, board, workspace } = context;
    if (!isMember(workspace, req.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const previousStatus = task.status;
    const shouldReorder = typeof status === 'string' || typeof order === 'number';

    if (typeof title === 'string') {
      task.title = title;
    }

    if (typeof description === 'string') {
      task.description = description;
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate;
    }

    if (typeof status === 'string') {
      task.status = status;
    }

    if (typeof order === 'number') {
      task.order = order;
    }

    await task.save();

    if (shouldReorder) {
      const affectedStatuses = new Set([previousStatus, task.status]);
      for (const columnStatus of affectedStatuses) {
        await recalculateColumnOrders(board._id, columnStatus);
      }
    }

    const updatedTask = await Task.findById(task._id);
    return res.json(updatedTask);
  } catch (error) {
    return next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const context = await getTaskContext(id);
    if (!context) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { task, board, workspace } = context;
    if (!isMember(workspace, req.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const status = task.status;
    await task.deleteOne();
    await recalculateColumnOrders(board._id, status);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createTask,
  updateTask,
  deleteTask,
};

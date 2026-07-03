const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['todo', 'ongoing', 'completed'],
      default: 'todo',
    },
    order: {
      type: Number,
      required: true,
    },
    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    dueDate: {
      type: Date,
    },
    createdBy: {
      type: String,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Task', taskSchema);

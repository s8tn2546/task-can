const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Board', boardSchema);

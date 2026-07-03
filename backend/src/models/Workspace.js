const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  ownerId: {
    type: String,
    ref: 'User',
    required: true,
  },
  members: [
    {
      userId: {
        type: String,
        ref: 'User',
        required: true,
      },
      role: {
        type: String,
        enum: ['owner', 'admin', 'member'],
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Workspace', workspaceSchema);

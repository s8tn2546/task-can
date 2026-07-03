const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);

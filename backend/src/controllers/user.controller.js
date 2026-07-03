const User = require('../models/User');

async function syncUser(req, res, next) {
  try {
    const token = req.userToken || {};
    const email = token.email;
    const displayName = token.name || token.displayName || '';

    if (!email) {
      return res.status(400).json({ error: 'Email is required from token' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        _id: req.userId,
        email,
        displayName,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  syncUser,
};

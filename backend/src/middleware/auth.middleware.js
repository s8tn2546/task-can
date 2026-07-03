const { getFirebaseAuth } = require('../config/firebase');

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = header.slice(7).trim();
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedToken = await getFirebaseAuth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.userToken = decodedToken;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = authMiddleware;

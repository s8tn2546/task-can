const { getFirebaseAuth } = require('../config/firebase');

function parseDevToken(token) {
  if (!token.startsWith('dev.')) {
    return null;
  }

  try {
    const payload = Buffer.from(token.slice(4), 'base64').toString('utf8');
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
}

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

    if (process.env.DEV_AUTH_BYPASS === 'true') {
      const devToken = parseDevToken(token);
      if (devToken?.uid && devToken?.email) {
        req.userId = String(devToken.uid);
        req.userToken = {
          uid: String(devToken.uid),
          email: String(devToken.email),
          name: devToken.name || devToken.displayName || '',
          displayName: devToken.displayName || devToken.name || '',
        };
        return next();
      }
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

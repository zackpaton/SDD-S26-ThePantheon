/**
 * Express middleware: verifies Firebase ID tokens from the Authorization Bearer header.
 */
const { admin } = require('./firebase');

/** Validates the JSON Web Token, attaches decoded claims to req.user, or responds with 401. */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authenticate };

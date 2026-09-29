const { verifyToken } = require('../utils/tokens');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const env = require('../config/env');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Authentication required');

    const decoded = verifyToken(token);
    const idleMs = env.sessionIdleMinutes * 60 * 1000;
    if (decoded.iat && Date.now() - decoded.iat * 1000 > idleMs) {
      throw new ApiError(401, 'Session expired. Please sign in again.');
    }

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user || user.status !== 'active') {
      throw new ApiError(401, 'Account is not active');
    }

    req.user = user;
    req.auth = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Invalid or expired session'));
    }
    next(error);
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    req.auth = verifyToken(token);
  } catch (_error) {
    req.auth = null;
  }
  next();
}

module.exports = { authenticate, optionalAuth };

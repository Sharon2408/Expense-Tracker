const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * Derives the authenticated user id from the verified access token only.
 * Never trust a user_id sent in the request body/query - every downstream
 * query must use req.userId, not anything supplied by the client.
 */
function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      throw new ApiError(401, 'Not authenticated');
    }
    const payload = jwt.verify(token, env.jwt.accessSecret);
    req.userId = payload.sub;
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired session'));
  }
}

module.exports = { requireAuth };

import jwt from 'jsonwebtoken';

/**
 * Generate JWT access token
 * @param {Object} payload - JWT payload
 * @param {string} payload.userId - User ID
 * @param {string} payload.username - Username
 * @param {string} payload.email - Email
 * @param {Array} payload.roles - User roles
 * @param {Object} options - JWT options
 * @returns {string} JWT token
 */
export const generateAccessToken = (payload, options = {}) => {
  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'knowledge-db',
    audience: process.env.JWT_AUDIENCE || 'knowledge-db-users'
  };

  return jwt.sign(
    {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      roles: payload.roles || [],
      type: 'access'
    },
    process.env.JWT_SECRET || 'devsecret',
    { ...defaultOptions, ...options }
  );
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - JWT payload
 * @param {string} payload.userId - User ID
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      userId: payload.userId,
      type: 'refresh'
    },
    process.env.JWT_SECRET || 'devsecret',
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER || 'knowledge-db',
      audience: process.env.JWT_AUDIENCE || 'knowledge-db-users'
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'devsecret', {
    issuer: process.env.JWT_ISSUER || 'knowledge-db',
    audience: process.env.JWT_AUDIENCE || 'knowledge-db-users'
  });
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

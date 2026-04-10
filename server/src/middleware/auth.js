const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Authenticate JWT token from Authorization header or httpOnly cookie (SSO)
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await query(
      'SELECT id, email, role, display_name, avatar_url, subscription_tier, account_status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.account_status !== 'active') {
      return res.status(403).json({ error: 'Account is ' + user.account_status });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Optional auth — attaches user if token present, continues either way
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await query(
      'SELECT id, email, role, display_name, avatar_url, subscription_tier, account_status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length > 0 && result.rows[0].account_status === 'active') {
      req.user = result.rows[0];
    }
  } catch {
    // Token invalid — continue as unauthenticated
  }

  next();
};

/**
 * Require specific role(s)
 * Usage: requireRole('producer'), requireRole('producer', 'admin')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }

    next();
  };
};

/**
 * Require minimum subscription tier
 * Tier hierarchy: free < pro < vip
 */
const requireTier = (minimumTier) => {
  const tierLevel = { free: 0, pro: 1, vip: 2 };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admins bypass tier checks
    if (req.user.role === 'admin') {
      return next();
    }

    const userLevel = tierLevel[req.user.subscription_tier] || 0;
    const requiredLevel = tierLevel[minimumTier] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: `This feature requires a ${minimumTier} subscription`,
        required_tier: minimumTier,
        current_tier: req.user.subscription_tier,
      });
    }

    next();
  };
};

module.exports = { authenticate, optionalAuth, requireRole, requireTier };

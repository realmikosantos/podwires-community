const { Router } = require('express');
const { authenticate, optionalAuth, requireTier } = require('../middleware/auth');
const { query } = require('../config/database');

const router = Router();

/**
 * GET /api/spaces — List all accessible spaces
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const userTier = req.user?.subscription_tier || 'free';
    const userRole = req.user?.role;
    const tierLevel = { free: 0, pro: 1, vip: 2 };
    const level = tierLevel[userTier] || 0;

    // Admins see everything
    const isAdmin = userRole === 'admin';

    const result = await query(
      `SELECT id, slug, name, description, icon, color, visibility,
              required_tier, allowed_roles, post_count, member_count
       FROM spaces
       WHERE is_active = TRUE
       ORDER BY sort_order ASC`
    );

    const spaces = result.rows.map((space) => {
      const requiredLevel = tierLevel[space.required_tier] || 0;
      const hasAccess =
        isAdmin ||
        (level >= requiredLevel &&
          (!userRole || space.allowed_roles.includes(userRole)));

      return {
        ...space,
        hasAccess,
        isLocked: !hasAccess,
      };
    });

    res.json({ spaces });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/spaces/:slug — Get space with posts
 */
router.get('/:slug', authenticate, async (req, res, next) => {
  try {
    const { slug } = req.params;

    const spaceResult = await query(
      'SELECT * FROM spaces WHERE slug = $1 AND is_active = TRUE',
      [slug]
    );

    if (spaceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Space not found' });
    }

    const space = spaceResult.rows[0];

    // Check access
    const tierLevel = { free: 0, pro: 1, vip: 2 };
    const userLevel = tierLevel[req.user.subscription_tier] || 0;
    const requiredLevel = tierLevel[space.required_tier] || 0;

    if (
      req.user.role !== 'admin' &&
      (userLevel < requiredLevel || !space.allowed_roles.includes(req.user.role))
    ) {
      return res.status(403).json({
        error: 'Access denied',
        required_tier: space.required_tier,
        allowed_roles: space.allowed_roles,
      });
    }

    // Get posts
    const { page = 1, limit = 25 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const postsResult = await query(
      `SELECT p.*, u.display_name AS author_name, u.avatar_url AS author_avatar, u.role AS author_role
       FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.space_id = $1
       ORDER BY p.is_pinned DESC, p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [space.id, parseInt(limit, 10), offset]
    );

    res.json({ space, posts: postsResult.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/spaces/:slug/join — Join a space
 */
router.post('/:slug/join', authenticate, async (req, res, next) => {
  try {
    const { slug } = req.params;

    const spaceResult = await query(
      'SELECT id, required_tier, allowed_roles FROM spaces WHERE slug = $1',
      [slug]
    );

    if (spaceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Space not found' });
    }

    const space = spaceResult.rows[0];

    await query(
      'INSERT INTO space_memberships (user_id, space_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, space.id]
    );

    // Increment member count
    await query(
      'UPDATE spaces SET member_count = member_count + 1 WHERE id = $1',
      [space.id]
    );

    res.json({ message: 'Joined space' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

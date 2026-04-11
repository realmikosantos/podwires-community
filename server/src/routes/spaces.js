const { Router } = require('express');
const { authenticate, optionalAuth, requireRole, requireTier } = require('../middleware/auth');
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
 * POST /api/spaces — Create a new space (admin only)
 */
router.post('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const {
      name,
      slug,
      description,
      icon,
      color,
      requiredTier = 'free',
      allowedRoles = ['producer', 'client', 'admin'],
      visibility = 'public',
      sortOrder,
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'name and slug are required' });
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ error: 'slug must contain only lowercase letters, numbers, and hyphens' });
    }

    // Check slug uniqueness
    const existing = await query('SELECT id FROM spaces WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A space with this slug already exists' });
    }

    const validTiers = ['free', 'pro', 'vip'];
    const validRoles = ['producer', 'client', 'admin'];
    const validVisibility = ['public', 'private', 'secret'];

    if (!validTiers.includes(requiredTier)) {
      return res.status(400).json({ error: 'Invalid requiredTier' });
    }
    if (!Array.isArray(allowedRoles) || allowedRoles.some(r => !validRoles.includes(r))) {
      return res.status(400).json({ error: 'Invalid allowedRoles' });
    }
    if (!validVisibility.includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility' });
    }

    // Determine sort order (append to end by default)
    let order = sortOrder;
    if (order == null) {
      const maxResult = await query('SELECT COALESCE(MAX(sort_order), 0) + 10 AS next_order FROM spaces');
      order = maxResult.rows[0].next_order;
    }

    const result = await query(
      `INSERT INTO spaces
         (name, slug, description, icon, color, required_tier, allowed_roles, visibility, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
       RETURNING id, slug, name, description, icon, color, visibility,
                 required_tier, allowed_roles, post_count, member_count`,
      [
        name,
        slug,
        description || null,
        icon || null,
        color || '#4840B0',
        requiredTier,
        allowedRoles,
        visibility,
        order,
      ]
    );

    res.status(201).json({ space: result.rows[0] });
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
 * PATCH /api/spaces/:slug — Edit space name/description/color (admin only)
 */
router.patch('/:slug', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { name, description, color } = req.body;

    const existing = await query('SELECT id FROM spaces WHERE slug = $1 AND is_active = TRUE', [slug]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Space not found' });

    const updates = [];
    const vals = [];
    let idx = 1;
    if (name !== undefined)        { updates.push(`name = $${idx++}`);        vals.push(name); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); vals.push(description); }
    if (color !== undefined)       { updates.push(`color = $${idx++}`);       vals.push(color); }

    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    vals.push(slug);
    const result = await query(
      `UPDATE spaces SET ${updates.join(', ')}, updated_at = NOW()
       WHERE slug = $${idx} RETURNING id, slug, name, description, color, visibility,
             required_tier, allowed_roles, post_count, member_count`,
      vals
    );

    res.json({ space: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/spaces/:slug — Soft-delete a space (admin only)
 */
router.delete('/:slug', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { slug } = req.params;
    const result = await query(
      `UPDATE spaces SET is_active = FALSE WHERE slug = $1 RETURNING id`,
      [slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Space not found' });
    res.json({ message: 'Space deleted' });
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

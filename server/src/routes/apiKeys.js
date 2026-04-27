/**
 * Headless Member API — API key management + public endpoints
 *
 * API Keys allow external apps to query community members.
 * Keys are SHA-256 hashed in the DB; only the prefix is shown after creation.
 */

const { Router } = require('express');
const crypto     = require('crypto');
const { authenticate, requireRole } = require('../middleware/auth');
const { query } = require('../config/database');

const router = Router();

// ── Key management (admin) ────────────────────────────────────────────────────

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * GET /api/api-keys — List all API keys (admin)
 */
router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, key_prefix, scopes, last_used_at, request_count, is_active, created_at, expires_at
       FROM api_keys WHERE owner_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ keys: result.rows });
  } catch (err) { next(err); }
});

/**
 * POST /api/api-keys — Create a new API key (admin)
 * Returns the full key ONCE — it is never stored in plain text.
 */
router.post('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, scopes, expiresAt } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    const rawKey    = 'pw_' + crypto.randomBytes(24).toString('hex');
    const keyHash   = hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 10);

    const result = await query(
      `INSERT INTO api_keys (name, key_hash, key_prefix, owner_id, scopes, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, key_prefix, scopes, created_at`,
      [name, keyHash, keyPrefix, req.user.id, scopes || ['members:read'], expiresAt || null]
    );

    // Return the full key this one time
    res.status(201).json({ key: result.rows[0], rawKey });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/api-keys/:id — Revoke key
 */
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await query(`DELETE FROM api_keys WHERE id = $1 AND owner_id = $2`, [req.params.id, req.user.id]);
    res.json({ revoked: true });
  } catch (err) { next(err); }
});

// ── Headless Member API (external, uses API key auth) ─────────────────────────

async function apiKeyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer pw_')) {
    return res.status(401).json({ error: 'API key required. Use: Authorization: Bearer pw_...' });
  }
  const rawKey = authHeader.slice(7);
  const keyHash = hashKey(rawKey);

  const result = await query(
    `SELECT * FROM api_keys WHERE key_hash = $1 AND is_active = TRUE
       AND (expires_at IS NULL OR expires_at > NOW())`,
    [keyHash]
  );
  if (!result.rows.length) {
    return res.status(401).json({ error: 'Invalid or expired API key' });
  }

  // Track usage
  query(`UPDATE api_keys SET last_used_at = NOW(), request_count = request_count + 1 WHERE id = $1`,
    [result.rows[0].id]).catch(() => {});

  req.apiKey = result.rows[0];
  next();
}

/**
 * GET /api/headless/members — Public member list (API key auth)
 */
router.get('/headless/members', apiKeyAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, role, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = ["account_status = 'active'"];

    if (role) { params.push(role); conditions.push(`role = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`display_name ILIKE $${params.length}`); }
    params.push(parseInt(limit), offset);

    const result = await query(
      `SELECT id, display_name, avatar_url, role, subscription_tier, total_points, created_at
       FROM users WHERE ${conditions.join(' AND ')}
       ORDER BY total_points DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ members: result.rows, page: parseInt(page) });
  } catch (err) { next(err); }
});

/**
 * GET /api/headless/members/:id — Single member (API key auth)
 */
router.get('/headless/members/:id', apiKeyAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.display_name, u.avatar_url, u.role, u.subscription_tier, u.total_points, u.created_at,
              pp.headline, pp.bio, pp.specialisation, pp.availability, pp.location
       FROM users u
       LEFT JOIN producer_profiles pp ON pp.user_id = u.id
       WHERE u.id = $1 AND u.account_status = 'active'`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Member not found' });
    res.json({ member: result.rows[0] });
  } catch (err) { next(err); }
});

/**
 * GET /api/headless/leaderboard — Top members (API key auth)
 */
router.get('/headless/leaderboard', apiKeyAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, display_name, avatar_url, role, subscription_tier, total_points
       FROM users WHERE account_status = 'active'
       ORDER BY total_points DESC LIMIT 20`
    );
    res.json({ leaderboard: result.rows });
  } catch (err) { next(err); }
});

/**
 * GET /api/headless/stats — Snapshot of community health for Miguel/PodwiresBot.
 * Returns members + posts counters + recent signup names so the bot can
 * generate digests and re-engagement campaigns without admin JWT.
 */
router.get('/headless/stats', apiKeyAuth, async (req, res, next) => {
  try {
    const [members, posts, recentSignups] = await Promise.all([
      query(`
        SELECT
          COUNT(*)                                                     AS total,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_30d,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')  AS new_7d,
          COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '7 days') AS active_7d,
          COUNT(*) FILTER (WHERE subscription_tier = 'pro')            AS pro_count,
          COUNT(*) FILTER (WHERE subscription_tier = 'vip')            AS vip_count
        FROM users WHERE account_status = 'active'
      `),
      query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS new_7d,
          COALESCE(SUM(like_count), 0)    AS total_likes,
          COALESCE(SUM(comment_count), 0) AS total_comments
        FROM posts
        WHERE status = 'published'
      `),
      query(`
        SELECT id, display_name, role, created_at
        FROM users
        WHERE account_status = 'active' AND created_at >= NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC LIMIT 10
      `),
    ]);
    res.json({
      members: members.rows[0],
      posts: posts.rows[0],
      recentSignups: recentSignups.rows,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/headless/inactive-members?days=14 — Members who haven't logged in
 * for N+ days. Used by Miguel for re-engagement campaigns.
 *
 * Note: deliberately not /members/inactive because /members/:id is declared
 * earlier and matches "inactive" as a UUID param.
 */
router.get('/headless/inactive-members', apiKeyAuth, async (req, res, next) => {
  try {
    const days = Math.max(1, Math.min(365, parseInt(req.query.days, 10) || 14));
    const limit = Math.max(1, Math.min(200, parseInt(req.query.limit, 10) || 50));
    const result = await query(
      `SELECT id, display_name, email, role, subscription_tier, last_login_at, created_at
       FROM users
       WHERE account_status = 'active'
         AND (last_login_at IS NULL OR last_login_at < NOW() - INTERVAL '${days} days')
         AND created_at < NOW() - INTERVAL '${days} days'
       ORDER BY last_login_at ASC NULLS FIRST
       LIMIT $1`,
      [limit]
    );
    res.json({ days, count: result.rows.length, members: result.rows });
  } catch (err) { next(err); }
});

/**
 * GET /api/headless/posts/recent?limit=20 — Recent published posts across
 * all spaces. Source material for Miguel's weekly digest.
 */
router.get('/headless/posts/recent', apiKeyAuth, async (req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const result = await query(
      `SELECT p.id, p.title, p.body, p.like_count, p.comment_count, p.created_at,
              p.space_id, s.name AS space_name, s.slug AS space_slug,
              u.id AS author_id, u.display_name AS author_name
       FROM posts p
       LEFT JOIN spaces s ON s.id = p.space_id
       LEFT JOIN users u ON u.id = p.author_id
       WHERE p.status = 'published'
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json({ count: result.rows.length, posts: result.rows });
  } catch (err) { next(err); }
});

/**
 * POST /api/headless/posts — Let Miguel publish a discussion thread to a
 * space. Body: { space_slug, title, body, post_type? } — author defaults
 * to the API-key's owner_id (the system bot user).
 */
router.post('/headless/posts', apiKeyAuth, async (req, res, next) => {
  try {
    const { space_slug, title, body, post_type = 'discussion' } = req.body || {};
    if (!space_slug || !title || !body) {
      return res.status(400).json({ error: 'space_slug, title and body are required' });
    }
    if (!req.apiKey?.owner_id) {
      return res.status(403).json({ error: 'API key has no owner_id — set one in api_keys row' });
    }

    const space = await query('SELECT id FROM spaces WHERE slug = $1', [space_slug]);
    if (!space.rows.length) return res.status(404).json({ error: `Space ${space_slug} not found` });

    const result = await query(
      `INSERT INTO posts (space_id, author_id, title, body, post_type, status, published_at)
       VALUES ($1, $2, $3, $4, $5, 'published', NOW())
       RETURNING id, space_id, author_id, title, status, created_at`,
      [space.rows[0].id, req.apiKey.owner_id, title, body, post_type]
    );
    res.status(201).json({ post: result.rows[0] });
  } catch (err) { next(err); }
});

/**
 * GET /api/headless/audience?segment=all|inactive|pro|active — Email list
 * for Mae's newsletter sends. Email is included; this is intentionally
 * api-key-gated. Honor users' notifications.email preference if set.
 *
 *   segment=all      → every active member
 *   segment=active   → logged in within 30d
 *   segment=inactive → never logged in OR last_login_at older than 30d
 *   segment=pro      → pro + vip subscribers
 */
router.get('/headless/audience', apiKeyAuth, async (req, res, next) => {
  try {
    const segment = (req.query.segment || 'all').toString().toLowerCase();
    const limit = Math.max(1, Math.min(2000, parseInt(req.query.limit, 10) || 1000));

    let where = "account_status = 'active' AND email IS NOT NULL";
    if (segment === 'active')   where += " AND last_login_at >= NOW() - INTERVAL '30 days'";
    if (segment === 'inactive') where += " AND (last_login_at IS NULL OR last_login_at < NOW() - INTERVAL '30 days')";
    if (segment === 'pro')      where += " AND subscription_tier IN ('pro','vip')";

    const result = await query(
      `SELECT id, email, display_name, role, subscription_tier
       FROM users WHERE ${where}
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit]
    );
    res.json({
      segment, count: result.rows.length, members: result.rows,
    });
  } catch (err) { next(err); }
});

module.exports = router;

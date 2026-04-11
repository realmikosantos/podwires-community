const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { query } = require('../config/database');

const router = Router();

/**
 * POST /api/posts — Create a post in a space
 */
router.post(
  '/',
  authenticate,
  [
    body('spaceId').isUUID().withMessage('Valid space ID required'),
    body('body').trim().notEmpty().withMessage('Post body required'),
    body('title').optional().trim().isLength({ max: 300 }),
    body('postType').optional().isIn(['discussion', 'question', 'announcement', 'showcase', 'resource']),
    validate,
  ],
  async (req, res, next) => {
    try {
      const { spaceId, title, body: postBody, postType } = req.body;

      // Verify space exists and user has access
      const spaceResult = await query('SELECT id FROM spaces WHERE id = $1', [spaceId]);
      if (spaceResult.rows.length === 0) {
        return res.status(404).json({ error: 'Space not found' });
      }

      const result = await query(
        `INSERT INTO posts (space_id, author_id, title, body, post_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [spaceId, req.user.id, title, postBody, postType || 'discussion']
      );

      // Increment post count
      await query('UPDATE spaces SET post_count = post_count + 1 WHERE id = $1', [spaceId]);

      res.status(201).json({ post: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/posts/:id — Get single post with comments
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const postResult = await query(
      `SELECT p.*, u.display_name AS author_name, u.avatar_url AS author_avatar
       FROM posts p JOIN users u ON u.id = p.author_id
       WHERE p.id = $1`,
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const commentsResult = await query(
      `SELECT c.*, u.display_name AS author_name, u.avatar_url AS author_avatar
       FROM comments c JOIN users u ON u.id = c.author_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    res.json({ post: postResult.rows[0], comments: commentsResult.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/posts/:id/comments — Add a comment
 */
router.post(
  '/:id/comments',
  authenticate,
  [
    body('body').trim().notEmpty().withMessage('Comment body required'),
    body('parentId').optional().isUUID(),
    validate,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { body: commentBody, parentId } = req.body;

      const result = await query(
        `INSERT INTO comments (post_id, author_id, parent_id, body)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [id, req.user.id, parentId || null, commentBody]
      );

      await query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1', [id]);

      res.status(201).json({ comment: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/posts/:id/pin — Toggle pin (admin only)
 */
router.patch('/:id/pin', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const { id } = req.params;
    const existing = await query('SELECT is_pinned FROM posts WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    const newValue = !existing.rows[0].is_pinned;
    await query('UPDATE posts SET is_pinned = $1 WHERE id = $2', [newValue, id]);
    res.json({ isPinned: newValue });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/posts/:id/like — Toggle like on a post
 */
router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await query(
      'SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2',
      [req.user.id, id]
    );

    if (existing.rows.length > 0) {
      await query('DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2', [req.user.id, id]);
      await query('UPDATE posts SET like_count = like_count - 1 WHERE id = $1', [id]);
      return res.json({ liked: false });
    }

    await query('INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)', [req.user.id, id]);
    await query('UPDATE posts SET like_count = like_count + 1 WHERE id = $1', [id]);
    res.json({ liked: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

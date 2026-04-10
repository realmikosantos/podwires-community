const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');

const router = Router();

/**
 * GET /api/notifications — Get user notifications
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const result = await query(
      `SELECT id, type, title, body, data, read_at, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit, 10), offset]
    );

    res.json({ notifications: result.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications/count — Get unread notification count
 */
router.get('/count', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL',
      [req.user.id]
    );

    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/:id/read — Mark single notification as read
 */
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await query(
      'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 AND read_at IS NULL',
      [req.params.id, req.user.id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/read-all — Mark all notifications as read
 */
router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await query(
      'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
      [req.user.id]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, requireRole, requireTier } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { query } = require('../config/database');

const router = Router();

/**
 * POST /api/projects — Create a project inquiry (Client → Producer)
 */
router.post(
  '/',
  authenticate,
  requireRole('client', 'admin'),
  requireTier('pro'),
  [
    body('producerId').isUUID().withMessage('Valid producer ID required'),
    body('title').trim().notEmpty().withMessage('Project title required'),
    body('description').optional().trim(),
    body('budget').optional().isFloat({ min: 0 }),
    validate,
  ],
  async (req, res, next) => {
    try {
      const { producerId, title, description, budget, currency, deadline, deliverables } = req.body;

      // Verify producer exists
      const producer = await query(
        "SELECT id FROM users WHERE id = $1 AND role = 'producer'",
        [producerId]
      );
      if (producer.rows.length === 0) {
        return res.status(404).json({ error: 'Producer not found' });
      }

      const result = await query(
        `INSERT INTO projects (title, description, client_id, producer_id, budget, currency, deadline, deliverables)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [title, description, req.user.id, producerId, budget, currency || 'USD', deadline, deliverables ? JSON.stringify(deliverables) : '[]']
      );

      // Record status history
      await query(
        `INSERT INTO project_status_history (project_id, to_status, changed_by)
         VALUES ($1, 'inquiry', $2)`,
        [result.rows[0].id, req.user.id]
      );

      res.status(201).json({ project: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/projects — List my projects
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [req.user.id];
    const conditions = ['(p.client_id = $1 OR p.producer_id = $1)'];

    if (status) {
      params.push(status);
      conditions.push(`p.status = $${params.length}`);
    }

    params.push(parseInt(limit, 10), offset);

    const result = await query(
      `SELECT p.*,
              client.display_name AS client_name, client.avatar_url AS client_avatar,
              producer.display_name AS producer_name, producer.avatar_url AS producer_avatar
       FROM projects p
       JOIN users client ON client.id = p.client_id
       JOIN users producer ON producer.id = p.producer_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.updated_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ projects: result.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:id — Get project details with messages
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const projectResult = await query(
      `SELECT p.*,
              client.display_name AS client_name,
              producer.display_name AS producer_name
       FROM projects p
       JOIN users client ON client.id = p.client_id
       JOIN users producer ON producer.id = p.producer_id
       WHERE p.id = $1 AND (p.client_id = $2 OR p.producer_id = $2)`,
      [id, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get messages
    const messagesResult = await query(
      `SELECT m.*, u.display_name AS sender_name, u.avatar_url AS sender_avatar
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.project_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    );

    // Get status history
    const historyResult = await query(
      `SELECT psh.*, u.display_name AS changed_by_name
       FROM project_status_history psh
       JOIN users u ON u.id = psh.changed_by
       WHERE psh.project_id = $1
       ORDER BY psh.created_at ASC`,
      [id]
    );

    res.json({
      project: projectResult.rows[0],
      messages: messagesResult.rows,
      statusHistory: historyResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/projects/:id/status — Update project status
 */
router.patch(
  '/:id/status',
  authenticate,
  [
    body('status')
      .isIn(['proposal', 'active', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    body('note').optional().trim(),
    validate,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, note, proposalDetails, proposalAmount } = req.body;

      const project = await query(
        'SELECT * FROM projects WHERE id = $1 AND (client_id = $2 OR producer_id = $2)',
        [id, req.user.id]
      );

      if (project.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const current = project.rows[0];

      // Validate status transitions
      const validTransitions = {
        inquiry: ['proposal', 'cancelled'],
        proposal: ['active', 'cancelled'],
        active: ['completed', 'cancelled'],
      };

      if (!validTransitions[current.status]?.includes(status)) {
        return res.status(400).json({
          error: `Cannot transition from ${current.status} to ${status}`,
        });
      }

      const updates = { status };
      if (status === 'active') updates.started_at = new Date();
      if (status === 'completed') updates.completed_at = new Date();
      if (status === 'cancelled') {
        updates.cancelled_at = new Date();
        updates.cancellation_reason = note;
      }
      if (proposalDetails) updates.proposal_details = proposalDetails;
      if (proposalAmount) updates.proposal_amount = proposalAmount;

      const setClauses = Object.entries(updates)
        .map(([key, _], i) => `${key} = $${i + 2}`)
        .join(', ');

      await query(
        `UPDATE projects SET ${setClauses} WHERE id = $1`,
        [id, ...Object.values(updates)]
      );

      // Record history
      await query(
        `INSERT INTO project_status_history (project_id, from_status, to_status, changed_by, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, current.status, status, req.user.id, note]
      );

      res.json({ message: `Project status updated to ${status}` });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/projects/:id/messages — Send a message in Deal Room
 */
router.post(
  '/:id/messages',
  authenticate,
  [
    body('body').trim().notEmpty().withMessage('Message body required'),
    validate,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Verify user is part of project
      const project = await query(
        'SELECT id FROM projects WHERE id = $1 AND (client_id = $2 OR producer_id = $2)',
        [id, req.user.id]
      );

      if (project.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const result = await query(
        `INSERT INTO messages (project_id, sender_id, body, message_type)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [id, req.user.id, req.body.body, req.body.messageType || 'text']
      );

      res.status(201).json({ message: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

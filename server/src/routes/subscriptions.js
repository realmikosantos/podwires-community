const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { stripe, PLANS } = require('../config/stripe');
const { query } = require('../config/database');

const router = Router();

/**
 * GET /api/subscriptions/plans — List available plans
 */
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

/**
 * POST /api/subscriptions/checkout — Create Stripe Checkout session
 */
router.post('/checkout', authenticate, async (req, res, next) => {
  try {
    const { plan } = req.body; // 'pro' or 'vip'

    if (!PLANS[plan] || plan === 'free') {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Get or create Stripe customer
    let customerId = null;
    const user = await query('SELECT stripe_customer_id, email FROM users WHERE id = $1', [req.user.id]);
    customerId = user.rows[0].stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.rows[0].email,
        metadata: { userId: req.user.id },
      });
      customerId = customer.id;
      await query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, req.user.id]);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/dashboard?subscribed=${plan}`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard?cancelled=true`,
      metadata: { userId: req.user.id, plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/subscriptions/portal — Create Stripe billing portal session
 */
router.post('/portal', authenticate, async (req, res, next) => {
  try {
    const user = await query('SELECT stripe_customer_id FROM users WHERE id = $1', [req.user.id]);

    if (!user.rows[0].stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.rows[0].stripe_customer_id,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

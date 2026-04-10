const { Router } = require('express');
const express = require('express');
const { stripe } = require('../config/stripe');
const { query } = require('../config/database');

const router = Router();

/**
 * POST /api/webhooks/stripe — Handle Stripe webhook events
 * Note: This route is mounted BEFORE json body parser in app.js
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const { userId, plan } = session.metadata;

          if (session.mode === 'subscription') {
            await query(
              `UPDATE users SET
                subscription_tier = $1,
                stripe_subscription_id = $2
              WHERE id = $3`,
              [plan, session.subscription, userId]
            );
            console.log(`User ${userId} subscribed to ${plan}`);
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          const customer = await stripe.customers.retrieve(subscription.customer);
          const userId = customer.metadata?.userId;

          if (userId && subscription.status === 'active') {
            // Determine plan from price
            const priceId = subscription.items.data[0]?.price?.id;
            let tier = 'free';
            if (priceId === process.env.STRIPE_PRICE_VIP) tier = 'vip';
            else if (priceId === process.env.STRIPE_PRICE_PRO) tier = 'pro';

            await query(
              'UPDATE users SET subscription_tier = $1, stripe_subscription_id = $2 WHERE id = $3',
              [tier, subscription.id, userId]
            );
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const customer = await stripe.customers.retrieve(subscription.customer);
          const userId = customer.metadata?.userId;

          if (userId) {
            await query(
              "UPDATE users SET subscription_tier = 'free', stripe_subscription_id = NULL WHERE id = $1",
              [userId]
            );
            console.log(`User ${userId} subscription cancelled — reverted to free`);
          }
          break;
        }

        default:
          // Unhandled event type
          break;
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Webhook handler error:', err);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }
);

module.exports = router;

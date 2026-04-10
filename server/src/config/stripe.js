const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-02-15',
});

const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['Open Community access', 'Basic profile', 'Job board viewing'],
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO,
    price: 2900, // $29/mo in cents
    features: [
      'All Free features',
      'Talent Hub access',
      'Client Lounge access',
      'Deal Room (5 active projects)',
      'Priority job alerts',
      'Portfolio showcase',
    ],
  },
  vip: {
    name: 'VIP',
    priceId: process.env.STRIPE_PRICE_VIP,
    price: 4900, // $49/mo in cents
    features: [
      'All Pro features',
      'VIP Space access',
      'Unlimited Deal Room projects',
      'Featured profile badge',
      'Direct client introductions',
      'Exclusive events & masterclasses',
    ],
  },
};

module.exports = { stripe, PLANS };

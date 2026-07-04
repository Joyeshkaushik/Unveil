/**
 * Pricing tiers and Stripe configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Stripe account at stripe.com
 * 2. Get your API keys from Dashboard > Developers > API keys
 * 3. Create products in Stripe Dashboard matching these price IDs
 * 4. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to .env
 */

const TIERS = {
  free: {
    name: 'Free',
    price: 0,
    limits: {
      scansPerHour: 20,
      videoScansPerHour: 5,
      historyDays: 7
    },
    features: [
      '20 scans per hour',
      '5 video scans per hour',
      '7-day history',
      'All detection types',
      'Browser extension'
    ]
  },
  pro: {
    name: 'Pro',
    priceMonthly: 15,
    priceYearly: 144, // $12/mo billed yearly
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
    razorpayPlanIdMonthly: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID || 'plan_pro_monthly',
    razorpayPlanIdYearly: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID || 'plan_pro_yearly',
    limits: {
      scansPerHour: 200,
      videoScansPerHour: 50,
      historyDays: 90
    },
    features: [
      '200 scans per hour',
      '50 video scans per hour',
      '90-day history',
      'PDF report export',
      'Priority support',
      'API access (coming soon)'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 'custom',
    limits: {
      scansPerHour: -1, // unlimited
      videoScansPerHour: -1,
      historyDays: 365
    },
    features: [
      'Unlimited scans',
      '1-year history',
      'Custom API limits',
      'Dedicated support',
      'SLA guarantee',
      'Team management'
    ]
  }
}

function getTierLimits(tier = 'free') {
  return TIERS[tier]?.limits || TIERS.free.limits
}

function getTierByPriceId(priceId) {
  if (
    priceId === TIERS.pro.stripePriceIdMonthly ||
    priceId === TIERS.pro.stripePriceIdYearly ||
    priceId === TIERS.pro.razorpayPlanIdMonthly ||
    priceId === TIERS.pro.razorpayPlanIdYearly
  ) {
    return 'pro'
  }
  return 'free'
}

module.exports = {
  TIERS,
  getTierLimits,
  getTierByPriceId
}

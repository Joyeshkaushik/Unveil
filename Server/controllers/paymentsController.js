const pool = require('../Config/db')
const { TIERS } = require('../Config/pricing')
const { invalidateUserTierCache } = require('../Config/redis')

const Razorpay = require('razorpay')
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null

// ─────────────────────────────────────────
// CREATE CHECKOUT
// ─────────────────────────────────────────
const createCheckout = async (req, res) => {
  try {
    const { priceId } = req.body
    const userId = req.user.id

    if (!priceId) {
      return res.status(400).json({ error: 'Plan/Price ID is required' })
    }

    // Check existing subscription
    const result = await pool.query(
      'SELECT subscription_status FROM users WHERE id = $1',
      [userId]
    )
    const profile = result.rows[0]

    if (profile?.subscription_status === 'active') {
      return res.status(400).json({ error: 'You already have an active subscription' })
    }

    // Mock mode if Razorpay not configured
    if (!razorpay) {
      console.log('Razorpay not configured — using sandbox mode')
      return res.json({
        keyId: 'rzp_test_mock_sandbox',
        subscriptionId: 'sub_mock_' + Math.random().toString(36).substring(2, 15),
        isMock: true
      })
    }

    // Real Razorpay
    const planId = priceId === TIERS.pro.stripePriceIdYearly
      ? TIERS.pro.razorpayPlanIdYearly
      : TIERS.pro.razorpayPlanIdMonthly

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,
      notes: { userId }
    })

    res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      subscriptionId: subscription.id,
      isMock: false
    })
  } catch (err) {
    console.error('Razorpay checkout error:', err.message)
    res.status(500).json({ error: 'Failed to initiate payment session' })
  }
}

// ─────────────────────────────────────────
// VERIFY PAYMENT
// ─────────────────────────────────────────
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body
    const userId = req.user.id

    if (!razorpay_subscription_id) {
      return res.status(400).json({ error: 'Subscription ID is required' })
    }

    // Mock sandbox verification
    if (razorpay_subscription_id.startsWith('sub_mock_')) {
      await pool.query(
        `UPDATE users SET
          subscription_status = 'active',
          subscription_tier = 'pro',
          stripe_subscription_id = $1,
          subscription_ends_at = $2,
          updated_at = NOW()
         WHERE id = $3`,
        [razorpay_subscription_id,
         new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
         userId]
      )
      await invalidateUserTierCache(userId)
      return res.json({ success: true, message: 'Mock payment verified!' })
    }

    // Real Razorpay signature verification
    if (!razorpay) {
      return res.status(503).json({ error: 'Payment keys missing on server.' })
    }

    if (!razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Signature parameters missing' })
    }

    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_payment_id + '|' + razorpay_subscription_id)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment signature verification failed' })
    }

    await pool.query(
      `UPDATE users SET
        subscription_status = 'active',
        subscription_tier = 'pro',
        stripe_subscription_id = $1,
        subscription_ends_at = $2,
        updated_at = NOW()
       WHERE id = $3`,
      [razorpay_subscription_id,
       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
       userId]
    )
    await invalidateUserTierCache(userId)

    res.json({ success: true, message: 'Payment verified and subscription activated!' })
  } catch (err) {
    console.error('Razorpay verification error:', err.message)
    res.status(500).json({ error: 'Verification failed' })
  }
}

// ─────────────────────────────────────────
// CANCEL SUBSCRIPTION
// ─────────────────────────────────────────
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      'SELECT stripe_subscription_id FROM users WHERE id = $1',
      [userId]
    )
    const subscriptionId = result.rows[0]?.stripe_subscription_id

    if (!subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' })
    }

    // Cancel on Razorpay if real subscription
    if (razorpay && !subscriptionId.startsWith('sub_mock_')) {
      try {
        await razorpay.subscriptions.cancel(subscriptionId)
      } catch (rzpErr) {
        console.error('Razorpay cancel warning:', rzpErr.message)
      }
    }

    await pool.query(
      `UPDATE users SET
        subscription_status = 'cancelled',
        subscription_tier = 'free',
        subscription_ends_at = NULL,
        updated_at = NOW()
       WHERE id = $1`,
      [userId]
    )
    await invalidateUserTierCache(userId)

    res.json({ success: true, message: 'Subscription successfully cancelled.' })
  } catch (err) {
    console.error('Cancel subscription error:', err.message)
    res.status(500).json({ error: 'Failed to cancel subscription' })
  }
}

// ─────────────────────────────────────────
// GET SUBSCRIPTION
// ─────────────────────────────────────────
const getSubscription = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT subscription_status, subscription_tier, subscription_ends_at
       FROM users WHERE id = $1`,
      [req.user.id]
    )
    const profile = result.rows[0]
    const tier = profile?.subscription_tier || 'free'

    res.json({
      status: profile?.subscription_status || 'free',
      tier,
      endsAt: profile?.subscription_ends_at,
      limits: TIERS[tier]?.limits || TIERS.free.limits
    })
  } catch (err) {
    console.error('Subscription fetch error:', err.message)
    res.status(500).json({ error: 'Failed to fetch subscription' })
  }
}

module.exports = { createCheckout, verifyPayment, cancelSubscription, getSubscription }
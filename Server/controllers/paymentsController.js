const supabase = require('../Config/supabase')
const { TIERS } = require('../Config/pricing')

// Initialize Razorpay only if key is configured
const Razorpay = require('razorpay')
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null

/**
 * Initiate Razorpay subscription (or Mock fallback)
 */
const createCheckout = async (req, res) => {
  try {
    const { priceId } = req.body
    const userId = req.user.id

    if (!priceId) {
      return res.status(400).json({ error: 'Plan/Price ID is required' })
    }

    // Check if user already has an active subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', userId)
      .single()

    if (profile?.subscription_status === 'active') {
      return res.status(400).json({ error: 'You already have an active subscription' })
    }

    // 1. Sandbox/Mock Checkout Mode (if API key is missing)
    if (!razorpay) {
      console.log('Razorpay keys not configured. Falling back to Sandbox Mode.')
      return res.json({
        keyId: 'rzp_test_mock_sandbox',
        subscriptionId: 'sub_mock_' + Math.random().toString(36).substring(2, 15),
        isMock: true
      })
    }

    // 2. Real Razorpay Mode
    // Map pricing ID to Razorpay Plan ID
    const planId = priceId === TIERS.pro.stripePriceIdYearly 
      ? TIERS.pro.razorpayPlanIdYearly 
      : TIERS.pro.razorpayPlanIdMonthly

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12, // default 12 billing cycles
      notes: {
        userId: userId
      }
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

/**
 * Verify Razorpay Subscription Payment signature
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body
    const userId = req.user.id

    if (!razorpay_subscription_id) {
      return res.status(400).json({ error: 'Subscription ID is required' })
    }

    // 1. Mock Sandbox Verification
    if (razorpay_subscription_id.startsWith('sub_mock_')) {
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_tier: 'pro',
          stripe_subscription_id: razorpay_subscription_id, // reuse subscription id column
          subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', userId)

      return res.json({ success: true, message: 'Mock payment verified successfully!' })
    }

    // 2. Real Razorpay Verification
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

    // Update profile
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_tier: 'pro',
        stripe_subscription_id: razorpay_subscription_id,
        subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', userId)

    res.json({ success: true, message: 'Payment verified and subscription activated!' })
  } catch (err) {
    console.error('Razorpay signature verification error:', err.message)
    res.status(500).json({ error: 'Verification failed' })
  }
}

/**
 * Cancel active subscription
 */
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', userId)
      .single()

    const subscriptionId = profile?.stripe_subscription_id

    if (!subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' })
    }

    // Call Razorpay API to cancel if real, otherwise skip
    if (razorpay && !subscriptionId.startsWith('sub_mock_')) {
      try {
        await razorpay.subscriptions.cancel(subscriptionId)
      } catch (rzpErr) {
        console.error('Razorpay API cancel warning:', rzpErr.message)
      }
    }

    // Cancel in profiles table
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'cancelled',
        subscription_tier: 'free',
        subscription_ends_at: null
      })
      .eq('id', userId)

    res.json({ success: true, message: 'Subscription successfully cancelled.' })
  } catch (err) {
    console.error('Subscription cancellation error:', err.message)
    res.status(500).json({ error: 'Failed to cancel subscription' })
  }
}

/**
 * Get active subscription details and limits
 */
const getSubscription = async (req, res) => {
  try {
    const userId = req.user.id

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_tier, subscription_ends_at')
      .eq('id', userId)
      .single()

    const tier = profile?.subscription_tier || 'free'

    res.json({
      status: profile?.subscription_status || 'free',
      tier: tier,
      endsAt: profile?.subscription_ends_at,
      limits: TIERS[tier]?.limits || TIERS.free.limits
    })
  } catch (err) {
    console.error('Subscription fetch error:', err.message)
    res.status(500).json({ error: 'Failed to fetch subscription' })
  }
}

module.exports = {
  createCheckout,
  verifyPayment,
  cancelSubscription,
  getSubscription
}

const pool = require('../Config/db')
const { TIERS, getTierByPriceId } = require('../Config/pricing')
const { invalidateUserTierCache } = require('../Config/redis')

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://unveil-drab-chi.vercel.app'

const requireStripe = (res) => {
  if (!stripe) {
    res.status(503).json({ error: 'Payments not configured. Add STRIPE_SECRET_KEY to enable.' })
    return false
  }
  return true
}

// ─────────────────────────────────────────
// CREATE CHECKOUT SESSION
// ─────────────────────────────────────────
const createCheckout = async (req, res) => {
  if (!requireStripe(res)) return

  try {
    const { priceId } = req.body
    const userId = req.user.id
    const userEmail = req.user.email

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' })
    }

    // Check existing subscription
    const result = await pool.query(
      'SELECT stripe_customer_id, subscription_status FROM users WHERE id = $1',
      [userId]
    )
    const profile = result.rows[0]

    if (profile?.subscription_status === 'active') {
      return res.status(400).json({ error: 'You already have an active subscription' })
    }

    // Create or reuse Stripe customer
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId }
      })
      customerId = customer.id

      // Save Stripe customer ID to DB
      await pool.query(
        'UPDATE users SET stripe_customer_id = $1, updated_at = NOW() WHERE id = $2',
        [customerId, userId]
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${FRONTEND_URL}/dashboard?checkout=success`,
      cancel_url: `${FRONTEND_URL}/pricing?checkout=cancelled`,
      metadata: { userId },
      subscription_data: { metadata: { userId } }
    })

    res.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('Checkout error:', err.message)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
}

// ─────────────────────────────────────────
// CREATE CUSTOMER PORTAL
// ─────────────────────────────────────────
const createPortal = async (req, res) => {
  if (!requireStripe(res)) return

  try {
    const result = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.user.id]
    )
    const profile = result.rows[0]

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: 'No subscription found' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${FRONTEND_URL}/dashboard`
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Portal error:', err.message)
    res.status(500).json({ error: 'Failed to create portal session' })
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

    res.json({
      status: profile?.subscription_status || 'free',
      tier: profile?.subscription_tier || 'free',
      endsAt: profile?.subscription_ends_at,
      limits: TIERS[profile?.subscription_tier || 'free']?.limits || TIERS.free.limits
    })
  } catch (err) {
    console.error('Subscription fetch error:', err.message)
    res.status(500).json({ error: 'Failed to fetch subscription' })
  }
}

// ─────────────────────────────────────────
// STRIPE WEBHOOK
// ─────────────────────────────────────────
const handleWebhook = async (req, res) => {
  if (!requireStripe(res)) return

  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature failed:', err.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  console.log('Stripe webhook:', event.type)

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata.userId
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        const tier = getTierByPriceId(subscription.items.data[0].price.id)

        await pool.query(
          `UPDATE users SET
            subscription_status = 'active',
            subscription_tier = $1,
            stripe_subscription_id = $2,
            subscription_ends_at = $3,
            updated_at = NOW()
           WHERE id = $4`,
          [tier, session.subscription,
           new Date(subscription.current_period_end * 1000),
           userId]
        )
        await invalidateUserTierCache(userId)
        console.log(`User ${userId} subscribed to ${tier}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const userId = subscription.metadata.userId
        if (!userId) break

        const tier = getTierByPriceId(subscription.items.data[0].price.id)

        await pool.query(
          `UPDATE users SET
            subscription_status = $1,
            subscription_tier = $2,
            subscription_ends_at = $3,
            updated_at = NOW()
           WHERE id = $4`,
          [subscription.status,
           subscription.status === 'active' ? tier : 'free',
           new Date(subscription.current_period_end * 1000),
           userId]
        )
        await invalidateUserTierCache(userId)
        console.log(`User ${userId} subscription updated: ${subscription.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata.userId
        if (!userId) break

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
        console.log(`User ${userId} subscription cancelled`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const result = await pool.query(
          'SELECT id, email FROM users WHERE stripe_customer_id = $1',
          [invoice.customer]
        )
        if (result.rows.length > 0) {
          console.log(`Payment failed for user ${result.rows[0].id}`)
          // TODO: Send email notification
        }
        break
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook processing error:', err.message)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}

module.exports = { createCheckout, createPortal, getSubscription, handleWebhook }
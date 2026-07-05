const supabase = require('../Config/supabase')
const { TIERS, getTierByPriceId } = require('../Config/pricing')

// Initialize Stripe only if API key is provided
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://unveil-drab-chi.vercel.app'

// Helper to check if Stripe is configured
const requireStripe = (res) => {
  if (!stripe) {
    res.status(503).json({ error: 'Payments not configured. Add STRIPE_SECRET_KEY to enable.' })
    return false
  }
  return true
}

/**
 * Create a Stripe Checkout session for subscription
 */
const createCheckout = async (req, res) => {
  if (!requireStripe(res)) return

  try {
    const { priceId, interval = 'monthly' } = req.body
    const userId = req.user.id
    const userEmail = req.user.email

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' })
    }

    // Check if user already has an active subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_status')
      .eq('id', userId)
      .single()

    if (profile?.subscription_status === 'active') {
      return res.status(400).json({ error: 'You already have an active subscription' })
    }

    // Create or retrieve Stripe customer
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId }
      })
      customerId = customer.id

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      success_url: `${FRONTEND_URL}/dashboard?checkout=success`,
      cancel_url: `${FRONTEND_URL}/pricing?checkout=cancelled`,
      metadata: { userId },
      subscription_data: {
        metadata: { userId }
      }
    })

    res.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('Checkout error:', err.message)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
}

/**
 * Create a Stripe Customer Portal session for managing subscription
 */
const createPortal = async (req, res) => {
  if (!requireStripe(res)) return

  try {
    const userId = req.user.id

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

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

/**
 * Get current subscription status
 */
const getSubscription = async (req, res) => {
  try {
    const userId = req.user.id

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_tier, subscription_ends_at')
      .eq('id', userId)
      .single()

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

/**
 * Stripe webhook handler
 * Handles subscription lifecycle events
 */
const handleWebhook = async (req, res) => {
  if (!requireStripe(res)) return

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  console.log('Stripe webhook:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata.userId
        const subscriptionId = session.subscription

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0].price.id
        const tier = getTierByPriceId(priceId)

        // Update user profile
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_tier: tier,
            stripe_subscription_id: subscriptionId,
            subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('id', userId)

        console.log(`User ${userId} subscribed to ${tier}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const userId = subscription.metadata.userId

        if (!userId) break

        const priceId = subscription.items.data[0].price.id
        const tier = getTierByPriceId(priceId)

        await supabase
          .from('profiles')
          .update({
            subscription_status: subscription.status,
            subscription_tier: subscription.status === 'active' ? tier : 'free',
            subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('id', userId)

        console.log(`User ${userId} subscription updated: ${subscription.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata.userId

        if (!userId) break

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            subscription_tier: 'free',
            subscription_ends_at: null
          })
          .eq('id', userId)

        console.log(`User ${userId} subscription cancelled`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer

        // Find user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          console.log(`Payment failed for user ${profile.id}`)
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

module.exports = {
  createCheckout,
  createPortal,
  getSubscription,
  handleWebhook
}

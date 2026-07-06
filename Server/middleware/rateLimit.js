const rateLimit = require('express-rate-limit')
const supabase = require('../Config/supabase')
const { getTierLimits } = require('../Config/pricing')

// Cache for user subscription status (5 min TTL)
const subscriptionCache = new Map()
const CACHE_TTL = 5 * 60 * 1000

async function getUserTier(userId) {
  if (!userId) return 'free'

  // Check cache first
  const cached = subscriptionCache.get(userId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.tier
  }

  try {
    const { data } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', userId)
      .single()

    const tier = data?.subscription_status === 'active' ? (data.subscription_tier || 'free') : 'free'

    // Update cache
    subscriptionCache.set(userId, { tier, timestamp: Date.now() })

    return tier
  } catch (err) {
    console.log('Error fetching user tier:', err.message)
    return 'free'
  }
}

// Global rate limit - prevents DDoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 min per IP
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Detection endpoints - tier-based limits (keyed by user ID only)
const detectLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: async (req) => {
    const tier = await getUserTier(req.user?.id)
    const limits = getTierLimits(tier)
    return limits.scansPerHour === -1 ? 10000 : limits.scansPerHour
  },
  message: { error: 'Scan limit reached. Upgrade to Pro for more scans.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || 'anonymous',
})

// Video detection - extra strict (expensive to process)
const videoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: async (req) => {
    const tier = await getUserTier(req.user?.id)
    const limits = getTierLimits(tier)
    return limits.videoScansPerHour === -1 ? 1000 : limits.videoScansPerHour
  },
  message: { error: 'Video scan limit reached. Upgrade to Pro for more scans.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || 'anonymous',
})

// Auth endpoints - prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 min
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = {
  globalLimiter,
  detectLimiter,
  videoLimiter,
  authLimiter,
  getUserTier
}

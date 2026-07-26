const rateLimit = require('express-rate-limit')
const supabase = require('../Config/supabase')
const { getTierLimits } = require('../Config/pricing')
const {redis}=require('../Config/redis')
const {RedisStore}=require('rate-limit-redis')

async function getUserTier(userId) {
  if (!userId) return 'free'

  const cacheKey=`user_tier:${userId}`
  try{
     // step:1 Check  Redis cache first
     const cached=await redis.get(cacheKey)
     if(cached){
       console.log(`Cache HIT for user ${userId}`)
       return cached  //Redis returns string directly
     }
     console.log(`Cache MISS for user ${userId} -hitting DB`)

     const { data } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', userId)
      .single()
       const tier = data?.subscription_status === 'active' ? (data.subscription_tier || 'free') : 'free'

    // Store in redis with 5 minute ttl
    await redis.set(cacheKey,tier,'EX',300)
    return tier

  }
  catch(err){
    console.log('Cache/DB error:',err.message)
    return 'free'  //Safe fallback if any error comes
  }
}
function createRedisStore(prefix){
  const client=redis.getRawClient()
  if(!client) return undefined
  return new RedisStore({
    sendCommand:(...args)=>client.call(...args),
    prefix:`rl:${prefix}`,
  })
}
// Global rate limit - prevents DDoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 min per IP
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  store:createRedisStore('global'),
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
  store:createRedisStore('detect')
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
  store:createRedisStore('video'),
})

// Auth endpoints - prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 min
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  store:createRedisStore('auth'), 
})

module.exports = {
  globalLimiter,
  detectLimiter,
  videoLimiter,
  authLimiter,
  getUserTier
}

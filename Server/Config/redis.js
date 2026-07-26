const Redis = require('ioredis')
require('dotenv').config()

let redisAvailable = false

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 2) {
      redisAvailable = false
      return null
    }
    return Math.min(times * 200, 1000)
  },
  lazyConnect: true,
 
})
redis.on('connect', () => {
  redisAvailable = true
  console.log('Redis Connected')
})

redis.on('error', (err) => {
  redisAvailable = false
  console.log('Redis error:', err.message)
})
const originalGet = redis.get.bind(redis)
const originalSet = redis.set.bind(redis)
const originalDel = redis.del.bind(redis)

redis.get = async (key) => {
  if (!redisAvailable) return null
  try { return await originalGet(key) }
  catch { return null }
}

redis.set = async (key, value, ...args) => {
  if (!redisAvailable) return
  try { await originalSet(key, value, ...args) }
  catch { /* silent fail */ }
}

redis.del = async (key) => {
  if (!redisAvailable) return
  try { await originalDel(key) }
  catch { /* silent fail */ }
}
redis.getRawClient = () => redis
// Call this when user upgrades/downgrades subscription
async function invalidateUserTierCache(userId) {
  try {
    await redis.del(`user_tier:${userId}`)
    console.log(`Tier cache cleared for user ${userId}`)
  } catch (err) {
    console.log('Cache invalidation error:', err.message)
  }
}
module.exports = { redis, invalidateUserTierCache }
const Redis=require('ioredis');
require('dotenv').config()

const redis=new Redis(process.env.REDIS_URL,{
    maxRetriesPerRequest:3,
    retryStrategy(times){
        if(times>3) return null;
        return Math.min(times*100,3000)
    },
    lazyConnect:true,
})
redis.on('connect',()=>{
    console.log('Redis Connected')
})
redis.on('error',(err)=>{
    console.log('Redis error:',err.message)
})
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
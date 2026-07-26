const Redis=require('ioredis');
requuire('dotenv').config()

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
module.exports=redis
const {Pool}=require('pg')
require('dotenv').config()
const pool=new Pool({
    connectionString:process.env.DATABASE_URL,
    ssl:{
        rejectUnauthorized:false
    },
    max:10,
    idleTimeoutMillis:100000,
    connectionTimeoutMillis:10000
})
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected!')
})

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message)
})
module.exports=pool;
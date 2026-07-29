const express = require('express')
const cors = require('cors')
require('dotenv').config()
const {redis}=require('./Config/redis')
const pool=require('./Config/db')

const authRoutes = require('./routes/authRoutes')
const detectRoutes = require('./routes/detectRoutes')
const stripeRoutes = require('./routes/stripe')
const paymentsRoutes = require('./routes/payments')
const { globalLimiter } = require('./middleware/rateLimit')

const app = express()
redis.ping().then(() => {
  console.log('✅ Redis connected!')
}).catch((err) => {
  console.log('⚠️ Redis not available:', err.message)
  console.log('Falling back to no caching')
})

// Trust proxy headers for accurate rate limiting
app.set('trust proxy', 1)

// Stripe webhook needs raw body - must come before other middleware
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))

// Security middleware
app.use(cors())
app.use(globalLimiter) // Apply global rate limit to all routes
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/detect', detectRoutes)
app.use('/api/stripe', stripeRoutes)
app.use('/api/payments', paymentsRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Unveil API is running 🚀' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
})



// Add this temporarily after app is created

pool.query('SELECT NOW()').then(() => {
  console.log('✅ PostgreSQL connected!')
}).catch(err => {
  console.log('❌ PostgreSQL error:', err.message)
})
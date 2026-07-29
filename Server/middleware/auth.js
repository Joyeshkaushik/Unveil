const jwt = require('jsonwebtoken')
const supabase = require('../Config/supabase')
const pool=require('../Config/db')

const authMiddleware = async (req, res, next) => {
  // 1. Check for API key in headers first
  const apiKey = req.headers['x-api-key']
  if (apiKey) {
    try {
      const result = await pool.query(
        `SELECT id, email, subscription_tier
         FROM users
         WHERE api_key = $1`,
        [apiKey]
      )

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid API Key' })
      }

      req.user = result.rows[0]
      return next()
    } catch (dbErr) {
      console.error('API key auth database error:', dbErr.message)
      return res.status(500).json({ error: 'Authentication service error' })
    }
  }

  // 2. Fall back to standard JWT token
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token or API Key provided' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = authMiddleware
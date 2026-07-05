const jwt = require('jsonwebtoken')
const supabase = require('../Config/supabase')

const authMiddleware = async (req, res, next) => {
  // 1. Check for API key in headers first
  const apiKey = req.headers['x-api-key']
  if (apiKey) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, subscription_tier')
        .eq('api_key', apiKey)
        .single()

      if (error || !profile) {
        return res.status(401).json({ error: 'Invalid API Key' })
      }

      req.user = {
        id: profile.id,
        email: profile.email,
        subscription_tier: profile.subscription_tier
      }
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

const pool=require('../Config/db')
const bycrypt=require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto=require('crypto')

const signup = async (req, res) => {
  const { name, email, password } = req.body
  if(!name||!email||!password){
    returnres.status(400).json({error:'Name,email and password are required'})

  }
    if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }
  try {
     const existing =await pool.query(
      'SELECT id FROM users WHERE email=$1',
      [email.toLowerCase().trim()]
     )
     if(existing.rows.length>0){
      
        return res.status(400).json({ error: 'Email already registered' })
     }
      //Hashing the password 
      const hashedPassword = await bycrypt.hash(password, 10)
       const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, subscription_tier, created_at`,
      [name.trim(), email.toLowerCase().trim(), hashedPassword]
    )
     const user = result.rows[0]
    const token = jwt.sign(
      { id: user.id, email:user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.id, name, email } })
  } catch (err) {
    console.error('Signup error:',err.message)
    res.status(500).json({ error: 'Server error' })
  }
}

const login = async (req, res) => {
  const { email, password } = req.body
    if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  try {
    // Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' })
    }

    const user = result.rows[0]
     // Compare password with hash
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' })
    }

   
    

      

    const token = jwt.sign(
      { id: user.id, email:user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
   const { password: _, ...userWithoutPassword } = user

    res.json({ token, user: userWithoutPassword })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, api_key, subscription_tier,
              subscription_status, subscription_ends_at, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}



const getApiKey = async (req, res) => {
   try {
    const result = await pool.query(
      'SELECT api_key FROM users WHERE id = $1',
      [req.user.id]
    )
    res.json({ apiKey: result.rows[0]?.api_key || null })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

const generateApiKey = async (req, res) => {
  try {
    const newApiKey = 'uv_live_' + crypto.randomBytes(24).toString('hex')

    await pool.query(
      'UPDATE users SET api_key = $1, updated_at = NOW() WHERE id = $2',
      [newApiKey, req.user.id]
    )

    res.json({ apiKey: newApiKey })
  } catch (err) {
    console.error('GenerateApiKey error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
}
module.exports = { signup, login, getMe, getApiKey, generateApiKey }
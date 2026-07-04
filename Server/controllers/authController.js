const supabase = require('../Config/supabase')
const jwt = require('jsonwebtoken')

const signup = async (req, res) => {
  const { name, email, password } = req.body
  try {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return res.status(400).json({ error: error.message })

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      email
    })

    if (profileError) {
      console.error('Failed to create profile on signup:', profileError)
    }

    const token = jwt.sign(
      { id: data.user.id, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: data.user.id, name, email } })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

const login = async (req, res) => {
  const { email, password } = req.body
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return res.status(400).json({ error: error.message })

    // Try to get profile, create if doesn't exist
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // If no profile exists (old user), create one
    if (!profile) {
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: data.user.email.split('@')[0]
        })
        .select()
        .single()

      if (profileError) {
        console.error('Failed to create profile on login:', profileError)
      }
      profile = newProfile
    }

    const token = jwt.sign(
      { id: data.user.id, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: profile || { id: data.user.id, email } })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}

const getMe = async (req, res) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

const crypto = require('crypto')

const getApiKey = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('api_key')
      .eq('id', req.user.id)
      .single()

    if (error) return res.status(400).json({ error: error.message })
    res.json({ apiKey: data?.api_key || null })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

const generateApiKey = async (req, res) => {
  try {
    const newApiKey = 'uv_live_' + crypto.randomBytes(24).toString('hex')
    const { error } = await supabase
      .from('profiles')
      .update({ api_key: newApiKey })
      .eq('id', req.user.id)

    if (error) return res.status(400).json({ error: error.message })
    res.json({ apiKey: newApiKey })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

module.exports = { signup, login, getMe, getApiKey, generateApiKey }
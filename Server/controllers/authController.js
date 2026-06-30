const supabase = require('../config/supabase')
const jwt = require('jsonwebtoken')

const signup = async (req, res) => {
  const { name, email, password } = req.body
  try {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return res.status(400).json({ error: error.message })

    await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      email
    })

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    const token = jwt.sign(
      { id: data.user.id, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: profile })
  } catch (err) {
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

module.exports = { signup, login, getMe }
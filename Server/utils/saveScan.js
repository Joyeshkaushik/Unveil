const supabase = require('../Config/supabase')
const {redis}=require('../Config/redis')

async function saveScan({
  userId,
  type,
  inputPreview,
  result,
  confidence
}) {
  try {
    const { error } = await supabase.from('scans').insert({
      user_id: userId,
      type,
      input_preview: inputPreview,
      result,
      confidence: confidence / 100
    })

    if (error) {
      console.error('Save scan error:', error.message)
    }
      // INVALIDATE history cache — user has a new scan now
    await redis.del(`history:${userId}`)
    console.log(`Cache invalidated for user ${userId}`)

  } catch (err) {
    console.error('Database save error:', err.message)
  }
}

module.exports = saveScan
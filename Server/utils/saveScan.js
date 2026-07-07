const supabase = require('../config/supabase')

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
  } catch (err) {
    console.error('Database save error:', err.message)
  }
}

module.exports = saveScan
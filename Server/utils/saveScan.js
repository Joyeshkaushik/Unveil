
const {redis}=require('../Config/redis')
const pool=require('../Config/db')

async function saveScan({
  userId,
  type,
  inputPreview,
  result,
  confidence
}) {
  try {
    await pool.query(
      `INSERT INTO scans (user_id, type, input_preview, result, confidence)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, inputPreview, result, confidence / 100]
    )

    
      // INVALIDATE history cache — user has a new scan now
    await redis.del(`history:${userId}`)
    console.log(`Cache invalidated for user ${userId}`)

  } catch (err) {
    console.error('Database save error:', err.message)
  }
}

module.exports = saveScan
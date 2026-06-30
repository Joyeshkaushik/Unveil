const axios = require('axios')
const Groq = require('groq-sdk')
const supabase = require('../config/supabase')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const detectText = async (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'No text provided' })

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI content detector. Analyze text and identify specific phrases that indicate AI generation.'
        },
        {
          role: 'user',
          content: `Analyze this text and detect if it was written by AI or human:

"${text}"

Respond ONLY with this exact JSON:
{
  "result": "ai" or "human",
  "confidence": number 0-100,
  "aiScore": number 0-100,
  "humanScore": number 0-100,
  "reason": "2-3 sentence explanation",
  "highlights": [
    {
      "phrase": "exact phrase from text",
      "reason": "why this is AI-like",
      "severity": "high" or "medium" or "low"
    }
  ]
}`
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    })

    const rawText = completion.choices[0].message.content.trim()
    console.log('Groq response:', rawText)

    const cleaned = rawText.replace(/```json|```/g, '').trim()
    const data = JSON.parse(cleaned)

    await supabase.from('scans').insert({
      user_id: req.user.id,
      type: 'text',
      input_preview: text.substring(0, 100),
      result: data.result,
      confidence: data.confidence / 100
    })

    res.json({
      result: data.result,
      confidence: data.confidence,
      aiScore: data.aiScore,
      humanScore: data.humanScore,
      reason: data.reason,
      highlights: data.highlights || [],
      originalText: text
    })
  } catch (err) {
    console.error('Groq error:', err.message)
    res.status(500).json({ error: 'Text detection failed' })
  }
}

const detectImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' })

    const FormData = require('form-data')
    const form = new FormData()
    form.append('media', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    })
    form.append('models', 'genai')
    form.append('api_user', process.env.SIGHTENGINE_USER)
    form.append('api_secret', process.env.SIGHTENGINE_SECRET)

    // Step 1 — Sightengine score
    const seResponse = await axios.post(
      'https://api.sightengine.com/1.0/check.json',
      form,
      { headers: form.getHeaders() }
    )

    console.log('Sightengine response:', JSON.stringify(seResponse.data, null, 2))

    const aiScore = Math.round((seResponse.data.type?.ai_generated || 0) * 100)
    const humanScore = 100 - aiScore
    const result = aiScore >= 50 ? 'ai' : 'human'
    const confidence = Math.max(aiScore, humanScore)

    // Step 2 — Groq vision explanation
    const base64Image = req.file.buffer.toString('base64')
    const mimeType = req.file.mimetype

    let indicators = []
    let explanation = ''

    try {
      const groqVision = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` }
            },
            {
              type: 'text',
              text: `Analyze this image for AI generation artifacts. The AI detection score is ${aiScore}%.

Respond ONLY with this exact JSON:
{
  "explanation": "2 sentence overall explanation",
  "indicators": [
    {
      "label": "short label max 5 words",
      "detail": "one sentence explanation",
      "type": "suspicious" or "normal"
    }
  ]
}`
            }
          ]
        }],
        temperature: 0.1,
        max_tokens: 800,
      })

      const raw = groqVision.choices[0].message.content.trim().replace(/```json|```/g, '')
      const parsed = JSON.parse(raw)
      indicators = parsed.indicators || []
      explanation = parsed.explanation || ''
      console.log('Groq vision indicators:', indicators.length)
    } catch (e) {
      console.log('Groq vision error:', e.message)
    }

    // Step 3 — Save to Supabase
    await supabase.from('scans').insert({
      user_id: req.user.id,
      type: 'image',
      input_preview: `Image: ${req.file.originalname}`,
      result,
      confidence: confidence / 100
    })

    res.json({
      result,
      confidence,
      aiScore,
      humanScore,
      reason: `AI generation probability: ${aiScore}%`,
      explanation,
      indicators
    })

  } catch (err) {
    console.error('Image error:', err?.response?.data || err.message)
    res.status(500).json({ error: 'Image detection failed' })
  }
}

const getHistory = async (req, res) => {
  try {
    const { data } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch history' })
  }
}

const detectVideo = async (req, res) => {
  const fs = require('fs')
  const path = require('path')
  const ffmpeg = require('fluent-ffmpeg')
  const os = require('os')

  try {
    const { url } = req.body
    const file = req.file

    if (!url && !file) return res.status(400).json({ error: 'No video file or URL provided' })

    let frameResults = []
    let tempDir = null

    if (file) {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unveil-'))
      const videoPath = path.join(tempDir, 'input.mp4')
      const framesDir = path.join(tempDir, 'frames')
      fs.mkdirSync(framesDir)
      fs.writeFileSync(videoPath, file.buffer)

      console.log('Extracting frames from video...')

      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .on('end', resolve)
          .on('error', reject)
          .screenshots({
            count: 6,
            folder: framesDir,
            filename: 'frame-%i.jpg',
            size: '640x?'
          })
      })

      const frameFiles = fs.readdirSync(framesDir).filter(f => f.endsWith('.jpg'))
      console.log(`Extracted ${frameFiles.length} frames`)

      for (const frameFile of frameFiles) {
        const frameBuffer = fs.readFileSync(path.join(framesDir, frameFile))
        const base64Frame = frameBuffer.toString('base64')

        try {
          const completion = await groq.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${base64Frame}` }
                },
                {
                  type: 'text',
                  text: `Is this video frame AI-generated or from a real video? Respond ONLY with JSON:
{"aiScore": number 0-100, "humanScore": number 0-100, "isAI": true or false}`
                }
              ]
            }],
            temperature: 0.1,
            max_tokens: 100,
          })

          const raw = completion.choices[0].message.content.trim().replace(/```json|```/g, '')
          const data = JSON.parse(raw)
          frameResults.push(data)
          console.log(`Frame ${frameFile}: AI=${data.aiScore}%`)
        } catch (e) {
          console.log('Frame analysis error:', e.message)
        }
      }

      fs.rmSync(tempDir, { recursive: true, force: true })
    }

    if (url && !file) {
      console.log('Analyzing video URL with Sightengine:', url)

      const response = await axios.get('https://api.sightengine.com/1.0/video/check-sync.json', {
        params: {
          stream_url: url,
          models: 'genai',
          api_user: process.env.SIGHTENGINE_USER,
          api_secret: process.env.SIGHTENGINE_SECRET
        },
        timeout: 60000
      })

      const frames = response.data.frames || []
      frameResults = frames.map(f => ({
        aiScore: Math.round((f.type?.ai_generated || 0) * 100),
        humanScore: Math.round((1 - (f.type?.ai_generated || 0)) * 100),
        isAI: (f.type?.ai_generated || 0) > 0.5
      }))
    }

    if (frameResults.length === 0) {
      return res.status(400).json({ error: 'Could not analyze video. Try a shorter clip under 30 seconds.' })
    }

    const avgAiScore = frameResults.reduce((a, b) => a + b.aiScore, 0) / frameResults.length
    const aiFrameCount = frameResults.filter(f => f.isAI).length
    const result = avgAiScore >= 50 ? 'ai' : 'human'
    const confidence = Math.max(avgAiScore, 100 - avgAiScore)

    await supabase.from('scans').insert({
      user_id: req.user.id,
      type: 'video',
      input_preview: file ? `Video: ${file.originalname}` : `URL: ${url?.substring(0, 80)}`,
      result,
      confidence: confidence / 100
    })

    res.json({
      result,
      confidence: Math.round(confidence),
      aiScore: Math.round(avgAiScore),
      humanScore: Math.round(100 - avgAiScore),
      reason: `Analyzed ${frameResults.length} frames — ${aiFrameCount} flagged as AI generated`,
      flags: aiFrameCount > 0 ? [`${aiFrameCount}/${frameResults.length} frames show AI generation signals`] : [],
      totalFrames: frameResults.length,
      aiFrames: aiFrameCount
    })

  } catch (err) {
    console.error('Video error:', err?.response?.data || err.message)
    res.status(500).json({ error: 'Video detection failed. Try a shorter clip.' })
  }
}

const detectFakeNews = async (req, res) => {
  try {
    const { claim } = req.body
    if (!claim?.trim()) return res.status(400).json({ error: 'No claim provided' })

    console.log('Checking claim:', claim)

    let factCheckResults = []
    try {
      const response = await axios.get('https://factchecktools.googleapis.com/v1alpha1/claims:search', {
        params: {
          query: claim,
          key: process.env.GOOGLE_FACT_CHECK_KEY,
          languageCode: 'en'
        }
      })
      factCheckResults = response.data.claims || []
      console.log('Fact check results:', factCheckResults.length)
    } catch (e) {
      console.log('Google Fact Check error:', e.message)
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a fake news detection expert. Analyze claims for credibility.'
        },
        {
          role: 'user',
          content: `Analyze this news claim for credibility: "${claim}"

Fact check data found: ${factCheckResults.length > 0
  ? factCheckResults.slice(0, 3).map(c =>
      `"${c.text}" - rated "${c.claimReview?.[0]?.textualRating}" by ${c.claimReview?.[0]?.publisher?.name}`
    ).join(', ')
  : 'No fact checks found'
}

Respond ONLY with this exact JSON:
{
  "verdict": "true" or "false" or "misleading" or "unverified",
  "credibilityScore": number 0-100,
  "reason": "2-3 sentence explanation",
  "sources": ["source1", "source2"],
  "flags": ["flag1", "flag2"]
}`
        }
      ],
      temperature: 0.1,
      max_tokens: 400,
    })

    const raw = completion.choices[0].message.content.trim().replace(/```json|```/g, '')
    const data = JSON.parse(raw)

    await supabase.from('scans').insert({
      user_id: req.user.id,
      type: 'text',
      input_preview: `News: ${claim.substring(0, 80)}`,
      result: data.verdict === 'true' ? 'human' : 'ai',
      confidence: data.credibilityScore / 100
    })

    res.json({
      verdict: data.verdict,
      credibilityScore: data.credibilityScore,
      reason: data.reason,
      sources: data.sources || [],
      flags: data.flags || [],
      factChecks: factCheckResults.slice(0, 3).map(c => ({
        claim: c.text,
        rating: c.claimReview?.[0]?.textualRating || 'Unknown',
        publisher: c.claimReview?.[0]?.publisher?.name || 'Unknown',
        url: c.claimReview?.[0]?.url || ''
      }))
    })

  } catch (err) {
    console.error('Fake news error:', err?.response?.data || err.message)
    res.status(500).json({ error: 'Fake news detection failed' })
  }
}


const detectImageUrl = async (req, res) => {
  try {
    const { base64, mimeType, filename } = req.body
    if (!base64) return res.status(400).json({ error: 'No image data provided' })

    const FormData = require('form-data')
    const buffer = Buffer.from(base64, 'base64')

    const form = new FormData()
    form.append('media', buffer, { filename: filename || 'image.jpg', contentType: mimeType || 'image/jpeg' })
    form.append('models', 'genai')
    form.append('api_user', process.env.SIGHTENGINE_USER)
    form.append('api_secret', process.env.SIGHTENGINE_SECRET)

    const seResponse = await axios.post('https://api.sightengine.com/1.0/check.json', form, { headers: form.getHeaders() })

    const aiScore = Math.round((seResponse.data.type?.ai_generated || 0) * 100)
    const humanScore = 100 - aiScore
    const result = aiScore >= 50 ? 'ai' : 'human'
    const confidence = Math.max(aiScore, humanScore)

    // Groq vision explanation
    let indicators = [], explanation = ''
    try {
      const groqVision = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: `Analyze this image for AI generation artifacts. AI score: ${aiScore}%. Respond ONLY with JSON: {"explanation": "2 sentences", "indicators": [{"label": "max 5 words", "detail": "one sentence", "type": "suspicious" or "normal"}]}` }
          ]
        }],
        temperature: 0.1,
        max_tokens: 600,
      })
      const parsed = JSON.parse(groqVision.choices[0].message.content.trim().replace(/```json|```/g, ''))
      indicators = parsed.indicators || []
      explanation = parsed.explanation || ''
    } catch (e) { console.log('Groq vision error:', e.message) }

    await supabase.from('scans').insert({
      user_id: req.user.id,
      type: 'image',
      input_preview: 'Image from extension',
      result,
      confidence: confidence / 100
    })

    res.json({ result, confidence, aiScore, humanScore, explanation, indicators })
  } catch (err) {
    console.error('Image URL error:', err?.response?.data || err.message)
    res.status(500).json({ error: 'Image detection failed' })
  }
}

module.exports = { detectText, detectImage, detectImageUrl, detectVideo, detectFakeNews, getHistory }
const axios = require('axios')
const Groq = require('groq-sdk')
const fs = require('fs')
const path = require('path')
const os = require('os')
const ffmpeg = require('fluent-ffmpeg')
const FormData = require('form-data')

const { analyzeText } = require('../utils/textAnalysis')
const parseAIResponse = require('../utils/parseAIResponse')
const saveScan = require('../utils/saveScan')

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const detectText = async (req, res) => {
  const { text } = req.body

  if (!text) {
    return res.status(400).json({
      error: 'No text provided'
    })
  }

  if (text.length < 50) {
    return res.status(400).json({
      error: 'Text too short. Minimum 50 characters for accurate detection.'
    })
  }

  try {
    const statistical = analyzeText(text)

    let llmData = null

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI content detector. Analyze writing style, not just content.
Look for: uniform sentence structure, lack of personal voice, overuse of transition words,
generic phrasing, absence of typos/colloquialisms, and overly formal tone.
Be conservative - only mark as AI if you see clear patterns.`
          },
          {
            role: 'user',
            content: `Analyze this text for AI generation indicators:

"${text.substring(0, 3000)}"

Statistical pre-analysis found:
- Sentence length variance: ${statistical.metrics.burstiness.meaning}
- Vocabulary pattern: ${statistical.metrics.vocabulary.meaning}
- AI phrases detected: ${statistical.metrics.patterns.patternsFound}
- Preliminary AI score: ${statistical.scores.aiScore}%

Respond ONLY with JSON:
{
  "llmAiScore": number 0-100,
  "reason": "2-3 sentence explanation",
  "highlights": [
    {
      "phrase": "exact phrase",
      "reason": "why AI-like",
      "severity": "high|medium|low"
    }
  ]
}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1500
      })

      llmData = parseAIResponse(
        completion.choices[0].message.content
      )
    } catch (llmErr) {
      console.log('LLM analysis failed:', llmErr.message)
    }

    const statWeight = 0.4
    const llmWeight = 0.6

    let finalAiScore
    let finalHumanScore
    let confidence

    if (llmData) {
      finalAiScore = Math.round(
        statistical.scores.aiScore * statWeight +
        llmData.llmAiScore * llmWeight
      )

      finalHumanScore = 100 - finalAiScore

      const agreement =
        100 - Math.abs(
          statistical.scores.aiScore -
          llmData.llmAiScore
        )

      confidence = Math.round(
        (agreement + Math.abs(finalAiScore - 50)) / 2
      )
    } else {
      finalAiScore = statistical.scores.aiScore
      finalHumanScore = statistical.scores.humanScore
      confidence = statistical.scores.confidence
    }

    const result = finalAiScore >= 50 ? 'ai' : 'human'

    const response = {
      result,
      confidence: Math.min(95, confidence),
      aiScore: finalAiScore,
      humanScore: finalHumanScore,
      reason:
        llmData?.reason ||
        `Statistical analysis indicates ${result === 'ai'
          ? 'AI-generated'
          : 'human-written'} content based on writing patterns.`,
      highlights: llmData?.highlights || [],
      methodology: {
        statistical: {
          aiScore: statistical.scores.aiScore,
          burstiness: statistical.metrics.burstiness.meaning,
          vocabulary: statistical.metrics.vocabulary.meaning,
          patternsFound: statistical.metrics.patterns.patternsFound
        },
        llm: llmData
          ? { aiScore: llmData.llmAiScore }
          : null,
        note:
          'Combined statistical + AI analysis. Results are probabilistic, not definitive.'
      },
      originalText: text
    }

    await saveScan({
      userId: req.user.id,
      type: 'text',
      inputPreview: text.substring(0, 100),
      result,
      confidence
    })

    res.json(response)

  } catch (err) {
    console.error('Detection error:', err.message)

    res.status(500).json({
      error: 'Text detection failed'
    })
  }
}

const detectImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image provided'
      })
    }

    const form = new FormData()

    form.append('media', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    })

    form.append('models', 'genai')
    form.append('api_user', process.env.SIGHTENGINE_USER)
    form.append('api_secret', process.env.SIGHTENGINE_SECRET)

    const seResponse = await axios.post(
      'https://api.sightengine.com/1.0/check.json',
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000
      }
    )

    const aiScore = Math.round(
      (seResponse.data.type?.ai_generated || 0) * 100
    )

    const humanScore = 100 - aiScore
    const result = aiScore >= 50 ? 'ai' : 'human'
    const confidence = Math.max(aiScore, humanScore)

    const base64Image = req.file.buffer.toString('base64')

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
              image_url: {
                url: `data:${req.file.mimetype};base64,${base64Image}`
              }
            },
            {
              type: 'text',
              text: `Analyze this image for AI generation artifacts.

AI score: ${aiScore}%

Respond ONLY with JSON:
{
  "explanation": "2 sentence explanation",
  "indicators": [
    {
      "label": "short label",
      "detail": "one sentence",
      "type": "suspicious" or "normal"
    }
  ]
}`
            }
          ]
        }],
        temperature: 0.1,
        max_tokens: 800
      })

      const parsed = parseAIResponse(
        groqVision.choices[0].message.content
      )

      indicators = parsed?.indicators || []
      explanation = parsed?.explanation || ''

    } catch (e) {
      console.log('Groq vision error:', e.message)
    }

    await saveScan({
      userId: req.user.id,
      type: 'image',
      inputPreview: `Image: ${req.file.originalname}`,
      result,
      confidence
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

    res.status(500).json({
      error: 'Image detection failed'
    })
  }
}

const detectImageUrl = async (req, res) => {
  try {
    const { base64, mimeType, filename } = req.body

    if (!base64) {
      return res.status(400).json({
        error: 'No image data provided'
      })
    }

    const buffer = Buffer.from(base64, 'base64')

    const form = new FormData()

    form.append('media', buffer, {
      filename: filename || 'image.jpg',
      contentType: mimeType || 'image/jpeg'
    })

    form.append('models', 'genai')
    form.append('api_user', process.env.SIGHTENGINE_USER)
    form.append('api_secret', process.env.SIGHTENGINE_SECRET)

    const seResponse = await axios.post(
      'https://api.sightengine.com/1.0/check.json',
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000
      }
    )

    const aiScore = Math.round(
      (seResponse.data.type?.ai_generated || 0) * 100
    )

    const humanScore = 100 - aiScore
    const result = aiScore >= 50 ? 'ai' : 'human'
    const confidence = Math.max(aiScore, humanScore)

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
              image_url: {
                url: `data:${mimeType};base64,${base64}`
              }
            },
            {
              type: 'text',
              text: `Analyze this image for AI generation artifacts.

AI score: ${aiScore}%

Respond ONLY with JSON:
{
  "explanation": "2 sentence explanation",
  "indicators": [
    {
      "label": "short label",
      "detail": "one sentence",
      "type": "suspicious" or "normal"
    }
  ]
}`
            }
          ]
        }],
        temperature: 0.1,
        max_tokens: 600
      })

      const parsed = parseAIResponse(
        groqVision.choices[0].message.content
      )

      indicators = parsed?.indicators || []
      explanation = parsed?.explanation || ''

    } catch (e) {
      console.log('Groq vision error:', e.message)
    }

    await saveScan({
      userId: req.user.id,
      type: 'image',
      inputPreview: 'Image from extension',
      result,
      confidence
    })

    res.json({
      result,
      confidence,
      aiScore,
      humanScore,
      explanation,
      indicators
    })

  } catch (err) {
    console.error('Image URL error:', err?.response?.data || err.message)

    res.status(500).json({
      error: 'Image detection failed'
    })
  }
}

const getHistory = async (req, res) => {
  try {
    const supabase = require('../Config/supabase')

    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', {
        ascending: false
      })
      

    if (error) {
      return res.status(500).json({
       
        error: 'Could not fetch history'
      })
    }
  

    res.json(data || [])

  } catch (err) {
    console.error('History error:', err.message)

    res.status(500).json({
      error: 'Could not fetch history'
    })
  }
}

const detectVideo = async (req, res) => {
  try {
    const { url } = req.body
    const file = req.file

    if (!url && !file) {
      return res.status(400).json({
        error: 'No video file or URL provided'
      })
    }

    let frameResults = []
    let tempDir = null

    if (file) {
      tempDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'unveil-')
      )

      const videoPath = path.join(tempDir, 'input.mp4')
      const framesDir = path.join(tempDir, 'frames')

      fs.mkdirSync(framesDir)

      fs.writeFileSync(videoPath, file.buffer)

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

      const frameFiles = fs
        .readdirSync(framesDir)
        .filter(f => f.endsWith('.jpg'))

      for (const frameFile of frameFiles) {
        const frameBuffer = fs.readFileSync(
          path.join(framesDir, frameFile)
        )

        const base64Frame =
          frameBuffer.toString('base64')

        try {
          const completion =
            await groq.chat.completions.create({
              model: 'meta-llama/llama-4-scout-17b-16e-instruct',
              messages: [{
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${base64Frame}`
                    }
                  },
                  {
                    type: 'text',
                    text: `Respond ONLY with JSON:
{
  "aiScore": number,
  "humanScore": number,
  "isAI": true or false
}`
                  }
                ]
              }],
              temperature: 0.1,
              max_tokens: 100
            })

          const parsed = parseAIResponse(
            completion.choices[0].message.content
          )

          if (parsed) {
            let ai = parseFloat(parsed.aiScore) || 0
            let human = parseFloat(parsed.humanScore) || 0

            // If the model returned fractions, convert to percentages
            if (ai <= 1 && human <= 1 && (ai > 0 || human > 0)) {
              ai = ai * 100
              human = human * 100
            }

            const isAI = !!parsed.isAI
            let finalAiScore = ai
            let finalHumanScore = human

            if (isAI) {
              finalAiScore = Math.max(ai, human)
              finalHumanScore = Math.min(ai, human)
            } else {
              finalHumanScore = Math.max(ai, human)
              finalAiScore = Math.min(ai, human)
            }

            if (finalAiScore + finalHumanScore === 0) {
              finalAiScore = isAI ? 90 : 10
              finalHumanScore = isAI ? 10 : 90
            } else {
              const total = finalAiScore + finalHumanScore
              finalAiScore = Math.round((finalAiScore / total) * 100)
              finalHumanScore = 100 - finalAiScore
            }

            frameResults.push({
              aiScore: finalAiScore,
              humanScore: finalHumanScore,
              isAI
            })
          }

        } catch (e) {
          console.log('Frame analysis error:', e.message)
        }
      }

      fs.rmSync(tempDir, {
        recursive: true,
        force: true
      })
    }

    if (url && !file) {
      const response = await axios.get(
        'https://api.sightengine.com/1.0/video/check-sync.json',
        {
          params: {
            stream_url: url,
            models: 'genai',
            api_user: process.env.SIGHTENGINE_USER,
            api_secret: process.env.SIGHTENGINE_SECRET
          },
          timeout: 60000
        }
      )

      const frames = response.data.frames || []

      frameResults = frames.map(f => ({
        aiScore: Math.round(
          (f.type?.ai_generated || 0) * 100
        ),
        humanScore: Math.round(
          (1 - (f.type?.ai_generated || 0)) * 100
        ),
        isAI: (f.type?.ai_generated || 0) > 0.5
      }))
    }

    if (frameResults.length === 0) {
      return res.status(400).json({
        error:
          'Could not analyze video. Try a shorter clip under 30 seconds.'
      })
    }

    const avgAiScore =
      frameResults.reduce((a, b) => a + b.aiScore, 0) /
      frameResults.length

    const aiFrameCount =
      frameResults.filter(f => f.isAI).length

    const result = avgAiScore >= 50
      ? 'ai'
      : 'human'

    const confidence = Math.max(
      avgAiScore,
      100 - avgAiScore
    )

    await saveScan({
      userId: req.user.id,
      type: 'video',
      inputPreview: file
        ? `Video: ${file.originalname}`
        : `URL: ${url?.substring(0, 80)}`,
      result,
      confidence
    })

    res.json({
      result,
      confidence: Math.round(confidence),
      aiScore: Math.round(avgAiScore),
      humanScore: Math.round(100 - avgAiScore),
      reason: `Analyzed ${frameResults.length} frames`,
      totalFrames: frameResults.length,
      aiFrames: aiFrameCount
    })

  } catch (err) {
    console.error('Video error:', err?.response?.data || err.message)

    res.status(500).json({
      error: 'Video detection failed'
    })
  }
}

const detectFakeNews = async (req, res) => {
  try {
    const { claim } = req.body

    if (!claim?.trim()) {
      return res.status(400).json({
        error: 'No claim provided'
      })
    }

    let factCheckResults = []

    try {
      const response = await axios.get(
        'https://factchecktools.googleapis.com/v1alpha1/claims:search',
        {
          params: {
            query: claim,
            key: process.env.GOOGLE_FACT_CHECK_KEY,
            languageCode: 'en'
          },
          timeout: 30000
        }
      )

      factCheckResults = response.data.claims || []

    } catch (e) {
      console.log('Google Fact Check error:', e.message)
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a fake news detection expert. Analyze claims for credibility.'
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

Respond ONLY with JSON:
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
      max_tokens: 400
    })

    const data = parseAIResponse(
      completion.choices[0].message.content
    )

    await saveScan({
      userId: req.user.id,
      type: 'text',
      inputPreview: `News: ${claim.substring(0, 80)}`,
      result:
        data?.verdict === 'true'
          ? 'human'
          : 'ai',
      confidence:
        data?.credibilityScore || 50
    })

    res.json({
      verdict: data?.verdict,
      credibilityScore: data?.credibilityScore,
      reason: data?.reason,
      sources: data?.sources || [],
      flags: data?.flags || [],
      factChecks: factCheckResults.slice(0, 3).map(c => ({
        claim: c.text,
        rating:
          c.claimReview?.[0]?.textualRating ||
          'Unknown',
        publisher:
          c.claimReview?.[0]?.publisher?.name ||
          'Unknown',
        url: c.claimReview?.[0]?.url || ''
      }))
    })

  } catch (err) {
    console.error('Fake news error:', err?.response?.data || err.message)

    res.status(500).json({
      error: 'Fake news detection failed'
    })
  }
}

const detectUrl = async (req, res) => {
  const { url } = req.body

  if (!url) {
    return res.status(400).json({
      error: 'No URL provided'
    })
  }

  try {
    new URL(url)
  } catch (err) {
    return res.status(400).json({
      error: 'Invalid URL format'
    })
  }

  try {
    const urlResponse = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 15000
    })

    const html = urlResponse.data
    if (!html || typeof html !== 'string') {
      return res.status(400).json({
        error: 'Could not retrieve text content from URL. Make sure the page is public.'
      })
    }

    let cleanText = html.replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '')
    cleanText = cleanText.replace(/<!--[\s\S]*?-->/g, '')
    cleanText = cleanText.replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|header|footer|aside|nav)>/gi, '\n')
    cleanText = cleanText.replace(/<[^>]+>/g, ' ')
    cleanText = cleanText
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    cleanText = cleanText.replace(/\s+/g, ' ').trim()

    if (cleanText.length < 50) {
      return res.status(400).json({
        error: 'Webpage text content is too short for accurate detection. Minimum 50 characters.'
      })
    }

    const statistical = analyzeText(cleanText)

    let llmData = null

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI content detector. Analyze writing style, not just content.
Look for: uniform sentence structure, lack of personal voice, overuse of transition words,
generic phrasing, absence of typos/colloquialisms, and overly formal tone.
Be conservative - only mark as AI if you see clear patterns.`
          },
          {
            role: 'user',
            content: `Analyze this text for AI generation indicators:

"${cleanText.substring(0, 3000)}"

Statistical pre-analysis found:
- Sentence length variance: ${statistical.metrics.burstiness.meaning}
- Vocabulary pattern: ${statistical.metrics.vocabulary.meaning}
- AI phrases detected: ${statistical.metrics.patterns.patternsFound}
- Preliminary AI score: ${statistical.scores.aiScore}%

Respond ONLY with JSON:
{
  "llmAiScore": number 0-100,
  "reason": "2-3 sentence explanation",
  "highlights": [
    {
      "phrase": "exact phrase",
      "reason": "why AI-like",
      "severity": "high|medium|low"
    }
  ]
}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1500
      })

      llmData = parseAIResponse(
        completion.choices[0].message.content
      )
    } catch (llmErr) {
      console.log('LLM analysis failed:', llmErr.message)
    }

    const statWeight = 0.4
    const llmWeight = 0.6

    let finalAiScore
    let finalHumanScore
    let confidence

    if (llmData) {
      finalAiScore = Math.round(
        statistical.scores.aiScore * statWeight +
        llmData.llmAiScore * llmWeight
      )

      finalHumanScore = 100 - finalAiScore

      const agreement =
        100 - Math.abs(
          statistical.scores.aiScore -
          llmData.llmAiScore
        )

      confidence = Math.round(
        (agreement + Math.abs(finalAiScore - 50)) / 2
      )
    } else {
      finalAiScore = statistical.scores.aiScore
      finalHumanScore = statistical.scores.humanScore
      confidence = statistical.scores.confidence
    }

    const result = finalAiScore >= 50 ? 'ai' : 'human'

    const response = {
      result,
      confidence: Math.min(95, confidence),
      aiScore: finalAiScore,
      humanScore: finalHumanScore,
      reason:
        llmData?.reason ||
        `Statistical analysis indicates ${result === 'ai'
          ? 'AI-generated'
          : 'human-written'} content based on writing patterns.`,
      highlights: llmData?.highlights || [],
      methodology: {
        statistical: {
          aiScore: statistical.scores.aiScore,
          burstiness: statistical.metrics.burstiness.meaning,
          vocabulary: statistical.metrics.vocabulary.meaning,
          patternsFound: statistical.metrics.patterns.patternsFound
        },
        llm: llmData
          ? { aiScore: llmData.llmAiScore }
          : null,
        note:
          'Combined statistical + AI analysis. Results are probabilistic, not definitive.'
      },
      originalText: cleanText,
      url
    }

    await saveScan({
      userId: req.user.id,
      type: 'url',
      inputPreview: `URL: ${url.substring(0, 80)}`,
      result,
      confidence
    })

    res.json(response)

  } catch (err) {
    console.error('URL detection error:', err.message)
    res.status(500).json({
      error: 'URL detection failed. Ensure the link is public and accessible.'
    })
  }
}

module.exports = {
  detectText,
  detectImage,
  detectImageUrl,
  detectVideo,
  detectFakeNews,
  getHistory,
  detectUrl
}
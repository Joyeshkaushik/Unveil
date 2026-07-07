/**
 * Statistical text analysis for AI detection
 * These metrics help identify AI-generated text patterns
 */

// Calculate basic text statistics
function getTextStats(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')))

  return {
    charCount: text.length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgWordsPerSentence: sentences.length ? words.length / sentences.length : 0,
    uniqueWordRatio: words.length ? uniqueWords.size / words.length : 0,
    avgWordLength: words.length ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0
  }
}

// Burstiness: Humans write with variable sentence lengths, AI is more uniform
function calculateBurstiness(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length < 3) return { score: 0.5, variance: 0, meaning: 'insufficient_data' }

  const lengths = sentences.map(s => s.split(/\s+/).length)
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = mean > 0 ? stdDev / mean : 0

  // AI text typically has CV < 0.3, human text > 0.4
  // Score: 0 = very AI-like, 1 = very human-like
  let score = Math.min(1, coefficientOfVariation / 0.5)

  return {
    score,
    variance: variance.toFixed(2),
    stdDev: stdDev.toFixed(2),
    coefficientOfVariation: coefficientOfVariation.toFixed(3),
    meaning: score < 0.3 ? 'uniform_ai_pattern' : score > 0.6 ? 'varied_human_pattern' : 'mixed'
  }
}

// Vocabulary diversity (Type-Token Ratio)
function calculateVocabularyDiversity(text) {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const uniqueWords = new Set(words.map(w => w.replace(/[^a-z]/g, '')))

  if (words.length < 10) return { score: 0.5, ratio: 0, meaning: 'insufficient_data' }

  // Use moving TTR for longer texts (more stable)
  const windowSize = Math.min(100, words.length)
  let totalTTR = 0
  let windows = 0

  for (let i = 0; i <= words.length - windowSize; i += 50) {
    const window = words.slice(i, i + windowSize)
    const uniqueInWindow = new Set(window.map(w => w.replace(/[^a-z]/g, '')))
    totalTTR += uniqueInWindow.size / window.length
    windows++
  }

  const avgTTR = windows > 0 ? totalTTR / windows : uniqueWords.size / words.length

  // AI text typically has higher TTR (more "sophisticated"), humans repeat more
  // But very high TTR can also indicate thesaurus abuse
  let score = avgTTR > 0.7 ? 0.3 : avgTTR > 0.5 ? 0.5 : 0.7

  return {
    score,
    ratio: avgTTR.toFixed(3),
    uniqueWords: uniqueWords.size,
    totalWords: words.length,
    meaning: avgTTR > 0.65 ? 'high_diversity_ai_pattern' : avgTTR < 0.4 ? 'low_diversity' : 'normal'
  }
}

// Detect common AI writing patterns
function detectAIPatterns(text) {
  const patterns = [
    { regex: /\b(In conclusion|To summarize|In summary|Overall)\b/gi, name: 'summary_phrases', weight: 0.6 },
    { regex: /\b(It's important to note|It is worth noting|Notably)\b/gi, name: 'hedging_phrases', weight: 0.7 },
    { regex: /\b(Furthermore|Moreover|Additionally|In addition)\b/gi, name: 'transition_words', weight: 0.4 },
    { regex: /\b(delve|tapestry|multifaceted|paradigm|synergy|leverage)\b/gi, name: 'ai_favorite_words', weight: 0.8 },
    { regex: /\b(As an AI|I cannot|I don't have personal)\b/gi, name: 'ai_self_reference', weight: 1.0 },
    { regex: /\b(the (landscape|realm|world) of)\b/gi, name: 'ai_metaphors', weight: 0.7 },
    { regex: /\b(plays a (crucial|vital|pivotal|key) role)\b/gi, name: 'ai_cliches', weight: 0.6 },
    { regex: /\b(It's essential to|It is essential to|It's crucial to)\b/gi, name: 'prescriptive_phrases', weight: 0.5 },
  ]

  const found = []
  let totalWeight = 0

  for (const pattern of patterns) {
    const matches = text.match(pattern.regex)
    if (matches) {
      found.push({
        pattern: pattern.name,
        count: matches.length,
        examples: matches.slice(0, 3),
        weight: pattern.weight
      })
      totalWeight += pattern.weight * Math.min(matches.length, 3) // Cap influence
    }
  }

  // Normalize score: 0 = no patterns, 1 = many patterns (AI-like)
  const score = Math.min(1, totalWeight / 5)

  return {
    score,
    patternsFound: found.length,
    patterns: found,
    meaning: score > 0.6 ? 'strong_ai_patterns' : score > 0.3 ? 'some_ai_patterns' : 'few_ai_patterns'
  }
}

// Sentence starter variety (humans vary more)
function analyzeSentenceStarters(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5)
  if (sentences.length < 5) return { score: 0.5, meaning: 'insufficient_data' }

  const starters = sentences.map(s => {
    const words = s.trim().split(/\s+/)
    return words.slice(0, 2).join(' ').toLowerCase()
  })

  const uniqueStarters = new Set(starters)
  const variety = uniqueStarters.size / starters.length

  // AI tends to start sentences similarly, humans vary more
  // Score: 0 = repetitive (AI-like), 1 = varied (human-like)
  const score = Math.min(1, variety * 1.5)

  return {
    score,
    variety: variety.toFixed(3),
    uniqueStarters: uniqueStarters.size,
    totalSentences: sentences.length,
    meaning: variety < 0.5 ? 'repetitive_starts' : 'varied_starts'
  }
}

// Main analysis function that combines all metrics
function analyzeText(text) {
  const stats = getTextStats(text)
  const burstiness = calculateBurstiness(text)
  const vocabulary = calculateVocabularyDiversity(text)
  const patterns = detectAIPatterns(text)
  const starters = analyzeSentenceStarters(text)

  // Weighted combination of scores
  // Lower = more AI-like, Higher = more human-like
  const weights = {
    burstiness: 0.25,      // Sentence length variation
    vocabulary: 0.15,      // Word diversity
    patterns: 0.35,        // AI phrase detection (most important)
    starters: 0.25         // Sentence starter variety
  }

  // Invert scores where needed (patterns.score is AI-like, others are human-like)
  const humanScore = (
    burstiness.score * weights.burstiness +
    vocabulary.score * weights.vocabulary +
    (1 - patterns.score) * weights.patterns +
    starters.score * weights.starters
  )

  const aiScore = 1 - humanScore

  return {
    stats,
    metrics: {
      burstiness,
      vocabulary,
      patterns,
      starters
    },
    scores: {
      aiScore: Math.round(aiScore * 100),
      humanScore: Math.round(humanScore * 100),
      confidence: Math.round(Math.abs(aiScore - 0.5) * 200) // How confident we are
    }
  }
}

module.exports = {
  analyzeText,
  getTextStats,
  calculateBurstiness,
  calculateVocabularyDiversity,
  detectAIPatterns,
  analyzeSentenceStarters
}

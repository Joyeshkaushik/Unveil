const {
  analyzeText,
  getTextStats,
  calculateBurstiness,
  calculateVocabularyDiversity,
  detectAIPatterns,
  analyzeSentenceStarters
} = require('../utils/textAnalysis')

describe('Text Analysis Utilities', () => {

  describe('getTextStats', () => {
    test('calculates basic stats correctly', () => {
      const text = 'Hello world. This is a test.'
      const stats = getTextStats(text)

      expect(stats.wordCount).toBe(6)
      expect(stats.sentenceCount).toBe(2)
      expect(stats.avgWordsPerSentence).toBe(3)
    })

    test('handles empty text', () => {
      const stats = getTextStats('')
      expect(stats.wordCount).toBe(0)
      expect(stats.sentenceCount).toBe(0)
    })
  })

  describe('calculateBurstiness', () => {
    test('detects uniform sentence lengths (AI-like)', () => {
      // All sentences same length - AI pattern
      const uniformText = 'This is a test. This is a test. This is a test. This is a test.'
      const result = calculateBurstiness(uniformText)

      expect(result.score).toBeLessThan(0.3) // Low score = AI-like
      expect(result.meaning).toBe('uniform_ai_pattern')
    })

    test('detects varied sentence lengths (human-like)', () => {
      // Varied sentence lengths - human pattern
      const variedText = 'Hi. This is a longer sentence with more words. Why? Because humans write like this sometimes.'
      const result = calculateBurstiness(variedText)

      expect(result.score).toBeGreaterThan(0.4)
    })

    test('handles insufficient data', () => {
      const result = calculateBurstiness('Short.')
      expect(result.meaning).toBe('insufficient_data')
    })
  })

  describe('detectAIPatterns', () => {
    test('detects common AI phrases', () => {
      const aiText = 'In conclusion, it is important to note that delving into this topic reveals a multifaceted paradigm.'
      const result = detectAIPatterns(aiText)

      expect(result.patternsFound).toBeGreaterThanOrEqual(2)
      expect(result.score).toBeGreaterThan(0.3)
    })

    test('no patterns in simple human text', () => {
      const humanText = 'I went to the store. Bought some milk. Came home.'
      const result = detectAIPatterns(humanText)

      expect(result.patternsFound).toBe(0)
      expect(result.score).toBe(0)
    })

    test('detects AI self-reference', () => {
      const aiSelfRef = 'As an AI, I cannot provide personal opinions on this matter.'
      const result = detectAIPatterns(aiSelfRef)

      expect(result.patterns.some(p => p.pattern === 'ai_self_reference')).toBe(true)
    })
  })

  describe('analyzeSentenceStarters', () => {
    test('detects repetitive starters', () => {
      // Same two-word starter for all sentences
      const repetitive = 'The cat sat down. The cat ran fast. The cat jumped high. The cat slept long. The cat ate food.'
      const result = analyzeSentenceStarters(repetitive)

      expect(result.variety).toBeDefined()
      expect(parseFloat(result.variety)).toBeLessThan(0.5)
    })

    test('detects varied starters', () => {
      const varied = 'Cats are great. I love them. Sometimes they scratch. But who cares? Life is good.'
      const result = analyzeSentenceStarters(varied)

      expect(result.score).toBeGreaterThan(0.5)
    })
  })

  describe('analyzeText (full analysis)', () => {
    test('returns complete analysis object', () => {
      const text = 'This is a sample text for testing. It should return all expected fields.'
      const result = analyzeText(text)

      expect(result).toHaveProperty('stats')
      expect(result).toHaveProperty('metrics')
      expect(result).toHaveProperty('scores')
      expect(result.scores).toHaveProperty('aiScore')
      expect(result.scores).toHaveProperty('humanScore')
      expect(result.scores).toHaveProperty('confidence')
    })

    test('AI text scores higher on AI score', () => {
      const aiText = `In conclusion, it is important to note that the integration of artificial intelligence
        into modern healthcare systems represents a paradigm shift. Furthermore, delving into this multifaceted
        topic reveals that machine learning plays a crucial role in diagnostic methodologies. Additionally,
        the landscape of medical imaging has been transformed by AI capabilities.`

      const result = analyzeText(aiText)
      expect(result.scores.aiScore).toBeGreaterThan(40)
    })

    test('scores add up to 100', () => {
      const text = 'Any random text works here for this test.'
      const result = analyzeText(text)

      expect(result.scores.aiScore + result.scores.humanScore).toBe(100)
    })
  })
})

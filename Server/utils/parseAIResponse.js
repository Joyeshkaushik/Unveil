function parseAIResponse(rawText) {
  try {
    if (!rawText) return null

    // Extract JSON content between the first '{' and the last '}'
    const firstBrace = rawText.indexOf('{')
    const lastBrace = rawText.lastIndexOf('}')

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonContent = rawText.substring(firstBrace, lastBrace + 1)
      return JSON.parse(jsonContent)
    }

    const cleaned = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    return JSON.parse(cleaned)
  } catch (error) {
    console.error('AI response parse error:', error.message)
    return null
  }
}

module.exports = parseAIResponse
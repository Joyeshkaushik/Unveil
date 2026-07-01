import { jsPDF } from 'jspdf'

/**
 * Generates and downloads a professional PDF report for a scan.
 * @param {Object} result - The scan result details.
 * @param {string} type - The type of scan ('text', 'image', 'video', 'url', 'news').
 */
export const exportScanToPDF = (result, type) => {
  const doc = new jsPDF()

  // Base branding colors
  const primaryColor = [11, 22, 44]       // Deep Navy (#0b162c)
  const accentColor = [59, 130, 246]      // Bright Blue (#3b82f6)
  const textColor = [51, 65, 85]          // Slate Gray (#334155)
  const textDark = [15, 23, 42]           // Slate Dark (#0f172a)
  const lightBg = [248, 250, 255]         // Very Light Ice Blue (#f8faff)
  const borderBg = [226, 232, 240]        // Slate Light Border (#e2e8f0)

  // Status-based colors
  const successColor = [34, 197, 94]      // Green (#22c55e)
  const dangerColor = [244, 63, 94]       // Red/Rose (#f43f5e)
  const warningColor = [245, 158, 11]     // Amber (#f59e0b)

  // 1. Header Banner
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 42, 'F')

  // Top header text
  doc.setTextColor(255, 255, 255)
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('UNVEIL', 16, 18)

  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(147, 197, 253) // Light sky blue
  doc.text('AI CONTENT VERIFICATION & CREDIBILITY REPORT', 16, 27)

  // Timestamp on the right
  const dateStr = new Date().toLocaleString()
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(`Generated: ${dateStr}`, 138, 25)

  // 2. Summary Card Container
  doc.setFillColor(...lightBg)
  doc.rect(16, 50, 178, 56, 'F')
  doc.setDrawColor(...borderBg)
  doc.setLineWidth(1)
  doc.rect(16, 50, 178, 56, 'S')

  // Summary title
  doc.setTextColor(...textDark)
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('ANALYSIS SUMMARY', 24, 60)

  // Details
  doc.setFontSize(10)
  doc.setTextColor(...textColor)
  doc.setFont('Helvetica', 'normal')
  doc.text('Content Type:', 24, 70)
  doc.setFont('Helvetica', 'bold')
  doc.setTextColor(...textDark)
  doc.text(type.toUpperCase(), 64, 70)

  doc.setFont('Helvetica', 'normal')
  doc.setTextColor(...textColor)
  doc.text('Verdict:', 24, 80)

  const isNews = type === 'news'
  const isAI = result.result === 'ai'
  const verdict = isNews
    ? ({ true: 'Likely True', false: 'Likely False', misleading: 'Misleading' }[result.verdict] || 'Unverified')
    : (isAI ? 'AI Generated' : type === 'image' ? 'Human Made' : type === 'video' ? 'Likely Human' : 'Human Written')

  // Style verdict with status colors
  let statusColor = successColor
  if (isNews) {
    if (result.verdict === 'false') statusColor = dangerColor
    else if (result.verdict === 'misleading') statusColor = warningColor
  } else {
    if (isAI) statusColor = dangerColor
  }

  doc.setFont('Helvetica', 'bold')
  doc.setTextColor(...statusColor)
  doc.text(verdict, 64, 80)

  doc.setFont('Helvetica', 'normal')
  doc.setTextColor(...textColor)
  doc.text(isNews ? 'Credibility Score:' : 'Confidence Score:', 24, 90)
  doc.setFont('Helvetica', 'bold')
  const scoreVal = isNews ? result.credibilityScore : result.confidence
  doc.setTextColor(...statusColor)
  doc.text(`${scoreVal || 0}%`, 64, 90)

  // Add the score metrics inside the summary card (right half)
  doc.setTextColor(...textColor)
  if (!isNews) {
    doc.setFont('Helvetica', 'normal')
    doc.text('AI Score:', 116, 70)
    doc.setFont('Helvetica', 'bold')
    doc.setTextColor(...dangerColor)
    doc.text(`${result.aiScore || 0}%`, 150, 70)

    doc.setFont('Helvetica', 'normal')
    doc.setTextColor(...textColor)
    doc.text('Human Score:', 116, 80)
    doc.setFont('Helvetica', 'bold')
    doc.setTextColor(...successColor)
    doc.text(`${result.humanScore || 0}%`, 150, 80)
  } else {
    doc.setFont('Helvetica', 'normal')
    doc.text('Fact Check Status:', 116, 70)
    doc.setFont('Helvetica', 'bold')
    doc.setTextColor(...statusColor)
    doc.text(result.verdict ? result.verdict.toUpperCase() : 'N/A', 155, 70)
  }

  let currentY = 120

  // Helper function to draw headings
  const drawHeading = (title) => {
    // If getting close to the page end, add a new page
    if (currentY > 260) {
      doc.addPage()
      currentY = 25
    }
    doc.setTextColor(...primaryColor)
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(title, 16, currentY)
    doc.setDrawColor(...accentColor)
    doc.setLineWidth(0.6)
    doc.line(16, currentY + 3, 194, currentY + 3)
    currentY += 12
  }

  // Helper to add block of text
  const drawParagraph = (textStr, size = 10, italic = false) => {
    doc.setFont('Helvetica', italic ? 'oblique' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...textColor)
    const lines = doc.splitTextToSize(textStr, 178)
    lines.forEach(line => {
      if (currentY > 275) {
        doc.addPage()
        currentY = 25
      }
      doc.text(line, 16, currentY)
      currentY += 5
    })
    currentY += 5
  }

  // 3. Analysis Reason / Explanation
  if (result.reason) {
    drawHeading('Analysis Findings')
    drawParagraph(result.reason)
  }

  // 4. Image/Video Visual Explanations or Indicators
  if (result.explanation) {
    drawHeading('Visual Artifact Analysis')
    drawParagraph(result.explanation)
  }

  if (result.indicators && result.indicators.length > 0) {
    drawHeading('Visual Detection Indicators')
    result.indicators.forEach(ind => {
      const isSusp = ind.type === 'suspicious'
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...(isSusp ? dangerColor : successColor))
      
      const tag = `[${isSusp ? 'SUSPICIOUS' : 'NORMAL'}] ${ind.label}`
      if (currentY > 270) {
        doc.addPage()
        currentY = 25
      }
      doc.text(tag, 16, currentY)
      currentY += 5
      
      if (ind.detail) {
        doc.setFont('Helvetica', 'normal')
        doc.setTextColor(...textColor)
        drawParagraph(ind.detail, 9.5)
      } else {
        currentY += 2
      }
    })
  }

  // 5. Video Frame breakdown
  if (result.totalFrames) {
    drawHeading('Video Frame Breakdown')
    drawParagraph(`Total Frames Evaluated: ${result.totalFrames}`)
    drawParagraph(`AI Flags Detected: ${result.aiFrames} frames (${Math.round((result.aiFrames / result.totalFrames) * 100)}%)`)
    drawParagraph(`Human Frame Signature: ${result.totalFrames - result.aiFrames} frames`)
  }

  // 6. Suspicious Indicators / Flags (Text/URL/News)
  if (result.flags && result.flags.length > 0) {
    drawHeading('Suspicious Indicators')
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(10)
    result.flags.forEach(flag => {
      if (currentY > 270) {
        doc.addPage()
        currentY = 25
      }
      doc.setTextColor(...dangerColor)
      doc.text('•', 16, currentY)
      doc.setTextColor(...textColor)
      doc.text(flag, 21, currentY)
      currentY += 6
    })
    currentY += 4
  }

  // 7. Fact Check Sources (News)
  if (isNews && result.factChecks && result.factChecks.length > 0) {
    drawHeading('Third-Party Fact Check Sources')
    result.factChecks.forEach(fc => {
      if (currentY > 260) {
        doc.addPage()
        currentY = 25
      }
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...textColor)
      doc.text(`${fc.publisher} rating:`, 16, currentY)
      doc.setTextColor(...(fc.rating.toLowerCase().includes('true') ? successColor : fc.rating.toLowerCase().includes('false') ? dangerColor : warningColor))
      doc.text(fc.rating.toUpperCase(), 55, currentY)
      currentY += 5

      doc.setFont('Helvetica', 'normal')
      doc.setTextColor(...textColor)
      drawParagraph(`Claim: "${fc.claim}"`, 9.5)
      if (fc.url) {
        doc.setFont('Helvetica', 'normal')
        doc.setTextColor(...accentColor)
        doc.text(`Source URL: ${fc.url}`, 16, currentY)
        currentY += 8
      }
    })
  }

  // 8. Methodology
  if (result.methodology) {
    drawHeading('Analysis Methodology')
    
    let methDetails = ''
    if (result.methodology.statistical) {
      const stat = result.methodology.statistical
      methDetails += `Statistical analysis highlights AI pattern score: ${stat.aiScore || 0}%. `
      if (stat.burstiness) methDetails += `Burstiness: ${stat.burstiness}. `
      if (stat.vocabulary) methDetails += `Vocabulary variance: ${stat.vocabulary}. `
    }
    if (result.methodology.llm) {
      methDetails += `Heuristics classifier LLM score: ${result.methodology.llm.aiScore || 0}%. `
    }
    drawParagraph(methDetails)
    if (result.methodology.note) {
      drawParagraph(`Note: ${result.methodology.note}`, 9, true)
    }
  }

  // 9. Original Content Source URL or Snippet
  if (result.url) {
    drawHeading('Analyzed Source URL')
    drawParagraph(result.url, 9.5)
  }

  if (result.originalText) {
    drawHeading('Analyzed Content Preview')
    const snippet = result.originalText.substring(0, 1500) + (result.originalText.length > 1500 ? '\n\n[Content truncated for preview...]' : '')
    drawParagraph(snippet, 9)
  }

  // 10. Footers
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(...borderBg)
    doc.setLineWidth(0.5)
    doc.line(16, 280, 194, 280)

    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175) // Gray 400
    doc.text('Disclaimer: Unveil results are probabilistic and generated using automated heuristics. Accuracy is not guaranteed.', 16, 285)
    doc.text(`Page ${i} of ${totalPages}`, 182, 285)
  }

  // Download PDF
  const filename = `Unveil-Verification-${type}-${Date.now()}.pdf`
  doc.save(filename)
}

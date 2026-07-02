// ── Overlay helpers ──────────────────────────────────────
function removeOverlay() {
  const el = document.getElementById('unveil-overlay')
  if (el) el.remove()
}



function createOverlay(content) {
  removeOverlay()

  const overlay = document.createElement('div')
  overlay.id = 'unveil-overlay'
  overlay.style.cssText = [
    'position:fixed', 'top:20px', 'right:20px', 'width:330px',
    'background:#0a1628', 'border:1px solid rgba(0,255,200,0.3)',
    'border-radius:14px', 'padding:20px', 'z-index:2147483647',
    'font-family:system-ui,-apple-system,sans-serif',
    'box-shadow:0 20px 60px rgba(0,0,0,0.5)',
    'max-height:90vh', 'overflow-y:auto'
  ].join(';')

  // Inject styles once
  if (!document.getElementById('unveil-styles')) {
    const style = document.createElement('style')
    style.id = 'unveil-styles'
    style.textContent = `
      @keyframes unveilSlideIn { from { transform:translateX(100%); opacity:0 } to { transform:translateX(0); opacity:1 } }
      @keyframes unveilSpin { to { transform:rotate(360deg) } }
      #unveil-overlay { animation: unveilSlideIn 0.3s ease; }
      #unveil-overlay * { box-sizing:border-box; margin:0; padding:0; }
      #unveil-overlay::-webkit-scrollbar { width:4px }
      #unveil-overlay::-webkit-scrollbar-thumb { background:rgba(0,255,200,0.2); border-radius:4px }
    `
    document.head.appendChild(style)
  }

  overlay.innerHTML = content
  document.body.appendChild(overlay)

  // Close button
  const btn = document.getElementById('unveil-close')
  if (btn) btn.addEventListener('click', removeOverlay)

  // Click outside to close
  
}

// ── Shared header ─────────────────────────────────────────
function makeHeader(mode) {
  const labels = { text: '🔍 Text Check', image: '🖼️ Image Check', news: '📰 News Check' }
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div>
        <span style="font-weight:800;font-size:16px;color:#00ffc8;letter-spacing:1px">UNVEIL</span>
        <span style="color:#8899aa;font-size:11px;margin-left:8px">${labels[mode] || ''}</span>
      </div>
      <button id="unveil-close" style="background:transparent;border:none;color:#8899aa;cursor:pointer;font-size:18px;line-height:1;padding:0">✕</button>
    </div>
  `
}

// ── Score boxes ───────────────────────────────────────────
function scoreBoxes(aiScore, humanScore) {
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="background:#050d14;border-radius:8px;padding:10px;text-align:center">
        <div style="color:#ff6b6b;font-size:18px;font-weight:700">${aiScore}%</div>
        <div style="color:#8899aa;font-size:11px">AI Score</div>
      </div>
      <div style="background:#050d14;border-radius:8px;padding:10px;text-align:center">
        <div style="color:#6bffa0;font-size:18px;font-weight:700">${humanScore}%</div>
        <div style="color:#8899aa;font-size:11px">Human Score</div>
      </div>
    </div>
  `
}

// ── Full analysis link ────────────────────────────────────
const fullLink = `<a href="http://localhost:5173/detect" target="_blank" style="display:block;text-align:center;background:linear-gradient(135deg,#00ffc8,#00aaff);color:#050d14;padding:10px;border-radius:8px;font-weight:700;font-size:13px;text-decoration:none">Full Analysis on Unveil →</a>`

// ── Message listener ──────────────────────────────────────
chrome.runtime.onMessage.addListener(function(msg) {

  // LOADING
  if (msg.type === 'UNVEIL_LOADING') {
    const text = { text: 'Analyzing text...', image: 'Analyzing image...', news: 'Checking sources...' }[msg.mode] || 'Analyzing...'
    createOverlay(`
      ${makeHeader(msg.mode)}
      <div style="display:flex;align-items:center;gap:12px;color:#8899aa;font-size:14px">
        <div style="width:20px;height:20px;border:2px solid rgba(0,255,200,0.3);border-top-color:#00ffc8;border-radius:50%;animation:unveilSpin 0.8s linear infinite;flex-shrink:0"></div>
        ${text}
      </div>
    `)
    return
  }

  // ERROR
  if (msg.type === 'UNVEIL_RESULT' && msg.error) {
    createOverlay(`
      ${makeHeader(msg.mode || 'text')}
      <div style="color:#ff6b6b;font-size:14px;margin-bottom:${msg.needsLogin ? '14px' : '0'}">❌ ${msg.error}</div>
      ${msg.needsLogin ? `<a href="http://localhost:5173/login" target="_blank" style="display:block;text-align:center;background:linear-gradient(135deg,#00ffc8,#00aaff);color:#050d14;padding:10px;border-radius:8px;font-weight:700;font-size:13px;text-decoration:none;margin-top:12px">Login to Unveil →</a>` : ''}
    `)
    return
  }

  // TEXT RESULT
  if (msg.type === 'UNVEIL_RESULT' && msg.mode === 'text') {
    const r = msg.result
    const isAI = r.result === 'ai'
    const color = isAI ? '#ff6b6b' : '#6bffa0'

    const highlightsHTML = (r.highlights || []).slice(0, 3).map(h => `
      <div style="background:rgba(255,107,107,0.08);border:1px solid rgba(255,107,107,0.2);border-radius:6px;padding:8px 10px;margin-bottom:6px">
        <div style="color:#ff9999;font-size:11px;font-weight:600;margin-bottom:3px">"${(h.phrase || '').substring(0, 60)}${(h.phrase || '').length > 60 ? '...' : ''}"</div>
        <div style="color:#8899aa;font-size:11px">${(h.reason || '').substring(0, 80)}</div>
      </div>
    `).join('')

    createOverlay(`
      ${makeHeader('text')}
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:36px;margin-bottom:8px">${isAI ? '🤖' : '👤'}</div>
        <div style="font-size:20px;font-weight:800;color:${color};margin-bottom:4px">${isAI ? 'AI Generated' : 'Human Written'}</div>
        <div style="color:#8899aa;font-size:13px">Confidence: ${r.confidence}%</div>
      </div>
      ${scoreBoxes(r.aiScore, r.humanScore)}
      ${msg.text ? `<div style="color:#8899aa;font-size:11px;margin-bottom:12px;padding:8px;background:#050d14;border-radius:6px;font-style:italic">"${msg.text}${msg.text.length >= 120 ? '...' : ''}"</div>` : ''}
      ${highlightsHTML ? `<div style="margin-bottom:12px"><div style="color:#00ffc8;font-size:12px;font-weight:600;margin-bottom:8px">🔍 Suspicious Phrases</div>${highlightsHTML}</div>` : ''}
      <div style="color:#8899aa;font-size:12px;line-height:1.5;margin-bottom:14px">${(r.reason || '').substring(0, 120)}</div>
      ${fullLink}
    `)
    return
  }

  // IMAGE RESULT
  if (msg.type === 'UNVEIL_RESULT' && msg.mode === 'image') {
    const r = msg.result
    const isAI = r.result === 'ai'
    const color = isAI ? '#ff6b6b' : '#6bffa0'

    const indicatorsHTML = (r.indicators || []).slice(0, 4).map(ind => `
      <div style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;background:${ind.type === 'suspicious' ? 'rgba(255,107,107,0.06)' : 'rgba(107,255,160,0.06)'};border:1px solid ${ind.type === 'suspicious' ? 'rgba(255,107,107,0.2)' : 'rgba(107,255,160,0.2)'};border-radius:6px;margin-bottom:6px">
        <span style="font-size:13px;flex-shrink:0">${ind.type === 'suspicious' ? '⚠️' : '✅'}</span>
        <div>
          <div style="color:${ind.type === 'suspicious' ? '#ff6b6b' : '#6bffa0'};font-size:11px;font-weight:600;margin-bottom:2px">${ind.label || ''}</div>
          <div style="color:#8899aa;font-size:11px">${(ind.detail || '').substring(0, 80)}</div>
        </div>
      </div>
    `).join('')

    createOverlay(`
      ${makeHeader('image')}
      ${msg.imageUrl ? `<img src="${msg.imageUrl}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:14px;border:1px solid rgba(0,255,200,0.1)" />` : ''}
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:32px;margin-bottom:6px">${isAI ? '🤖' : '🖼️'}</div>
        <div style="font-size:18px;font-weight:800;color:${color};margin-bottom:4px">${isAI ? 'AI Generated' : 'Human Made'}</div>
        <div style="color:#8899aa;font-size:13px">Confidence: ${r.confidence}%</div>
      </div>
      ${scoreBoxes(r.aiScore, r.humanScore)}
      ${r.explanation ? `<div style="color:#8899aa;font-size:12px;line-height:1.5;margin-bottom:12px;padding:8px;background:#050d14;border-radius:6px;border-left:3px solid rgba(0,255,200,0.3)">${r.explanation.substring(0, 150)}</div>` : ''}
      ${indicatorsHTML ? `<div style="margin-bottom:14px"><div style="color:#00ffc8;font-size:12px;font-weight:600;margin-bottom:8px">🔍 Visual Indicators</div>${indicatorsHTML}</div>` : ''}
      ${fullLink}
    `)
    return
  }

  // NEWS RESULT
  if (msg.type === 'UNVEIL_RESULT' && msg.mode === 'news') {
    const r = msg.result
    const vc = {
      true:       { emoji: '✅', label: 'Likely True',  color: '#6bffa0' },
      false:      { emoji: '❌', label: 'Likely False', color: '#ff6b6b' },
      misleading: { emoji: '⚠️', label: 'Misleading',   color: '#ffcc00' },
      unverified: { emoji: '❓', label: 'Unverified',   color: '#8899aa' },
    }[r.verdict] || { emoji: '❓', label: 'Unverified', color: '#8899aa' }

    const factChecksHTML = (r.factChecks || []).slice(0, 2).map(fc => `
      <div style="padding:8px 10px;background:#050d14;border-radius:6px;margin-bottom:6px;border-left:3px solid rgba(0,255,200,0.3)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="color:#e8f4f0;font-size:11px;font-weight:600">${fc.publisher || ''}</span>
          <span style="background:rgba(0,255,200,0.1);color:#00ffc8;font-size:10px;padding:2px 6px;border-radius:100px">${fc.rating || ''}</span>
        </div>
        <div style="color:#8899aa;font-size:11px">${(fc.claim || '').substring(0, 80)}</div>
      </div>
    `).join('')

    createOverlay(`
      ${makeHeader('news')}
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:36px;margin-bottom:8px">${vc.emoji}</div>
        <div style="font-size:20px;font-weight:800;color:${vc.color};margin-bottom:4px">${vc.label}</div>
        <div style="color:#8899aa;font-size:13px">Credibility: ${r.credibilityScore}%</div>
      </div>
      <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:100px;margin-bottom:16px">
        <div style="height:100%;width:${r.credibilityScore}%;background:${r.credibilityScore >= 60 ? '#6bffa0' : '#ff6b6b'};border-radius:100px"></div>
      </div>
      ${msg.text ? `<div style="color:#8899aa;font-size:11px;margin-bottom:12px;padding:8px;background:#050d14;border-radius:6px;font-style:italic">"${msg.text}${msg.text.length >= 120 ? '...' : ''}"</div>` : ''}
      <div style="color:#8899aa;font-size:12px;line-height:1.5;margin-bottom:12px">${(r.reason || '').substring(0, 150)}</div>
      ${factChecksHTML ? `<div style="margin-bottom:14px"><div style="color:#00ffc8;font-size:12px;font-weight:600;margin-bottom:8px">📋 Fact Check Sources</div>${factChecksHTML}</div>` : ''}
      ${fullLink}
    `)
    return
  }
})
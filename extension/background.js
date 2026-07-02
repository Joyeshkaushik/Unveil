const API_BASE = 'http://localhost:5000/api'

// ── Safe message sender ───────────────────────────────────
function sendToTab(tabId, message) {
  chrome.tabs.sendMessage(tabId, message).catch(() => {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }).then(() => {
      setTimeout(() => chrome.tabs.sendMessage(tabId, message).catch(() => {}), 150)
    }).catch(() => {})
  })
}

// ── Create context menus on install ──────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'unveil-text',
    title: '🔍 Check Text with Unveil',
    contexts: ['selection']
  })
  chrome.contextMenus.create({
    id: 'unveil-news',
    title: '📰 Verify as Fake News',
    contexts: ['selection']
  })
  chrome.contextMenus.create({
    id: 'unveil-image',
    title: '🖼️ Check Image with Unveil',
    contexts: ['image']
  })
})

// ── Auth check helper ─────────────────────────────────────
async function getToken(tabId) {
  const { token } = await chrome.storage.local.get('token')
  if (!token) {
    sendToTab(tabId, {
      type: 'UNVEIL_RESULT',
      error: 'Please login to Unveil first',
      needsLogin: true
    })
    return null
  }
  return token
}

// ── Handle all context menu clicks ───────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {

  // ── TEXT DETECTION ──────────────────────────────────────
  if (info.menuItemId === 'unveil-text') {
    const selectedText = info.selectionText?.trim()
    if (!selectedText) return

    const token = await getToken(tab.id)
    if (!token) return

    sendToTab(tab.id, { type: 'UNVEIL_LOADING', mode: 'text' })

    try {
      const response = await fetch(`${API_BASE}/detect/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text: selectedText })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Detection failed')

      sendToTab(tab.id, {
        type: 'UNVEIL_RESULT',
        mode: 'text',
        result: data,
        text: selectedText.substring(0, 120)
      })
    } catch (err) {
      sendToTab(tab.id, { type: 'UNVEIL_RESULT', mode: 'text', error: err.message })
    }
  }

  // ── FAKE NEWS DETECTION ─────────────────────────────────
  if (info.menuItemId === 'unveil-news') {
    const selectedText = info.selectionText?.trim()
    if (!selectedText) return

    const token = await getToken(tab.id)
    if (!token) return

    sendToTab(tab.id, { type: 'UNVEIL_LOADING', mode: 'news' })

    try {
      const response = await fetch(`${API_BASE}/detect/fakenews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ claim: selectedText })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Detection failed')

      sendToTab(tab.id, {
        type: 'UNVEIL_RESULT',
        mode: 'news',
        result: data,
        text: selectedText.substring(0, 120)
      })
    } catch (err) {
      sendToTab(tab.id, { type: 'UNVEIL_RESULT', mode: 'news', error: err.message })
    }
  }

  // ── IMAGE DETECTION ─────────────────────────────────────
  if (info.menuItemId === 'unveil-image') {
    const imageUrl = info.srcUrl
    if (!imageUrl) return

    const token = await getToken(tab.id)
    if (!token) return

    sendToTab(tab.id, { type: 'UNVEIL_LOADING', mode: 'image' })

    try {
      const imgResponse = await fetch(imageUrl)
      const blob = await imgResponse.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      const mimeType = blob.type || 'image/jpeg'

      const response = await fetch(`${API_BASE}/detect/image-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ base64, mimeType, filename: 'webpage-image.jpg' })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Detection failed')

      sendToTab(tab.id, {
        type: 'UNVEIL_RESULT',
        mode: 'image',
        result: data,
        imageUrl
      })
    } catch (err) {
      sendToTab(tab.id, { type: 'UNVEIL_RESULT', mode: 'image', error: err.message })
    }
  }
})
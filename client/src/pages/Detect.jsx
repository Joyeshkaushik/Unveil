import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axios'

/* ── CSS injected once ── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #07090f;
    --text: #f8faff;
    --text2: rgba(248,250,255,0.5);
    --text3: rgba(248,250,255,0.25);
    --border: rgba(255,255,255,0.07);
    --border-b: rgba(255,255,255,0.13);
    --glass: rgba(255,255,255,0.04);
    --glass2: rgba(255,255,255,0.07);
  }
  html, body, #root { min-height: 100%; }
  body { font-family: 'Outfit', sans-serif; background: var(--bg); color: var(--text); overflow-x: hidden; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.25); border-radius: 100px; }

  .dt-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
  .dt-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.55; }
  .dt-o1 { width: 650px; height: 650px; top: -250px; left: -180px;
    background: radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(99,102,241,0.1) 40%, transparent 70%); }
  .dt-o2 { width: 450px; height: 450px; bottom: -150px; right: -100px;
    background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.07) 40%, transparent 70%); }
  .dt-grid {
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
  }

  .dt-nav {
    position: sticky; top: 0; z-index: 100;
    padding: 0 40px; height: 60px;
    display: flex; justify-content: space-between; align-items: center;
    background: rgba(7,9,15,0.8); backdrop-filter: blur(24px);
    border-bottom: 1px solid var(--border);
  }
  .dt-logo {
    font-size: 18px; font-weight: 900; letter-spacing: 3px; cursor: pointer;
    background: linear-gradient(135deg, #f8faff 30%, #93c5fd 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .dt-back {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 18px; border-radius: 100px;
    background: var(--glass); border: 1px solid var(--border);
    color: var(--text2); font-size: 13px; font-weight: 600;
    font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.2s;
  }
  .dt-back:hover { background: var(--glass2); color: var(--text); border-color: var(--border-b); }

  .dt-wrap { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; padding: 48px 24px 80px; }

  .dt-page-title { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px; }
  .dt-page-title span { background: linear-gradient(90deg, #60a5fa, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .dt-page-sub { font-size: 14px; color: var(--text3); margin-bottom: 36px; }

  .dt-tabs {
    display: flex; gap: 6px; margin-bottom: 28px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border); border-radius: 100px;
    padding: 5px; width: fit-content;
    backdrop-filter: blur(16px);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
  }
  .dt-tab {
    padding: 9px 22px; border-radius: 100px;
    font-size: 13.5px; font-weight: 600; font-family: 'Outfit', sans-serif;
    cursor: pointer; border: none; transition: all 0.22s;
    background: transparent; color: var(--text2);
  }
  .dt-tab:hover { color: var(--text); background: var(--glass); }
  .dt-tab.active {
    background: linear-gradient(135deg, #3b82f6, #6366f1); color: white;
    box-shadow: 0 0 18px rgba(59,130,246,0.38), inset 0 1px 0 rgba(255,255,255,0.22);
  }

  .dt-card {
    background: linear-gradient(145deg, rgba(255,255,255,0.055), rgba(59,130,246,0.025), rgba(255,255,255,0.02));
    border: 1px solid var(--border); border-radius: 24px; padding: 28px;
    backdrop-filter: blur(28px); position: relative; overflow: hidden;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.32);
  }
  .dt-card::before {
    content: ''; position: absolute; top: 0; left: 15%; right: 15%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  }
  .dt-card::after {
    content: ''; position: absolute; bottom: 0; left: 20%; right: 20%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59,130,246,0.1), transparent);
  }

  .dt-textarea {
    width: 100%; background: rgba(0,0,0,0.25);
    border: 1px solid rgba(255,255,255,0.07); border-radius: 16px;
    padding: 18px 20px; color: var(--text); font-size: 14.5px;
    font-family: 'Outfit', sans-serif; resize: vertical; outline: none;
    line-height: 1.7; transition: border-color 0.2s; box-sizing: border-box; min-height: 200px;
  }
  .dt-textarea:focus { border-color: rgba(59,130,246,0.4); box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
  .dt-textarea::placeholder { color: var(--text3); }

  .dt-input {
    width: 100%; background: rgba(0,0,0,0.25);
    border: 1px solid rgba(255,255,255,0.07); border-radius: 14px;
    padding: 14px 18px; color: var(--text); font-size: 14px;
    font-family: 'Outfit', sans-serif; outline: none;
    transition: border-color 0.2s; box-sizing: border-box;
  }
  .dt-input:focus { border-color: rgba(59,130,246,0.4); box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
  .dt-input::placeholder { color: var(--text3); }

  .dt-drop {
    border: 1.5px dashed rgba(255,255,255,0.1); border-radius: 18px;
    padding: 52px 24px; text-align: center; cursor: pointer;
    transition: all 0.22s; background: rgba(0,0,0,0.15);
  }
  .dt-drop:hover { border-color: rgba(59,130,246,0.4); background: rgba(59,130,246,0.04); box-shadow: 0 0 24px rgba(59,130,246,0.08); }
  .dt-drop.has-file { border-color: rgba(59,130,246,0.35); border-style: solid; background: linear-gradient(145deg,rgba(59,130,246,0.07),rgba(99,102,241,0.04)); }

  .dt-sub-tabs { display: flex; gap: 6px; margin-bottom: 18px; }
  .dt-sub-tab {
    padding: 7px 18px; border-radius: 100px;
    font-size: 12.5px; font-weight: 600; font-family: 'Outfit', sans-serif;
    cursor: pointer; border: 1px solid var(--border); transition: all 0.18s; background: var(--glass); color: var(--text2);
  }
  .dt-sub-tab.active { background: linear-gradient(135deg,rgba(59,130,246,0.15),rgba(99,102,241,0.12)); border-color: rgba(59,130,246,0.28); color: #93c5fd; }

  .dt-info { display: flex; gap: 10px; padding: 12px 16px; border-radius: 14px; background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.12); margin-top: 14px; }
  .dt-info p { color: var(--text2); font-size: 12.5px; line-height: 1.65; }

  .dt-label { display: block; color: var(--text3); font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }

  .dt-char-row { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
  .dt-char { font-size: 12px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }

  .dt-btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 32px; border-radius: 100px;
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    color: white; font-size: 14px; font-weight: 700; font-family: 'Outfit', sans-serif;
    border: none; cursor: pointer; transition: all 0.22s;
    box-shadow: 0 0 20px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.22);
  }
  .dt-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 0 32px rgba(59,130,246,0.5), inset 0 1px 0 rgba(255,255,255,0.25); }
  .dt-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .dt-btn-primary.full { width: 100%; margin-top: 16px; padding: 14px; border-radius: 14px; }

  .dt-btn-ghost {
    display: inline-flex; align-items: center; justify-content: center;
    width: 100%; padding: 12px; border-radius: 14px; margin-top: 14px;
    background: var(--glass); border: 1px solid var(--border);
    color: var(--text2); font-size: 13.5px; font-weight: 500;
    font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.18s;
  }
  .dt-btn-ghost:hover { background: var(--glass2); color: var(--text); }

  .dt-error {
    display: flex; align-items: center; gap: 10px; padding: 14px 18px;
    background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.18);
    border-radius: 14px; color: #fca5a5; font-size: 13.5px; margin-top: 16px;
  }

  .dt-result {
    margin-top: 20px;
    background: linear-gradient(145deg, rgba(255,255,255,0.055), rgba(59,130,246,0.025), rgba(255,255,255,0.02));
    border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 32px;
    backdrop-filter: blur(28px);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.09), 0 12px 40px rgba(0,0,0,0.36);
    position: relative; overflow: hidden;
  }
  .dt-result::before {
    content: ''; position: absolute; top: 0; left: 15%; right: 15%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  }
  .dt-result-ai   { border-color: rgba(244,63,94,0.2);  box-shadow: inset 0 1px 0 rgba(255,255,255,0.09), 0 12px 40px rgba(244,63,94,0.08); }
  .dt-result-human{ border-color: rgba(34,197,94,0.2);  box-shadow: inset 0 1px 0 rgba(255,255,255,0.09), 0 12px 40px rgba(34,197,94,0.06); }
  .dt-result-news { border-color: rgba(59,130,246,0.2); }

  .dt-verdict-emoji { font-size: 52px; margin-bottom: 12px; display: block; }
  .dt-verdict-title { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 4px; }
  .dt-verdict-sub { font-size: 14px; color: var(--text3); }

  .dt-score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 24px; }
  .dt-score-box { background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; }
  .dt-score-label { color: var(--text3); font-size: 12px; margin-bottom: 8px; }
  .dt-score-val { font-size: 22px; font-weight: 800; font-family: 'JetBrains Mono', monospace; margin-bottom: 10px; }
  .dt-score-bar { height: 5px; background: rgba(255,255,255,0.06); border-radius: 100px; }
  .dt-score-fill { height: 100%; border-radius: 100px; transition: width 0.8s ease; }

  .dt-box { margin-top: 14px; padding: 16px 18px; border-radius: 14px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); }
  .dt-box-blue { background: rgba(59,130,246,0.06); border-color: rgba(59,130,246,0.12); }
  .dt-box-red  { background: rgba(244,63,94,0.06); border-color: rgba(244,63,94,0.14); }
  .dt-box-label { color: var(--text3); font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; }
  .dt-box-text { color: var(--text); font-size: 14px; line-height: 1.7; }

  .dt-cred-bar { height: 7px; background: rgba(255,255,255,0.06); border-radius: 100px; margin-top: 10px; }
  .dt-cred-fill { height: 100%; border-radius: 100px; transition: width 0.8s ease; }

  .dt-frames-grid { display: flex; gap: 28px; margin-top: 10px; }
  .dt-frame-num { font-size: 24px; font-weight: 900; font-family: 'JetBrains Mono', monospace; }
  .dt-frame-label { font-size: 11px; color: var(--text3); margin-top: 2px; }

  .dt-fc-item { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .dt-fc-item:last-child { border-bottom: none; padding-bottom: 0; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .dt-spin { display: inline-block; width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
`

export default function Detect() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState('text')
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoInputMode, setVideoInputMode] = useState('file')
  const [newsText, setNewsText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /* inject CSS once */
  useEffect(() => {
    const id = 'dt-styles'
    if (!document.getElementById(id)) {
      const el = document.createElement('style'); el.id = id; el.textContent = CSS
      document.head.appendChild(el)
    }
  }, [])

  /* ── read ?tab= param and set active tab ── */
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['text', 'image', 'video', 'news'].includes(tab)) {
      setMode(tab)
    }
  }, [searchParams])

  const reset = () => { setResult(null); setError('') }

  const handleTextScan = async () => {
    if (!text.trim()) return
    setLoading(true); reset()
    try { setResult((await api.post('/detect/text', { text })).data) }
    catch (e) { setError(e.response?.data?.error || 'Detection failed') }
    finally { setLoading(false) }
  }

  const handleImageScan = async () => {
    if (!image) return
    setLoading(true); reset()
    try {
      const fd = new FormData(); fd.append('image', image)
      setResult((await api.post('/detect/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data)
    } catch (e) { setError(e.response?.data?.error || 'Detection failed') }
    finally { setLoading(false) }
  }

  const handleVideoScan = async () => {
    setLoading(true); reset()
    try {
      if (videoInputMode === 'url') {
        setResult((await api.post('/detect/video', { url: videoUrl }, { timeout: 60000 })).data)
      } else {
        const fd = new FormData(); fd.append('video', videoFile)
        setResult((await api.post('/detect/video', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 })).data)
      }
    } catch (e) { setError(e.response?.data?.error || 'Video detection failed') }
    finally { setLoading(false) }
  }

  const handleNewsScan = async () => {
    if (!newsText.trim()) return
    setLoading(true); reset()
    try { setResult({ ...(await api.post('/detect/fakenews', { claim: newsText })).data, type: 'news' }) }
    catch (e) { setError(e.response?.data?.error || 'Detection failed') }
    finally { setLoading(false) }
  }

  const tabs = [
    { key: 'text', label: 'Text', icon: '📝' },
    { key: 'image', label: 'Image', icon: '🖼️' },
    { key: 'video', label: 'Video', icon: '🎬' },
    { key: 'news', label: 'News', icon: '📰' },
  ]

  const isAI = result?.result === 'ai'
  const isNews = result?.type === 'news'
  const verdict = isNews
    ? ({ true: 'Likely True', false: 'Likely False', misleading: 'Misleading' }[result.verdict] || 'Unverified')
    : (isAI ? 'AI Generated' : mode === 'image' ? 'Human Made' : mode === 'video' ? 'Likely Human' : 'Human Written')
  const verdictColor = isNews
    ? (result.verdict === 'true' ? '#86efac' : result.verdict === 'false' ? '#fca5a5' : '#fde68a')
    : (isAI ? '#fca5a5' : '#86efac')
  const verdictEmoji = isNews
    ? ({ true: '✅', false: '❌', misleading: '⚠️' }[result.verdict] || '❓')
    : (isAI ? '🤖' : mode === 'image' ? '🖼️' : mode === 'video' ? '🎬' : '👤')
  const resultClass = isNews ? 'dt-result-news' : isAI ? 'dt-result-ai' : 'dt-result-human'

  return (
    <div>
      <div className="dt-bg">
        <div className="dt-orb dt-o1" /><div className="dt-orb dt-o2" /><div className="dt-grid" />
      </div>

      <nav className="dt-nav">
        <div className="dt-logo" onClick={() => navigate('/dashboard')}>UNVEIL</div>
        <button className="dt-back" onClick={() => navigate('/dashboard')}>← Dashboard</button>
      </nav>

      <div className="dt-wrap">
        <div className="dt-page-title">Detect <span>Content</span></div>
        <div className="dt-page-sub">Analyze text, images, videos or news for AI generation</div>

        {/* TABS */}
        <div className="dt-tabs">
          {tabs.map(t => (
            <button key={t.key} className={`dt-tab ${mode === t.key ? 'active' : ''}`}
              onClick={() => { setMode(t.key); reset() }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* INPUT CARD */}
        <div className="dt-card">

          {/* TEXT */}
          {mode === 'text' && <>
            <label className="dt-label">Paste text to analyze</label>
            <textarea className="dt-textarea" rows={9} value={text} onChange={e => setText(e.target.value)}
              placeholder="Paste any text here — article, essay, email — and we'll tell you if AI wrote it..." />
            <div className="dt-char-row">
              <span className="dt-char">{text.length.toLocaleString()} characters</span>
              <button className="dt-btn-primary" disabled={loading || !text.trim()} onClick={handleTextScan}>
                {loading ? <><span className="dt-spin" /> Analyzing...</> : 'Analyze Text →'}
              </button>
            </div>
          </>}

          {/* IMAGE */}
          {mode === 'image' && <>
            <label className="dt-label">Upload an image</label>
            <div className={`dt-drop ${image ? 'has-file' : ''}`} onClick={() => document.getElementById('dt-img').click()}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{image ? '✅' : '🖼️'}</div>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: image ? '#86efac' : 'var(--text)' }}>
                {image ? image.name : 'Click to upload image'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text3)' }}>
                {image ? `${(image.size / 1024).toFixed(0)} KB` : 'PNG, JPG, WEBP supported'}
              </p>
              <input id="dt-img" type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { setImage(e.target.files[0]); reset() }} />
            </div>
            <button className="dt-btn-primary full" disabled={loading || !image} onClick={handleImageScan}>
              {loading ? <><span className="dt-spin" /> Analyzing...</> : 'Analyze Image →'}
            </button>
          </>}

          {/* VIDEO */}
          {mode === 'video' && <>
            <div className="dt-sub-tabs">
              {[{ k: 'file', l: '📁 Upload File' }, { k: 'url', l: '🔗 Paste URL' }].map(v => (
                <button key={v.k} className={`dt-sub-tab ${videoInputMode === v.k ? 'active' : ''}`}
                  onClick={() => setVideoInputMode(v.k)}>{v.l}</button>
              ))}
            </div>
            {videoInputMode === 'file' && <>
              <div className={`dt-drop ${videoFile ? 'has-file' : ''}`} onClick={() => document.getElementById('dt-vid').click()}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{videoFile ? '✅' : '🎬'}</div>
                <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: videoFile ? '#86efac' : 'var(--text)' }}>
                  {videoFile ? videoFile.name : 'Click to upload video'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text3)' }}>
                  {videoFile ? `${(videoFile.size / 1024 / 1024).toFixed(1)} MB` : 'MP4, MOV, AVI · Max 100MB'}
                </p>
                <input id="dt-vid" type="file" accept="video/*" style={{ display: 'none' }}
                  onChange={e => { setVideoFile(e.target.files[0]); reset() }} />
              </div>
              <div className="dt-info">
                <span>ℹ️</span>
                <p>Video is analyzed frame by frame using AI vision. Short clips (5–30 sec) give the fastest, most accurate results.</p>
              </div>
            </>}
            {videoInputMode === 'url' && <>
              <label className="dt-label">Direct video URL</label>
              <input className="dt-input" type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://example.com/video.mp4" />
              <div className="dt-info">
                <span>ℹ️</span>
                <p>Use a direct .mp4 link. Right-click any video → "Copy video address", or use Streamable / Cloudinary URLs.</p>
              </div>
            </>}
            <button className="dt-btn-primary full"
              disabled={loading || (videoInputMode === 'file' ? !videoFile : !videoUrl.trim())}
              onClick={handleVideoScan}>
              {loading ? <><span className="dt-spin" /> Analyzing frames...</> : 'Analyze Video →'}
            </button>
          </>}

          {/* NEWS */}
          {mode === 'news' && <>
            <label className="dt-label">Paste a news headline or claim</label>
            <textarea className="dt-textarea" rows={5} value={newsText} onChange={e => setNewsText(e.target.value)}
              placeholder="e.g. Scientists discover cure for cancer using household items..." />
            <div className="dt-info" style={{ marginTop: 12, marginBottom: 16 }}>
              <span>ℹ️</span>
              <p>Cross-checks your claim against Google Fact Check + AI analysis from Snopes, PolitiFact, BBC, Reuters and more.</p>
            </div>
            <button className="dt-btn-primary full" disabled={loading || !newsText.trim()} onClick={handleNewsScan}>
              {loading ? <><span className="dt-spin" /> Checking sources...</> : 'Check News →'}
            </button>
          </>}
        </div>

        {/* ERROR */}
        {error && <div className="dt-error"><span>⚠️</span> {error}</div>}

        {/* RESULT */}
        {result && (
          <div className={`dt-result ${resultClass}`}>

            {/* Verdict */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span className="dt-verdict-emoji">{verdictEmoji}</span>
              <div className="dt-verdict-title" style={{ color: verdictColor }}>{verdict}</div>
              <div className="dt-verdict-sub">
                {isNews ? `Credibility: ${result.credibilityScore}%` : `Confidence: ${result.confidence}%`}
              </div>
            </div>

            {/* Score bars — non-news */}
            {!isNews && (
              <div className="dt-score-grid">
                {[
                  { label: 'AI Score', val: result.aiScore, color: '#fca5a5', grad: 'linear-gradient(90deg,#f43f5e,#ef4444)' },
                  { label: 'Human Score', val: result.humanScore, color: '#86efac', grad: 'linear-gradient(90deg,#22c55e,#10b981)' },
                ].map((s, i) => (
                  <div key={i} className="dt-score-box">
                    <div className="dt-score-label">{s.label}</div>
                    <div className="dt-score-val" style={{ color: s.color }}>{s.val}%</div>
                    <div className="dt-score-bar"><div className="dt-score-fill" style={{ width: `${s.val}%`, background: s.grad }} /></div>
                  </div>
                ))}
              </div>
            )}

            {/* Credibility bar — news */}
            {isNews && (
              <div className="dt-box">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="dt-box-label" style={{ marginBottom: 0 }}>Credibility Score</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: result.credibilityScore >= 60 ? '#86efac' : '#fca5a5' }}>{result.credibilityScore}%</span>
                </div>
                <div className="dt-cred-bar">
                  <div className="dt-cred-fill" style={{ width: `${result.credibilityScore}%`, background: result.credibilityScore >= 60 ? 'linear-gradient(90deg,#22c55e,#10b981)' : 'linear-gradient(90deg,#f43f5e,#ef4444)' }} />
                </div>
              </div>
            )}

            {/* Analysis */}
            {result.reason && (
              <div className="dt-box">
                <div className="dt-box-label">Analysis</div>
                <div className="dt-box-text">{result.reason}</div>
              </div>
            )}

            {/* Flags */}
            {result.flags?.length > 0 && (
              <div className="dt-box dt-box-red">
                <div className="dt-box-label" style={{ color: '#fca5a5' }}>⚠️ Suspicious Indicators</div>
                {result.flags.map((f, i) => (
                  <div key={i} style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 5, display: 'flex', gap: 6 }}>
                    <span style={{ color: '#fca5a5' }}>•</span> {f}
                  </div>
                ))}
              </div>
            )}

            {/* Fact checks — news */}
            {isNews && result.factChecks?.length > 0 && (
              <div className="dt-box dt-box-blue">
                <div className="dt-box-label" style={{ color: '#93c5fd' }}>📋 Fact Check Sources</div>
                {result.factChecks.map((fc, i) => (
                  <div key={i} className="dt-fc-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{fc.publisher}</span>
                      <span style={{ padding: '2px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}>{fc.rating}</span>
                    </div>
                    <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>{fc.claim?.substring(0, 120)}...</div>
                    {fc.url && <a href={fc.url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: 12, marginTop: 5, display: 'inline-block' }}>Read more →</a>}
                  </div>
                ))}
              </div>
            )}

            {/* Frame analysis — video */}
            {result.totalFrames && (
              <div className="dt-box dt-box-blue">
                <div className="dt-box-label" style={{ color: '#93c5fd' }}>Frame Analysis</div>
                <div className="dt-frames-grid">
                  <div><div className="dt-frame-num">{result.totalFrames}</div><div className="dt-frame-label">Total Frames</div></div>
                  <div><div className="dt-frame-num" style={{ color: '#fca5a5' }}>{result.aiFrames}</div><div className="dt-frame-label">AI Flagged</div></div>
                  <div><div className="dt-frame-num" style={{ color: '#86efac' }}>{result.totalFrames - result.aiFrames}</div><div className="dt-frame-label">Human Frames</div></div>
                </div>
              </div>
            )}

            {/* Image explanation */}
            {result.explanation && (
              <div className="dt-box">
                <div className="dt-box-label">Visual Explanation</div>
                <div className="dt-box-text">{result.explanation}</div>
              </div>
            )}
            {result.indicators?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {result.indicators.map((ind, i) => (
                  <span key={i} style={{
                    padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                    background: ind.type === 'suspicious' ? 'rgba(244,63,94,0.1)' : 'rgba(34,197,94,0.1)',
                    color: ind.type === 'suspicious' ? '#fca5a5' : '#86efac',
                    border: `1px solid ${ind.type === 'suspicious' ? 'rgba(244,63,94,0.2)' : 'rgba(34,197,94,0.2)'}`,
                  }}>{ind.label}</span>
                ))}
              </div>
            )}

            <button className="dt-btn-ghost" onClick={() => {
              setResult(null); setError(''); setText(''); setImage(null);
              setVideoFile(null); setVideoUrl(''); setNewsText('')
            }}>Scan Another</button>
          </div>
        )}
      </div>
    </div>
  )
}
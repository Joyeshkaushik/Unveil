import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
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
html,body,#root { min-height:100%; }
body { font-family:'Outfit',sans-serif; background:var(--bg); color:var(--text); overflow-x:hidden; }

.dc-bg { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
.dc-orb { position:absolute; border-radius:50%; filter:blur(90px); opacity:.5; }
.dc-o1 { width:650px; height:650px; top:-250px; left:-150px; background:radial-gradient(circle,rgba(59,130,246,0.16) 0%,rgba(99,102,241,0.1) 40%,transparent 70%); }
.dc-o2 { width:450px; height:450px; bottom:-150px; right:-100px; background:radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%); }
.dc-grid { position:absolute; inset:0; background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px); background-size:28px 28px; mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%); }

.dc-nav { position:sticky; top:0; z-index:100; padding:0 40px; height:60px; display:flex; justify-content:space-between; align-items:center; background:rgba(7,9,15,0.8); backdrop-filter:blur(24px); border-bottom:1px solid var(--border); }
.dc-logo { font-size:18px; font-weight:900; letter-spacing:3px; cursor:pointer; background:linear-gradient(135deg,#f8faff 30%,#93c5fd 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.dc-back { display:inline-flex; align-items:center; gap:8px; padding:8px 18px; border-radius:100px; background:var(--glass); border:1px solid var(--border); color:var(--text2); font-size:13px; font-weight:600; font-family:'Outfit',sans-serif; cursor:pointer; transition:all 0.2s; }
.dc-back:hover { background:var(--glass2); color:var(--text); }

.dc-layout { position:relative; z-index:1; display:flex; max-width:1200px; margin:0 auto; padding:40px 24px 80px; gap:40px; }
.dc-sidebar { width:220px; flex-shrink:0; display:flex; flex-direction:column; gap:6px; position:sticky; top:100px; height:fit-content; }
.dc-s-title { font-size:11px; font-weight:700; color:var(--text3); letter-spacing:1px; text-transform:uppercase; margin-bottom:8px; padding:0 10px; }
.dc-s-item { padding:8px 12px; border-radius:100px; font-size:13.5px; font-weight:500; color:var(--text2); cursor:pointer; transition:all 0.18s; display:flex; align-items:center; gap:8px; }
.dc-s-item:hover { color:var(--text); background:var(--glass); }
.dc-s-item.active { background:linear-gradient(135deg,rgba(59,130,246,0.15),rgba(99,102,241,0.1)); border:1px solid rgba(59,130,246,0.2); color:#93c5fd; }

.dc-content { flex:1; min-width:0; }
.dc-section { margin-bottom:48px; scroll-margin-top:90px; }
.dc-title { font-size:32px; font-weight:800; letter-spacing:-0.5px; margin-bottom:6px; }
.dc-title span { background:linear-gradient(90deg,#60a5fa,#818cf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.dc-subtitle { font-size:15px; color:var(--text2); margin-bottom:28px; }

.dc-card { background:linear-gradient(145deg,rgba(255,255,255,0.05),rgba(59,130,246,0.02)); border:1px solid var(--border); border-radius:20px; padding:24px; margin-bottom:24px; position:relative; overflow:hidden; box-shadow:inset 0 1px 0 rgba(255,255,255,0.08); }
.dc-card-title { font-size:16px; font-weight:700; margin-bottom:12px; color:#f8faff; }

.dc-key-box { display:flex; gap:12px; align-items:center; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:12px 16px; margin-bottom:14px; }
.dc-key-input { font-family:'JetBrains Mono',monospace; font-size:13.5px; color:#93c5fd; background:transparent; border:none; flex:1; outline:none; }
.dc-btn { padding:10px 20px; border-radius:100px; font-size:13px; font-weight:600; font-family:'Outfit',sans-serif; cursor:pointer; transition:all 0.18s; border:none; display:inline-flex; align-items:center; gap:6px; }
.dc-btn-primary { background:linear-gradient(135deg,#3b82f6,#6366f1); color:white; box-shadow:0 0 16px rgba(59,130,246,0.3); }
.dc-btn-primary:hover { transform:translateY(-1px); box-shadow:0 0 24px rgba(59,130,246,0.45); }
.dc-btn-ghost { background:var(--glass); border:1px solid var(--border); color:var(--text2); }
.dc-btn-ghost:hover { background:var(--glass2); color:var(--text); }

.dc-endpoint-header { display:flex; gap:10px; align-items:center; margin-bottom:14px; }
.dc-method { padding:3px 10px; border-radius:6px; font-family:'JetBrains Mono',monospace; font-weight:700; font-size:11px; color:white; background:#22c55e; }
.dc-path { font-family:'JetBrains Mono',monospace; font-size:14px; font-weight:500; color:var(--text2); }

.dc-tabs { display:flex; gap:6px; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px; }
.dc-tab { padding:6px 14px; border-radius:100px; font-size:12px; font-weight:600; cursor:pointer; background:transparent; border:none; color:var(--text2); font-family:'Outfit',sans-serif; }
.dc-tab.active { background:rgba(59,130,246,0.12); color:#93c5fd; border:1px solid rgba(59,130,246,0.2); }
.dc-tab:hover:not(.active) { color:var(--text); }

.dc-code-block { background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05); border-radius:14px; padding:16px; position:relative; overflow:hidden; }
.dc-code { font-family:'JetBrains Mono',monospace; font-size:12.5px; color:#f8faff; white-space:pre-wrap; line-height:1.65; display:block; }
.dc-copy-btn { position:absolute; top:12px; right:12px; padding:6px 12px; font-size:11px; border-radius:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); color:var(--text2); cursor:pointer; transition:all 0.15s; }
.dc-copy-btn:hover { background:rgba(255,255,255,0.08); color:var(--text); }
`

export default function Docs() {
  const navigate = useNavigate()
  const [apiKey, setApiKey] = useState('')
  const [loadingKey, setLoadingKey] = useState(false)
  const [revealKey, setRevealKey] = useState(false)
  const [copiedText, setCopiedText] = useState(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [activeSec, setActiveSec] = useState('intro')

  const [tabState, setTabState] = useState({
    text: 'curl',
    url: 'curl',
    image: 'curl',
    video: 'curl'
  })

  useEffect(() => {
    const id = 'dc-styles'
    if (!document.getElementById(id)) {
      const el = document.createElement('style'); el.id = id; el.textContent = CSS
      document.head.appendChild(el)
    }

    // Fetch user API Key
    api.get('/auth/api-key')
      .then(res => setApiKey(res.data.apiKey || ''))
      .catch(() => {})
  }, [])
useEffect(() => {
  const sections = document.querySelectorAll(".dc-section");

  const handleScroll = () => {
    let current = "";

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;

      if (window.scrollY >= top - 120) {
        current = section.id;
      }
    });

    setActiveSec(current);
  };

  window.addEventListener("scroll", handleScroll);

  handleScroll(); // Run once initially

  return () => window.removeEventListener("scroll", handleScroll);
}, []);
  const handleGenerateKey = async () => {
    setLoadingKey(true)
    try {
      const { data } = await api.post('/auth/api-key')
      setApiKey(data.apiKey)
      setRevealKey(true)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingKey(false)
    }
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleCopySnippet = (key, textToCopy) => {
    navigator.clipboard.writeText(textToCopy)
    setCopiedText(key)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const activeKeyStr = apiKey || 'uv_live_your_actual_api_key_goes_here'

  const snippets = {
    text: {
      curl: `curl -X POST "http://localhost:5000/api/detect/text" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${activeKeyStr}" \\
  -d '{
    "text": "Delving into this multifaceted topic, it is important to note that the paradigm shift..."
  }'`,
      node: `const axios = require('axios');

axios.post('http://localhost:5000/api/detect/text', {
  text: 'Delving into this multifaceted topic, it is important to note that the paradigm shift...'
}, {
  headers: {
    'x-api-key': '${activeKeyStr}'
  }
})
.then(res => console.log(res.data))
.catch(err => console.error(err.response.data));`,
      python: `import requests

url = "http://localhost:5000/api/detect/text"
headers = {
    "x-api-key": "${activeKeyStr}"
}
data = {
    "text": "Delving into this multifaceted topic, it is important to note that the paradigm shift..."
}

response = requests.post(url, json=data, headers=headers)
print(response.json())`
    },
    url: {
      curl: `curl -X POST "http://localhost:5000/api/detect/url" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${activeKeyStr}" \\
  -d '{
    "url": "https://en.wikipedia.org/wiki/Artificial_intelligence"
  }'`,
      node: `const axios = require('axios');

axios.post('http://localhost:5000/api/detect/url', {
  url: 'https://en.wikipedia.org/wiki/Artificial_intelligence'
}, {
  headers: {
    'x-api-key': '${activeKeyStr}'
  }
})
.then(res => console.log(res.data))
.catch(err => console.error(err.response.data));`,
      python: `import requests

url = "http://localhost:5000/api/detect/url"
headers = {
    "x-api-key": "${activeKeyStr}"
}
data = {
    "url": "https://en.wikipedia.org/wiki/Artificial_intelligence"
}

response = requests.post(url, json=data, headers=headers)
print(response.json())`
    },
    image: {
      curl: `curl -X POST "http://localhost:5000/api/detect/image" \\
  -H "x-api-key: ${activeKeyStr}" \\
  -F "image=@/path/to/image.jpg"`,
      node: `const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const form = new FormData();
form.append('image', fs.createReadStream('./image.jpg'));

axios.post('http://localhost:5000/api/detect/image', form, {
  headers: {
    ...form.getHeaders(),
    'x-api-key': '${activeKeyStr}'
  }
})
.then(res => console.log(res.data))
.catch(err => console.error(err.response.data));`,
      python: `import requests

url = "http://localhost:5000/api/detect/image"
headers = {
    "x-api-key": "${activeKeyStr}"
}
files = {
    "image": open("image.jpg", "rb")
}

response = requests.post(url, files=files, headers=headers)
print(response.json())`
    },
    video: {
      curl: `curl -X POST "http://localhost:5000/api/detect/video" \\
  -H "x-api-key: ${activeKeyStr}" \\
  -F "video=@/path/to/video.mp4"`,
      node: `const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const form = new FormData();
form.append('video', fs.createReadStream('./video.mp4'));

axios.post('http://localhost:5000/api/detect/video', form, {
  headers: {
    ...form.getHeaders(),
    'x-api-key': '${activeKeyStr}'
  }
})
.then(res => console.log(res.data))
.catch(err => console.error(err.response.data));`,
      python: `import requests

url = "http://localhost:5000/api/detect/video"
headers = {
    "x-api-key": "${activeKeyStr}"
}
files = {
    "video": open("video.mp4", "rb")
}

response = requests.post(url, files=files, headers=headers)
print(response.json())`
    }
  }

  const scrollSec = (id) => {
    setActiveSec(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div>
      <div className="dc-bg">
        <div className="dc-orb dc-o1" /><div className="dc-orb dc-o2" /><div className="dc-grid" />
      </div>

      <nav className="dc-nav">
        <div className="dc-logo" onClick={() => navigate('/dashboard')}>UNVEIL</div>
        <button className="dc-back" onClick={() => navigate('/dashboard')}>← Dashboard</button>
      </nav>

      <div className="dc-layout">
        {/* SIDEBAR NAVIGATION */}
        <aside className="dc-sidebar">
          <div className="dc-s-title">Documentation</div>
          {[
            { key: 'intro', label: '📖 Introduction' },
            { key: 'auth', label: '🔑 Authentication' },
            { key: 'text-api', label: '📝 Text Analysis API' },
            { key: 'url-api', label: '🔗 URL Analysis API' },
            { key: 'image-api', label: '🖼️ Image Analysis API' },
            { key: 'video-api', label: '🎬 Video Analysis API' }
          ].map(s => (
            <button key={s.key} className={`dc-s-item ${activeSec === s.key ? 'active' : ''}`}
              onClick={() => scrollSec(s.key)}>
              {s.label}
            </button>
          ))}
        </aside>

        {/* DOCUMENTATION CONTENT */}
        <main className="dc-content">
          
          {/* INTRODUCTION */}
          <section className="dc-section" id="intro">
            <div className="dc-title">API <span>Documentation</span></div>
            <div className="dc-subtitle">Integrate advanced AI-media detection directly into your scripts and services</div>
            
            <div className="dc-card">
              <div className="dc-card-title">Overview</div>
              <p style={{ fontSize:14.5, color:'var(--text2)', lineHeight:1.75 }}>
                Unveil provides REST APIs for developers to automate the detection of synthetic media. You can run statistical and language heuristic classification on raw text, scrape and verify webpage URLs, evaluate image vision details, and perform frame-by-frame deepfake analysis on video clips.
              </p>
            </div>
          </section>

          {/* AUTHENTICATION */}
          <section className="dc-section" id="auth">
            <div className="dc-title" style={{ fontSize: 24, marginBottom: 14 }}>Authentication</div>
            
            <div className="dc-card">
              <div className="dc-card-title">Manage Your API Keys</div>
              <p style={{ fontSize:13.5, color:'var(--text2)', marginBottom:16, lineHeight:1.6 }}>
                All API requests require authentication. Pass your key in the request headers under <code>x-api-key</code>. Keep your keys secret—anyone with your key can run scans against your tier billing balance.
              </p>

              <div className="dc-key-box">
                <input className="dc-key-input" type={revealKey ? 'text' : 'password'} readOnly
                  value={apiKey ? apiKey : 'No API key generated yet'} />
                {apiKey && (
                  <button className="dc-btn dc-btn-ghost" onClick={() => setRevealKey(!revealKey)}>
                    {revealKey ? 'Hide' : 'Show'}
                  </button>
                )}
                {apiKey && (
                  <button className="dc-btn dc-btn-ghost" onClick={handleCopyKey}>
                    {copiedKey ? '✓ Copied!' : 'Copy'}
                  </button>
                )}
              </div>

              <button className="dc-btn dc-btn-primary" disabled={loadingKey} onClick={handleGenerateKey}>
                {loadingKey ? 'Generating...' : apiKey ? '🔄 Rotate API Key' : '🔑 Generate API Key'}
              </button>
            </div>
          </section>

          {/* TEXT API */}
          <section className="dc-section" id="text-api">
            <div className="dc-title" style={{ fontSize: 24, marginBottom: 14 }}>Text Analysis Endpoint</div>
            <div className="dc-card">
              <div className="dc-endpoint-header">
                <span className="dc-method">POST</span>
                <span className="dc-path">/api/detect/text</span>
              </div>
              <p style={{ fontSize:14, color:'var(--text2)', marginBottom:18, lineHeight:1.65 }}>
                Submits plain text content for AI generation assessment. Minimum requirement: 50 characters. Slices content up to 3000 characters for advanced LLM validation.
              </p>

              <div className="dc-tabs">
                {['curl', 'node', 'python'].map(lang => (
                  <button key={lang} className={`dc-tab ${tabState.text === lang ? 'active' : ''}`}
                    onClick={() => setTabState({ ...tabState, text: lang })}>{lang.toUpperCase()}</button>
                ))}
              </div>

              <div className="dc-code-block">
                <code className="dc-code">{snippets.text[tabState.text]}</code>
                <button className="dc-copy-btn" onClick={() => handleCopySnippet('text', snippets.text[tabState.text])}>
                  {copiedText === 'text' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </section>

          {/* URL API */}
          <section className="dc-section" id="url-api">
            <div className="dc-title" style={{ fontSize: 24, marginBottom: 14 }}>URL Analysis Endpoint</div>
            <div className="dc-card">
              <div className="dc-endpoint-header">
                <span className="dc-method">POST</span>
                <span className="dc-path">/api/detect/url</span>
              </div>
              <p style={{ fontSize:14, color:'var(--text2)', marginBottom:18, lineHeight:1.65 }}>
                Instructs the server to fetch a public webpage, strip away raw styling/structural tags, extract clean visible article text, and analyze it.
              </p>

              <div className="dc-tabs">
                {['curl', 'node', 'python'].map(lang => (
                  <button key={lang} className={`dc-tab ${tabState.url === lang ? 'active' : ''}`}
                    onClick={() => setTabState({ ...tabState, url: lang })}>{lang.toUpperCase()}</button>
                ))}
              </div>

              <div className="dc-code-block">
                <code className="dc-code">{snippets.url[tabState.url]}</code>
                <button className="dc-copy-btn" onClick={() => handleCopySnippet('url', snippets.url[tabState.url])}>
                  {copiedText === 'url' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </section>

          {/* IMAGE API */}
          <section className="dc-section" id="image-api">
            <div className="dc-title" style={{ fontSize: 24, marginBottom: 14 }}>Image Analysis Endpoint</div>
            <div className="dc-card">
              <div className="dc-endpoint-header">
                <span className="dc-method" style={{ background:'#3b82f6' }}>POST</span>
                <span className="dc-path">/api/detect/image</span>
              </div>
              <p style={{ fontSize:14, color:'var(--text2)', marginBottom:18, lineHeight:1.65 }}>
                Submits an image file via multipart form-data. Checks for synthetic vision patterns, DALL-E, or Midjourney generative artifacts.
              </p>

              <div className="dc-tabs">
                {['curl', 'node', 'python'].map(lang => (
                  <button key={lang} className={`dc-tab ${tabState.image === lang ? 'active' : ''}`}
                    onClick={() => setTabState({ ...tabState, image: lang })}>{lang.toUpperCase()}</button>
                ))}
              </div>

              <div className="dc-code-block">
                <code className="dc-code">{snippets.image[tabState.image]}</code>
                <button className="dc-copy-btn" onClick={() => handleCopySnippet('image', snippets.image[tabState.image])}>
                  {copiedText === 'image' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </section>

          {/* VIDEO API */}
          <section className="dc-section" id="video-api">
            <div className="dc-title" style={{ fontSize: 24, marginBottom: 14 }}>Video Analysis Endpoint</div>
            <div className="dc-card">
              <div className="dc-endpoint-header">
                <span className="dc-method" style={{ background:'#3b82f6' }}>POST</span>
                <span className="dc-path">/api/detect/video</span>
              </div>
              <p style={{ fontSize:14, color:'var(--text2)', marginBottom:18, lineHeight:1.65 }}>
                Extracts keyframe samples from an uploaded video file to analyze for deepfakes. Max file size: 100MB. Can also be called with direct video URLs.
              </p>

              <div className="dc-tabs">
                {['curl', 'node', 'python'].map(lang => (
                  <button key={lang} className={`dc-tab ${tabState.video === lang ? 'active' : ''}`}
                    onClick={() => setTabState({ ...tabState, video: lang })}>{lang.toUpperCase()}</button>
                ))}
              </div>

              <div className="dc-code-block">
                <code className="dc-code">{snippets.video[tabState.video]}</code>
                <button className="dc-copy-btn" onClick={() => handleCopySnippet('video', snippets.video[tabState.video])}>
                  {copiedText === 'video' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}

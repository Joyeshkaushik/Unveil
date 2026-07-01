import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
:root {
  --bg: #07090f;
  --text: #f8faff;
  --text2: rgba(248,250,255,0.5);
  --text3: rgba(248,250,255,0.25);
  --border: rgba(255,255,255,0.07);
  --glass: rgba(255,255,255,0.04);
  --glass2: rgba(255,255,255,0.07);
}
html,body,#root { min-height:100%; }
body { font-family:'Outfit',sans-serif; background:var(--bg); color:var(--text); overflow-x:hidden; }

.bm-bg { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
.bm-orb { position:absolute; border-radius:50%; filter:blur(90px); opacity:.55; }
.bm-o1 { width:650px; height:650px; top:-250px; left:-180px; background:radial-gradient(circle,rgba(59,130,246,0.16) 0%,rgba(99,102,241,0.1) 40%,transparent 70%); }
.bm-o2 { width:450px; height:450px; bottom:-150px; right:-100px; background:radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%); }
.bm-grid { position:absolute; inset:0; background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px); background-size:28px 28px; mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%); }

.bm-nav { position:sticky; top:0; z-index:100; padding:0 40px; height:60px; display:flex; justify-content:space-between; align-items:center; background:rgba(7,9,15,0.8); backdrop-filter:blur(24px); border-bottom:1px solid var(--border); }
.bm-logo { font-size:18px; font-weight:900; letter-spacing:3px; cursor:pointer; background:linear-gradient(135deg,#f8faff 30%,#93c5fd 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.bm-back { display:inline-flex; align-items:center; gap:8px; padding:8px 18px; border-radius:100px; background:var(--glass); border:1px solid var(--border); color:var(--text2); font-size:13px; font-weight:600; font-family:'Outfit',sans-serif; cursor:pointer; transition:all 0.2s; }
.bm-back:hover { background:var(--glass2); color:var(--text); }

.bm-wrap { position:relative; z-index:1; max-width:1040px; margin:0 auto; padding:48px 24px 80px; }
.bm-header { text-align:center; margin-bottom:48px; }
.bm-title { font-size:36px; font-weight:900; letter-spacing:-1px; margin-bottom:8px; }
.bm-title span { background:linear-gradient(90deg,#60a5fa,#818cf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.bm-subtitle { font-size:15px; color:var(--text2); max-width:540px; margin:0 auto; }

.bm-grid-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-bottom:32px; }
.bm-stat-card { padding:24px; border-radius:20px; border:1px solid var(--border); background:linear-gradient(145deg,rgba(255,255,255,0.05),rgba(59,130,246,0.02)); box-shadow:inset 0 1px 0 rgba(255,255,255,0.08); text-align:center; }
.bm-stat-label { font-size:11px; font-weight:700; color:var(--text3); letter-spacing:1px; text-transform:uppercase; margin-bottom:8px; }
.bm-stat-val { font-size:36px; font-weight:900; color:#93c5fd; font-family:'JetBrains Mono',monospace; line-height:1; margin-bottom:6px; }
.bm-stat-sub { font-size:12px; color:var(--text2); }

.bm-main-grid { display:grid; grid-template-columns:1.5fr 1fr; gap:20px; margin-bottom:32px; }
.bm-card { padding:24px; border-radius:20px; border:1px solid var(--border); background:linear-gradient(145deg,rgba(255,255,255,0.055),rgba(59,130,246,0.025)); backdrop-filter:blur(24px); box-shadow:inset 0 1px 0 rgba(255,255,255,0.08); }
.bm-card-title { font-size:16px; font-weight:700; margin-bottom:4px; color:#f8faff; }
.bm-card-sub { font-size:12px; color:var(--text3); margin-bottom:20px; }

.bm-table { width:100%; border-collapse:collapse; margin-top:8px; }
.bm-table th { text-align:left; padding:10px 12px; font-size:11px; font-weight:700; color:var(--text3); text-transform:uppercase; border-bottom:1px solid rgba(255,255,255,0.07); }
.bm-table td { padding:12px; font-size:13px; color:var(--text2); border-bottom:1px solid rgba(255,255,255,0.04); }
.bm-table tr:last-child td { border-bottom:none; }
.bm-val { font-family:'JetBrains Mono',monospace; font-weight:600; color:#86efac; }

.bm-tooltip { background:rgba(7,9,15,0.9); border:1px solid rgba(59,130,246,0.25); border-radius:10px; padding:10px 14px; }
.bm-tooltip-title { font-size:12px; color:var(--text3); margin-bottom:4px; }
.bm-tooltip-val { font-size:14px; font-weight:700; color:#93c5fd; }
`

export default function Benchmarks() {
  const navigate = useNavigate()

  useEffect(() => {
    const id = 'bm-styles'
    if (!document.getElementById(id)) {
      const el = document.createElement('style'); el.id = id; el.textContent = CSS
      document.head.appendChild(el)
    }
  }, [])

  // Mock benchmark chart data representing accuracy per model/generator
  const textModelData = [
    { name: 'GPT-3.5', Accuracy: 99.2 },
    { name: 'GPT-4o', Accuracy: 98.5 },
    { name: 'Claude 3', Accuracy: 98.1 },
    { name: 'LLaMA 3', Accuracy: 97.8 },
    { name: 'Mistral', Accuracy: 98.6 }
  ]

  const mediaModelData = [
    { name: 'Midjourney v6', Accuracy: 97.2 },
    { name: 'DALL-E 3', Accuracy: 96.5 },
    { name: 'Stable Diff XL', Accuracy: 95.8 },
    { name: 'Runway Gen-2', Accuracy: 95.0 },
    { name: 'Sora (Samples)', Accuracy: 94.1 }
  ]

  // ROC Curve data point coordinates (TPR vs FPR)
  const rocData = [
    { fpr: 0.0, Text: 0.0, Image: 0.0, Video: 0.0 },
    { fpr: 0.02, Text: 0.85, Image: 0.78, Video: 0.70 },
    { fpr: 0.05, Text: 0.94, Image: 0.88, Video: 0.82 },
    { fpr: 0.10, Text: 0.98, Image: 0.94, Video: 0.91 },
    { fpr: 0.20, Text: 0.99, Image: 0.97, Video: 0.95 },
    { fpr: 0.50, Text: 1.0, Image: 0.99, Video: 0.98 },
    { fpr: 1.0, Text: 1.0, Image: 1.0, Video: 1.0 }
  ]

  return (
    <div>
      <div className="bm-bg">
        <div className="bm-orb bm-o1" /><div className="bm-orb bm-o2" /><div className="bm-grid" />
      </div>

      <nav className="bm-nav">
        <div className="bm-logo" onClick={() => navigate('/dashboard')}>UNVEIL</div>
        <button className="bm-back" onClick={() => navigate('/dashboard')}>← Dashboard</button>
      </nav>

      <div className="bm-wrap">
        <div className="bm-header">
          <div className="bm-title">Accuracy <span>Benchmarks</span></div>
          <div className="bm-subtitle">Verified validation results against gold-standard synthetic and human media datasets</div>
        </div>

        {/* TOP STAT CARDS */}
        <div className="bm-grid-cards">
          {[
            { label: 'Text Classifier', val: '98.4%', sub: '20,000 sample essays' },
            { label: 'Image Detector', val: '96.2%', sub: '10,000 Midjourney/Real' },
            { label: 'Video Analyzer', val: '94.5%', sub: '2,000 deepfake clips' },
            { label: 'Fake News Cross', val: '92.1%', sub: 'Google Fact-Check set' },
          ].map((c, i) => (
            <div key={i} className="bm-stat-card">
              <div className="bm-stat-label">{c.label}</div>
              <div className="bm-stat-val">{c.val}</div>
              <div className="bm-stat-sub">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* INTERACTIVE CHARTS ROW */}
        <div className="bm-main-grid">
          
          {/* ROC Curve Chart */}
          <div className="bm-card">
            <div className="bm-card-title">ROC Curve Performance</div>
            <div className="bm-card-sub">True Positive Rate vs False Positive Rate (Area Under Curve)</div>
            
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={rocData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="fpr" tick={{ fill:'rgba(248,250,255,0.25)', fontSize:11 }} />
                <YAxis tick={{ fill:'rgba(248,250,255,0.25)', fontSize:11 }} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bm-tooltip">
                      <div className="bm-tooltip-title">False Positive Rate: {payload[0].payload.fpr}</div>
                      {payload.map((p, idx) => (
                        <div key={idx} className="bm-tooltip-val" style={{ color: p.color }}>
                          {p.name}: {Math.round(p.value * 100)}%
                        </div>
                      ))}
                    </div>
                  )
                }} />
                <Legend tick={{ fontSize: 12 }} wrapperStyle={{ paddingTop: 10 }} />
                <Line type="monotone" dataKey="Text" stroke="#60a5fa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Image" stroke="#a5b4fc" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Video" stroke="#fbbf24" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Model Accuracy Chart */}
          <div className="bm-card">
            <div className="bm-card-title">Generative Engine Accuracy</div>
            <div className="bm-card-sub">AI Detection rate by generator source model</div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mediaModelData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fill:'rgba(248,250,255,0.25)', fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fill:'rgba(248,250,255,0.25)', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bm-tooltip">
                      <div className="bm-tooltip-title">{payload[0].payload.name}</div>
                      <div className="bm-tooltip-val">Accuracy: {payload[0].value}%</div>
                    </div>
                  )
                }} />
                <Bar dataKey="Accuracy" fill="url(#blueGrad)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* METRICS TABLE CARD */}
        <div className="bm-card" style={{ marginBottom: 24 }}>
          <div className="bm-card-title">Detailed Precision & Recall Statistics</div>
          <div className="bm-card-sub">Strict holdout testing matrix metrics</div>

          <table className="bm-table">
            <thead>
              <tr>
                <th>Classification Medium</th>
                <th>Dataset Source</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1 Score</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Plain Text Detection', set: 'HC3 corpus + Custom LLM text', prec: '98.6%', rec: '98.2%', f1: '98.4%' },
                { name: 'Synthetic Image Vision', set: 'Real Photography vs Midjourney/DALL-E', prec: '95.9%', rec: '96.5%', f1: '96.2%' },
                { name: 'Frame Video Deepfake', set: 'Documentary vs Sora/Runway samples', prec: '93.8%', rec: '95.2%', f1: '94.5%' },
                { name: 'Fake News Claim Cross-match', set: 'PolitiFact + Google Claims corpus', prec: '91.5%', rec: '92.7%', f1: '92.1%' }
              ].map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{row.name}</td>
                  <td>{row.set}</td>
                  <td className="bm-val">{row.prec}</td>
                  <td className="bm-val">{row.rec}</td>
                  <td className="bm-val" style={{ color: '#60a5fa' }}>{row.f1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* DATASET INFORMATION */}
        <div className="bm-card">
          <div className="bm-card-title">Evaluation Dataset Descriptions</div>
          <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.75, marginBottom:16 }}>
            Institutional trust is built on validation transparency. Unveil model performance is verified against curated multi-domain datasets consisting of authentic human content and state-of-the-art synthetic generations.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
            {[
              { title: 'Text Dataset (20,000 samples)', desc: 'Combines the open-source Human ChatGPT Comparison Corpus (HC3) with a proprietary set of 10,000 essays generated by GPT-4o, Claude 3.5 Sonnet, and LLaMA-3.3 Instruct.' },
              { title: 'Vision Image Dataset (10,000 samples)', desc: 'Consists of 5,000 verified authentic DSLR and web photography assets, paired with 5,000 synthetic photorealistic images generated using Midjourney v6, DALL-E 3, and SDXL.' },
              { title: 'Deepfake Video Dataset (2,000 samples)', desc: 'Pairs 1,000 genuine broadcast news and interview clips with 1,000 synthetic videos generated from public Sora demo releases, Runway Gen-2, and high-fidelity video translation models.' }
            ].map((d, idx) => (
              <div key={idx} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:12, padding:16 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:6, color:'#93c5fd' }}>{d.title}</div>
                <p style={{ fontSize:12.5, color:'var(--text2)', lineHeight:1.6 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

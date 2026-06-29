import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#07090f;--text:#f8faff;--text2:rgba(248,250,255,0.5);--text3:rgba(248,250,255,0.25);
  --border:rgba(255,255,255,0.07);--glass:rgba(255,255,255,0.04);--glass2:rgba(255,255,255,0.07);
}
html,body,#root{min-height:100%;}
body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:rgba(59,130,246,0.25);border-radius:100px;}

/* bg */
.lp-bg{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;}
.lp-orb{position:absolute;border-radius:50%;filter:blur(90px);}
.lp-o1{width:700px;height:700px;top:-280px;left:-200px;opacity:.5;
  background:radial-gradient(circle,rgba(59,130,246,0.2) 0%,rgba(99,102,241,0.12) 40%,transparent 70%);}
.lp-o2{width:500px;height:500px;bottom:-180px;right:-120px;opacity:.45;
  background:radial-gradient(circle,rgba(99,102,241,0.15) 0%,rgba(59,130,246,0.08) 40%,transparent 70%);}
.lp-o3{width:350px;height:350px;top:40%;left:55%;opacity:.3;
  background:radial-gradient(circle,rgba(59,130,246,0.1) 0%,transparent 70%);}
.lp-grid{position:absolute;inset:0;
  background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);
  background-size:28px 28px;
  mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%);}

/* nav */
.lp-nav{position:sticky;top:0;z-index:100;padding:0 48px;height:64px;
  display:flex;justify-content:space-between;align-items:center;
  background:rgba(7,9,15,0.75);backdrop-filter:blur(24px);
  border-bottom:1px solid var(--border);}
.lp-logo{font-size:18px;font-weight:900;letter-spacing:3px;cursor:pointer;
  background:linear-gradient(135deg,#f8faff 30%,#93c5fd 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.lp-nav-links{display:flex;gap:4px;}
.lp-nav-link{padding:8px 16px;border-radius:100px;font-size:13.5px;font-weight:500;
  color:var(--text2);cursor:pointer;transition:all .2s;background:transparent;border:none;font-family:'Outfit',sans-serif;}
.lp-nav-link:hover{color:var(--text);background:var(--glass);}
.lp-nav-right{display:flex;align-items:center;gap:8px;}
.lp-btn-ghost{padding:8px 20px;border-radius:100px;font-size:13px;font-weight:600;
  background:var(--glass);border:1px solid var(--border);color:var(--text2);
  cursor:pointer;transition:all .2s;font-family:'Outfit',sans-serif;}
.lp-btn-ghost:hover{background:var(--glass2);color:var(--text);border-color:rgba(255,255,255,0.13);}
.lp-btn-primary{padding:9px 22px;border-radius:100px;font-size:13px;font-weight:700;
  background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;border:none;
  cursor:pointer;transition:all .22s;font-family:'Outfit',sans-serif;
  box-shadow:0 0 20px rgba(59,130,246,0.35),inset 0 1px 0 rgba(255,255,255,0.22);}
.lp-btn-primary:hover{transform:translateY(-1px);box-shadow:0 0 30px rgba(59,130,246,0.5),inset 0 1px 0 rgba(255,255,255,0.25);}

/* hero */
.lp-hero{position:relative;z-index:1;text-align:center;padding:100px 24px 80px;}
.lp-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:100px;
  background:linear-gradient(135deg,rgba(59,130,246,0.12),rgba(99,102,241,0.12));
  border:1px solid rgba(59,130,246,0.22);
  font-size:11px;font-weight:700;letter-spacing:1.5px;color:#93c5fd;text-transform:uppercase;
  margin-bottom:28px;}
.lp-badge-dot{width:6px;height:6px;border-radius:50%;background:#3b82f6;
  box-shadow:0 0 8px rgba(59,130,246,0.8);animation:pulse 2s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(0.8);}}
.lp-h1{font-size:clamp(42px,7vw,80px);font-weight:900;letter-spacing:-3px;line-height:1.05;margin-bottom:24px;}
.lp-h1-white{color:#f8faff;}
.lp-h1-grad{background:linear-gradient(135deg,#60a5fa 0%,#818cf8 50%,#a78bfa 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;display:block;}
.lp-sub{font-size:17px;color:var(--text2);line-height:1.7;max-width:520px;margin:0 auto 40px;}
.lp-hero-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
.lp-hero-btn-primary{padding:14px 32px;border-radius:100px;font-size:15px;font-weight:700;
  background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;border:none;cursor:pointer;
  transition:all .22s;font-family:'Outfit',sans-serif;
  box-shadow:0 0 28px rgba(59,130,246,0.4),inset 0 1px 0 rgba(255,255,255,0.22);}
.lp-hero-btn-primary:hover{transform:translateY(-2px);box-shadow:0 0 40px rgba(59,130,246,0.55),inset 0 1px 0 rgba(255,255,255,0.28);}
.lp-hero-btn-ghost{padding:14px 32px;border-radius:100px;font-size:15px;font-weight:600;
  background:var(--glass);border:1px solid rgba(255,255,255,0.12);color:var(--text);
  cursor:pointer;transition:all .2s;font-family:'Outfit',sans-serif;backdrop-filter:blur(12px);}
.lp-hero-btn-ghost:hover{background:var(--glass2);border-color:rgba(255,255,255,0.18);}

/* stats strip */
.lp-stats{position:relative;z-index:1;display:flex;justify-content:center;gap:0;
  margin:0 auto 80px;max-width:640px;
  background:linear-gradient(145deg,rgba(255,255,255,0.05),rgba(59,130,246,0.02));
  border:1px solid var(--border);border-radius:20px;
  backdrop-filter:blur(20px);overflow:hidden;}
.lp-stat{padding:22px 36px;text-align:center;flex:1;border-right:1px solid var(--border);}
.lp-stat:last-child{border-right:none;}
.lp-stat-num{font-size:26px;font-weight:900;font-family:'JetBrains Mono',monospace;
  background:linear-gradient(135deg,#f8faff,#93c5fd);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.lp-stat-lbl{font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-top:4px;}

/* section */
.lp-section{position:relative;z-index:1;padding:0 24px 80px;max-width:1100px;margin:0 auto;}
.lp-section-label{text-align:center;font-size:11px;font-weight:700;letter-spacing:2px;
  color:#93c5fd;text-transform:uppercase;margin-bottom:14px;}
.lp-section-title{text-align:center;font-size:clamp(28px,4vw,42px);font-weight:800;
  letter-spacing:-1px;margin-bottom:12px;}
.lp-section-title span{background:linear-gradient(135deg,#60a5fa,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.lp-section-sub{text-align:center;font-size:15px;color:var(--text2);max-width:480px;margin:0 auto 52px;line-height:1.7;}

/* feature cards */
.lp-features{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;}
.lp-feat{padding:26px;border-radius:20px;position:relative;overflow:hidden;
  transition:all .25s;cursor:default;
  background:linear-gradient(145deg,rgba(255,255,255,0.05),rgba(59,130,246,0.02),rgba(255,255,255,0.02));
  border:1px solid var(--border);backdrop-filter:blur(20px);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.07),0 4px 24px rgba(0,0,0,0.28);}
.lp-feat::before{content:'';position:absolute;top:0;left:15%;right:15%;height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent);}
.lp-feat:hover{transform:translateY(-4px);border-color:rgba(59,130,246,0.22);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.12),0 16px 40px rgba(59,130,246,0.1);}
.lp-feat-icon{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;
  font-size:20px;margin-bottom:16px;
  background:linear-gradient(135deg,rgba(59,130,246,0.15),rgba(99,102,241,0.12));
  border:1px solid rgba(59,130,246,0.2);}
.lp-feat-title{font-size:15px;font-weight:700;margin-bottom:8px;}
.lp-feat-desc{font-size:13px;color:var(--text2);line-height:1.65;}
.lp-feat-tag{display:inline-flex;margin-top:14px;padding:3px 10px;border-radius:100px;
  font-size:10px;font-weight:700;letter-spacing:0.8px;
  background:rgba(59,130,246,0.12);color:#93c5fd;border:1px solid rgba(59,130,246,0.2);}

/* demo tabs */
.lp-demo{margin-top:16px;
  background:linear-gradient(145deg,rgba(255,255,255,0.05),rgba(59,130,246,0.02));
  border:1px solid var(--border);border-radius:24px;overflow:hidden;backdrop-filter:blur(20px);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.07),0 8px 32px rgba(0,0,0,0.32);}
.lp-demo-tabs{display:flex;border-bottom:1px solid var(--border);padding:6px 6px 0;}
.lp-demo-tab{padding:10px 20px;border-radius:12px 12px 0 0;font-size:13px;font-weight:600;
  cursor:pointer;transition:all .18s;color:var(--text2);border:none;background:transparent;font-family:'Outfit',sans-serif;}
.lp-demo-tab.active{color:var(--text);background:rgba(59,130,246,0.1);border-bottom:2px solid #3b82f6;}
.lp-demo-body{padding:28px;}
.lp-demo-placeholder{background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:14px;padding:20px;
  font-size:13.5px;color:var(--text2);line-height:1.7;}
.lp-demo-result{display:flex;gap:12px;margin-top:16px;}
.lp-demo-badge{padding:6px 16px;border-radius:100px;font-size:12px;font-weight:700;
  font-family:'JetBrains Mono',monospace;}
.lp-badge-ai{background:rgba(244,63,94,0.1);color:#fca5a5;border:1px solid rgba(244,63,94,0.2);}
.lp-badge-conf{background:rgba(59,130,246,0.1);color:#93c5fd;border:1px solid rgba(59,130,246,0.2);}

/* how it works */
.lp-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.lp-step{padding:28px 24px;border-radius:20px;position:relative;
  background:linear-gradient(145deg,rgba(255,255,255,0.05),rgba(59,130,246,0.02));
  border:1px solid var(--border);backdrop-filter:blur(20px);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.07);}
.lp-step-num{font-size:11px;font-weight:700;letter-spacing:1px;color:#93c5fd;
  font-family:'JetBrains Mono',monospace;margin-bottom:16px;}
.lp-step-icon{font-size:28px;margin-bottom:14px;}
.lp-step-title{font-size:16px;font-weight:700;margin-bottom:8px;}
.lp-step-desc{font-size:13px;color:var(--text2);line-height:1.65;}

/* CTA */
.lp-cta{
  position:relative;z-index:1;margin:0 24px 80px;border-radius:28px;
  padding:64px 40px;text-align:center;overflow:hidden;
  background:linear-gradient(145deg,rgba(59,130,246,0.12),rgba(99,102,241,0.08),rgba(255,255,255,0.03));
  border:1px solid rgba(59,130,246,0.2);backdrop-filter:blur(24px);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.1),0 0 80px rgba(59,130,246,0.08);}
.lp-cta::before{content:'';position:absolute;top:0;left:20%;right:20%;height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);}
.lp-cta-title{font-size:clamp(28px,4vw,42px);font-weight:900;letter-spacing:-1px;margin-bottom:14px;}
.lp-cta-title span{background:linear-gradient(135deg,#60a5fa,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.lp-cta-sub{font-size:16px;color:var(--text2);max-width:440px;margin:0 auto 32px;line-height:1.7;}

/* footer */
.lp-footer{position:relative;z-index:1;padding:24px 48px;border-top:1px solid var(--border);
  display:flex;justify-content:space-between;align-items:center;}
.lp-footer-copy{font-size:12px;color:var(--text3);}
.lp-footer-links{display:flex;gap:20px;}
.lp-footer-link{font-size:12px;color:var(--text3);cursor:pointer;transition:color .2s;}
.lp-footer-link:hover{color:var(--text2);}

@media(max-width:768px){
  .lp-nav{padding:0 20px;}
  .lp-nav-links{display:none;}
  .lp-hero{padding:70px 20px 60px;}
  .lp-stats{flex-wrap:wrap;}
  .lp-features{grid-template-columns:1fr;}
  .lp-steps{grid-template-columns:1fr;}
  .lp-cta{margin:0 12px 60px;padding:48px 24px;}
  .lp-footer{flex-direction:column;gap:12px;text-align:center;}
}
`

export default function Landing() {
  const navigate = useNavigate()
  const [demoTab, setDemoTab] = useState('text')

  useEffect(() => {
    const id = 'lp-styles'
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
       el.id = id;
        el.textContent = CSS
      document.head.appendChild(el)
    }
  }, [])

  const features = [
    { icon: '📝', title: 'AI Text Detection', desc: 'Detect GPT-4, Claude, Gemini and any LLM-generated text with phrase-level highlighting.', tag: 'Groq LLaMA 3.3 70B' },
    { icon: '🖼️', title: 'AI Image Analysis', desc: 'Spot Midjourney, DALL-E, Stable Diffusion and other AI-generated images instantly.', tag: 'Sightengine API' },
    { icon: '🎬', title: 'Video Detection', desc: 'Frame-by-frame AI video analysis. Upload files or paste direct video URLs.', tag: 'Groq Vision' },
    { icon: '📰', title: 'Fake News Check', desc: 'Cross-check claims against Google Fact Check and major fact-checking publishers.', tag: 'Google Fact Check' },
  ]

  const steps = [
    { num: '01', icon: '📤', title: 'Submit Content', desc: 'Paste text, upload an image or video, or enter a news claim to verify.' },
    { num: '02', icon: '🧠', title: 'AI Analysis', desc: 'Our multi-model pipeline analyzes patterns, artifacts, and signals of AI generation.' },
    { num: '03', icon: '📊', title: 'Get Results', desc: 'Receive confidence scores, visual breakdowns, and save results to your history.' },
  ]

  const demoTexts = {
    text: 'The integration of artificial intelligence into modern healthcare systems represents a paradigm shift in diagnostic methodologies. Machine learning algorithms demonstrate exceptional capability in pattern recognition across medical imaging datasets...',
    image: 'Upload an image to detect AI-generation artifacts, GAN fingerprints, and diffusion model signatures.',
    news: '"Scientists discover revolutionary battery technology that charges smartphones in 30 seconds using household salt water solution."',
  }

  return (
    <div>
      <div className="lp-bg">
        <div className="lp-orb lp-o1" /><div className="lp-orb lp-o2" /><div className="lp-orb lp-o3" />
        <div className="lp-grid" />
      </div>

      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-logo">UNVEIL</div>
        <div className="lp-nav-links">
          {['Features', 'How It Works', 'FAQs', 'About'].map(l => (
            <button key={l} className="lp-nav-link">{l}</button>
          ))}
        </div>
        <div className="lp-nav-right">
          <button className="lp-btn-ghost" onClick={() => navigate('/login')}>Login</button>
          <button className="lp-btn-primary" onClick={() => navigate('/signup')}>Get Started</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-badge">
          <span className="lp-badge-dot" />
          Advanced AI Content Detection
        </div>
        <h1 className="lp-h1">
          <span className="lp-h1-white">Detect AI-Generated</span>
          <span className="lp-h1-grad">Content Instantly</span>
        </h1>
        <p className="lp-sub">
          Advanced AI-powered detection for fake news, synthetic text, AI images, and deepfake videos — all in one platform.
        </p>
        <div className="lp-hero-btns">
          <button className="lp-hero-btn-primary" onClick={() => navigate('/signup')}>Start Detecting Free →</button>
          <button className="lp-hero-btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </section>

      {/* STATS */}
      <div className="lp-stats">
        {[
          { num: '99%', lbl: 'Detection Accuracy' },
          { num: '4', lbl: 'Content Types' },
          { num: '<2s', lbl: 'Analysis Speed' },
          { num: 'Free', lbl: 'Forever Plan' },
        ].map((s, i) => (
          <div key={i} className="lp-stat">
            <div className="lp-stat-num">{s.num}</div>
            <div className="lp-stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section className="lp-section">
        <div className="lp-section-label">What We Detect</div>
        <h2 className="lp-section-title">One platform for <span>all AI content</span></h2>
        <p className="lp-section-sub">From text to video, Unveil has every type of AI-generated content covered with specialized detection models.</p>
        <div className="lp-features">
          {features.map((f, i) => (
            <div key={i} className="lp-feat">
              <div className="lp-feat-icon">{f.icon}</div>
              <div className="lp-feat-title">{f.title}</div>
              <div className="lp-feat-desc">{f.desc}</div>
              <div className="lp-feat-tag">{f.tag}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO */}
      <section className="lp-section">
        <div className="lp-section-label">Live Demo</div>
        <h2 className="lp-section-title">See it in <span>action</span></h2>
        <p className="lp-section-sub">Watch how Unveil analyzes different types of content in real time.</p>
        <div className="lp-demo">
          <div className="lp-demo-tabs">
            {['text', 'image', 'news'].map(t => (
              <button key={t} className={`lp-demo-tab ${demoTab === t ? 'active' : ''}`}
                onClick={() => setDemoTab(t)}>
                {t === 'text' ? '📝 Text' : t === 'image' ? '🖼️ Image' : '📰 News'}
              </button>
            ))}
          </div>
          <div className="lp-demo-body">
            <div className="lp-demo-placeholder">{demoTexts[demoTab]}</div>
            {demoTab === 'text' && (
              <div className="lp-demo-result">
                <span className="lp-demo-badge lp-badge-ai">🤖 AI Generated</span>
                <span className="lp-demo-badge lp-badge-conf">94% Confidence</span>
              </div>
            )}
            {demoTab === 'news' && (
              <div className="lp-demo-result">
                <span className="lp-demo-badge lp-badge-ai">❌ Likely False</span>
                <span className="lp-demo-badge lp-badge-conf">Credibility: 18%</span>
              </div>
            )}
            {demoTab === 'image' && (
              <div style={{ marginTop: 14 }}>
                <button className="lp-hero-btn-primary" style={{ fontSize: 13, padding: '10px 24px' }}
                  onClick={() => navigate('/signup')}>
                  Try Image Detection →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-section">
        <div className="lp-section-label">How It Works</div>
        <h2 className="lp-section-title">Three steps to <span>truth</span></h2>
        <p className="lp-section-sub">Unveil makes AI content detection simple, fast, and accurate.</p>
        <div className="lp-steps">
          {steps.map((s, i) => (
            <div key={i} className="lp-step">
              <div className="lp-step-num">STEP {s.num}</div>
              <div className="lp-step-icon">{s.icon}</div>
              <div className="lp-step-title">{s.title}</div>
              <div className="lp-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="lp-cta">
        <div className="lp-cta-title">Ready to <span>Unveil the truth?</span></div>
        <p className="lp-cta-sub">Join thousands detecting AI content with Unveil. Free forever, no credit card required.</p>
        <div className="lp-hero-btns">
          <button className="lp-hero-btn-primary" onClick={() => navigate('/signup')}>Create Free Account →</button>
          <button className="lp-hero-btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-copy">© 2025 Unveil · AI Content Detection</div>
        <div className="lp-footer-links">
          {['Privacy', 'Terms', 'Contact', 'GitHub'].map(l => (
            <span key={l} className="lp-footer-link">{l}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}
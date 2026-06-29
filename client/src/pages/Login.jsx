import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

.lgn-root *, .lgn-root *::before, .lgn-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
.lgn-root {
  font-family: 'Outfit', sans-serif;
  background: #07090f;
  color: #f8faff;
  min-height: 100vh;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* background effects */
.lgn-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.lgn-orb1 {
  position: absolute; width: 600px; height: 600px; border-radius: 50%;
  top: -200px; left: -150px; filter: blur(100px); opacity: 0.6;
  background: radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.15) 40%, transparent 70%);
}
.lgn-orb2 {
  position: absolute; width: 400px; height: 400px; border-radius: 50%;
  bottom: -120px; right: -100px; filter: blur(80px); opacity: 0.5;
  background: radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(59,130,246,0.1) 40%, transparent 70%);
}
.lgn-grid {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size: 30px 30px;
  mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%);
}

/* layout */
.lgn-left {
  position: relative; z-index: 1;
  flex: 1; display: flex; flex-direction: column; justify-content: center;
  padding: 60px 72px;
}
.lgn-right {
  position: relative; z-index: 1;
  width: 460px; flex-shrink: 0;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  padding: 60px 52px;
  background: linear-gradient(160deg, rgba(59,130,246,0.09) 0%, rgba(99,102,241,0.07) 50%, rgba(255,255,255,0.03) 100%);
  border-left: 1px solid rgba(255,255,255,0.09);
  backdrop-filter: blur(40px);
}
.lgn-right-shine {
  position: absolute; top: 0; bottom: 0; left: 0; width: 1px;
  background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.18) 60%, transparent 100%);
}

/* logo */
.lgn-logo {
  font-size: 17px; font-weight: 900; letter-spacing: 4px; margin-bottom: 56px;
  background: linear-gradient(135deg, #ffffff 40%, #93c5fd 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  cursor: pointer; width: fit-content;
}

/* headings */
.lgn-title {
  font-size: 42px; font-weight: 900; letter-spacing: -2px; line-height: 1.0; margin-bottom: 12px;
  color: #f8faff;
}
.lgn-title-grad {
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.lgn-sub { font-size: 15px; color: rgba(248,250,255,0.55); margin-bottom: 44px; line-height: 1.6; }

/* fields */
.lgn-field { margin-bottom: 20px; }
.lgn-label {
  display: block; font-size: 12px; font-weight: 700; letter-spacing: 1.2px;
  text-transform: uppercase; color: rgba(248,250,255,0.5); margin-bottom: 9px;
}
.lgn-input-wrap { position: relative; }
.lgn-input {
  width: 100%; padding: 15px 20px; border-radius: 14px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  color: #f8faff; font-size: 15px; font-family: 'Outfit', sans-serif;
  outline: none; transition: all 0.22s;
}
.lgn-input:focus {
  border-color: rgba(99,102,241,0.6);
  background: rgba(99,102,241,0.08);
  box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
}
.lgn-input::placeholder { color: rgba(248,250,255,0.22); }
.lgn-eye {
  position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: rgba(248,250,255,0.3);
  font-size: 17px; padding: 2px; transition: color .2s;
}
.lgn-eye:hover { color: rgba(248,250,255,0.7); }

/* forgot */
.lgn-forgot {
  display: block; text-align: right; font-size: 12.5px;
  color: rgba(248,250,255,0.35); cursor: pointer; margin-top: -12px;
  margin-bottom: 32px; transition: color .2s;
}
.lgn-forgot:hover { color: #93c5fd; }

/* submit btn */
.lgn-submit {
  width: 100%; padding: 15px; border-radius: 14px; font-size: 15.5px; font-weight: 700;
  font-family: 'Outfit', sans-serif; cursor: pointer; border: none; transition: all .25s;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white; margin-bottom: 28px;
  box-shadow: 0 0 28px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.25);
}
.lgn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 44px rgba(99,102,241,0.6), inset 0 1px 0 rgba(255,255,255,0.3);
}
.lgn-submit:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

/* toggle */
.lgn-toggle { text-align: center; font-size: 14px; color: rgba(248,250,255,0.4); }
.lgn-toggle-link { color: #60a5fa; font-weight: 700; cursor: pointer; transition: color .2s; }
.lgn-toggle-link:hover { color: #93c5fd; }

/* error */
.lgn-error {
  display: flex; align-items: center; gap: 10px; padding: 13px 18px;
  background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.22);
  border-radius: 13px; color: #fca5a5; font-size: 13.5px; margin-bottom: 22px;
}

/* right panel */
.lgn-icon-wrap {
  width: 80px; height: 80px; border-radius: 24px; margin: 0 auto 32px;
  background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.18));
  border: 1px solid rgba(99,102,241,0.3);
  display: flex; align-items: center; justify-content: center; font-size: 36px;
  box-shadow: 0 0 40px rgba(99,102,241,0.2);
}
.lgn-panel-title {
  font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 10px; text-align: center;
  color: #f8faff;
}
.lgn-panel-title span {
  background: linear-gradient(135deg, #60a5fa, #818cf8);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.lgn-panel-sub { font-size: 14px; color: rgba(248,250,255,0.45); text-align: center; line-height: 1.7; margin-bottom: 40px; }

.lgn-feat-list { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.lgn-feat-item {
  display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: 16px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
  transition: all .2s;
}
.lgn-feat-item:hover { background: rgba(255,255,255,0.08); border-color: rgba(99,102,241,0.2); }
.lgn-feat-emoji { font-size: 18px; width: 24px; text-align: center; flex-shrink: 0; }
.lgn-feat-name { font-size: 14px; font-weight: 600; color: #f0f4ff; flex: 1; }
.lgn-feat-tick {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2));
  border: 1px solid rgba(99,102,241,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; color: #93c5fd; font-weight: 700;
}

@keyframes lgn-spin { to { transform: rotate(360deg); } }
.lgn-spin {
  display: inline-block; width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
  border-radius: 50%; animation: lgn-spin .7s linear infinite;
}

@media (max-width: 900px) {
  .lgn-right { display: none; }
  .lgn-left { padding: 48px 32px; }
  .lgn-title { font-size: 34px; }
}
`

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = 'lgn-css'
    if (!document.getElementById(id)) {
      const el = document.createElement('style'); el.id = id; el.textContent = CSS
      document.head.appendChild(el)
    }
  }, [])

  const handle = async () => {
    if (!form.email || !form.password) return setError('Please fill in all fields.')
    setLoading(true); setError('')
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.error || 'Invalid email or password.')
    } finally { setLoading(false) }
  }

  const feats = [
    { emoji: '📝', name: 'AI Text Detection' },
    { emoji: '🖼️', name: 'AI Image Analysis' },
    { emoji: '🎬', name: 'Video Detection' },
    { emoji: '📰', name: 'Fake News Check' },
  ]

  return (
    <div className="lgn-root">
      {/* BG */}
      <div className="lgn-bg">
        <div className="lgn-orb1" /><div className="lgn-orb2" /><div className="lgn-grid" />
      </div>

      {/* LEFT — FORM */}
      <div className="lgn-left">
        <div className="lgn-logo" onClick={() => navigate('/')}>UNVEIL</div>

        <div className="lgn-title">
          Welcome <span className="lgn-title-grad">Back</span>
        </div>
        <div className="lgn-sub">Sign in to continue detecting AI-generated content</div>

        {error && <div className="lgn-error">⚠️ {error}</div>}

        <div className="lgn-field">
          <label className="lgn-label">Email Address</label>
          <input className="lgn-input" type="email" placeholder="you@example.com"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handle()} />
        </div>

        <div className="lgn-field">
          <label className="lgn-label">Password</label>
          <div className="lgn-input-wrap">
            <input className="lgn-input" type={showPw ? 'text' : 'password'} placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handle()}
              style={{ paddingRight: 48 }} />
            <button className="lgn-eye" onClick={() => setShowPw(p => !p)}>{showPw ? '🙈' : '👁️'}</button>
          </div>
        </div>

        <span className="lgn-forgot">Forgot password?</span>

        <button className="lgn-submit" disabled={loading} onClick={handle}>
          {loading ? <span className="lgn-spin" /> : 'Sign In →'}
        </button>

        <div className="lgn-toggle">
          Don't have an account?{' '}
          <span className="lgn-toggle-link" onClick={() => navigate('/signup')}>Sign up free</span>
        </div>
      </div>

      {/* RIGHT — PANEL */}
      <div className="lgn-right">
        <div className="lgn-right-shine" />
        <div className="lgn-icon-wrap">🔍</div>
        <div className="lgn-panel-title">Detect <span>AI Content</span></div>
        <div className="lgn-panel-sub">
          Advanced detection for text, images, and video — powered by cutting-edge AI models
        </div>
        <div className="lgn-feat-list">
          {feats.map((f, i) => (
            <div key={i} className="lgn-feat-item">
              <span className="lgn-feat-emoji">{f.emoji}</span>
              <span className="lgn-feat-name">{f.name}</span>
              <div className="lgn-feat-tick">✓</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
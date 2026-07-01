import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

.sgn-root *, .sgn-root *::before, .sgn-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
.sgn-root {
  font-family: 'Outfit', sans-serif;
  background: #07090f;
  color: #f8faff;
  min-height: 100vh;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* background */
.sgn-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.sgn-orb1 {
  position: absolute; width: 600px; height: 600px; border-radius: 50%;
  top: -200px; right: -150px; filter: blur(100px); opacity: 0.6;
  background: radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(59,130,246,0.13) 40%, transparent 70%);
}
.sgn-orb2 {
  position: absolute; width: 400px; height: 400px; border-radius: 50%;
  bottom: -120px; left: -100px; filter: blur(80px); opacity: 0.5;
  background: radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(99,102,241,0.08) 40%, transparent 70%);
}
.sgn-grid {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size: 30px 30px;
  mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%);
}

/* layout */
.sgn-side {
  position: relative; z-index: 1;
  width: 440px; flex-shrink: 0;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  padding: 60px 48px;
  background: linear-gradient(160deg, rgba(99,102,241,0.09) 0%, rgba(59,130,246,0.07) 50%, rgba(255,255,255,0.03) 100%);
  border-right: 1px solid rgba(255,255,255,0.09);
  backdrop-filter: blur(40px);
  text-align: center;
}
.sgn-side-shine {
  position: absolute; top: 0; bottom: 0; right: 0; width: 1px;
  background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.16) 40%, rgba(255,255,255,0.16) 60%, transparent 100%);
}
.sgn-main {
  position: relative; z-index: 1;
  flex: 1; display: flex; flex-direction: column; justify-content: center;
  padding: 60px 72px; overflow-y: auto;
}

/* side content */
.sgn-side-icon {
  width: 80px; height: 80px; border-radius: 24px; margin: 0 auto 30px;
  background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.18));
  border: 1px solid rgba(99,102,241,0.3);
  display: flex; align-items: center; justify-content: center; font-size: 36px;
  box-shadow: 0 0 40px rgba(59,130,246,0.2);
}
.sgn-side-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 10px; color: #f8faff; }
.sgn-side-title span {
  background: linear-gradient(135deg, #60a5fa, #818cf8);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.sgn-side-sub { font-size: 14px; color: rgba(248,250,255,0.45); line-height: 1.7; margin-bottom: 38px; }

.sgn-perk-list { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.sgn-perk-item {
  display: flex; align-items: center; gap: 12px; padding: 13px 16px; border-radius: 15px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
  text-align: left; transition: all .2s;
}
.sgn-perk-item:hover { background: rgba(255,255,255,0.08); border-color: rgba(99,102,241,0.22); }
.sgn-perk-tick {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2));
  border: 1px solid rgba(99,102,241,0.32);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; color: #93c5fd; font-weight: 700;
}
.sgn-perk-text { font-size: 13.5px; font-weight: 500; color: rgba(248,250,255,0.75); }

/* form */
.sgn-logo {
  font-size: 17px; font-weight: 900; letter-spacing: 4px; margin-bottom: 44px;
  background: linear-gradient(135deg, #ffffff 40%, #93c5fd 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  cursor: pointer; width: fit-content;
}
.sgn-title { font-size: 38px; font-weight: 900; letter-spacing: -1.8px; margin-bottom: 10px; color: #f8faff; }
.sgn-title span {
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.sgn-sub { font-size: 15px; color: rgba(248,250,255,0.5); margin-bottom: 36px; line-height: 1.6; }

.sgn-field { margin-bottom: 18px; }
.sgn-label {
  display: block; font-size: 12px; font-weight: 700; letter-spacing: 1.2px;
  text-transform: uppercase; color: rgba(248,250,255,0.5); margin-bottom: 9px;
}
.sgn-input-wrap { position: relative; }
.sgn-input {
  width: 100%; padding: 15px 20px; border-radius: 14px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  color: #f8faff; font-size: 15px; font-family: 'Outfit', sans-serif;
  outline: none; transition: all 0.22s;
}
.sgn-input:focus {
  border-color: rgba(99,102,241,0.6);
  background: rgba(99,102,241,0.08);
  box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
}
.sgn-input::placeholder { color: rgba(248,250,255,0.22); }
.sgn-eye {
  position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: rgba(248,250,255,0.3);
  font-size: 17px; padding: 2px; transition: color .2s;
}
.sgn-eye:hover { color: rgba(248,250,255,0.7); }

/* strength bar */
.sgn-strength { margin-top: 8px; }
.sgn-strength-track { height: 4px; background: rgba(255,255,255,0.07); border-radius: 100px; overflow: hidden; }
.sgn-strength-fill { height: 100%; border-radius: 100px; transition: all .35s; }
.sgn-strength-label { font-size: 11.5px; margin-top: 5px; font-weight: 600; }

/* terms */
.sgn-terms { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 28px; cursor: pointer; margin-top: 4px; }
.sgn-checkbox {
  width: 20px; height: 20px; border-radius: 7px; flex-shrink: 0; margin-top: 1px;
  border: 1.5px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.05);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all .22s;
}
.sgn-checkbox.on { background: linear-gradient(135deg, #3b82f6, #6366f1); border-color: transparent; }
.sgn-checkbox.on::after { content: '✓'; color: white; font-size: 11px; font-weight: 800; }
.sgn-terms-text { font-size: 13px; color: rgba(248,250,255,0.45); line-height: 1.6; }
.sgn-terms-link { color: #60a5fa; }

/* submit */
.sgn-submit {
  width: 100%; padding: 15px; border-radius: 14px; font-size: 15.5px; font-weight: 700;
  font-family: 'Outfit', sans-serif; cursor: pointer; border: none; transition: all .25s;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white; margin-bottom: 26px;
  box-shadow: 0 0 28px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.25);
}
.sgn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 44px rgba(99,102,241,0.6), inset 0 1px 0 rgba(255,255,255,0.3);
}
.sgn-submit:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

.sgn-toggle { text-align: center; font-size: 14px; color: rgba(248,250,255,0.4); }
.sgn-toggle-link { color: #60a5fa; font-weight: 700; cursor: pointer; transition: color .2s; }
.sgn-toggle-link:hover { color: #93c5fd; }

.sgn-error {
  display: flex; align-items: center; gap: 10px; padding: 13px 18px;
  background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.22);
  border-radius: 13px; color: #fca5a5; font-size: 13.5px; margin-bottom: 22px;
}

@keyframes sgn-spin { to { transform: rotate(360deg); } }
.sgn-spin {
  display: inline-block; width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
  border-radius: 50%; animation: sgn-spin .7s linear infinite;
}

@media (max-width: 900px) {
  .sgn-side { display: none; }
  .sgn-main { padding: 48px 32px; }
  .sgn-title { font-size: 32px; }
}
`

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = 'sgn-css'
    if (!document.getElementById(id)) {
      const el = document.createElement('style'); el.id = id; el.textContent = CSS
      document.head.appendChild(el)
    }
  }, [])

  const pwStrength = pw => {
    if (!pw) return null
    if (pw.length < 6) return { w: 22, color: '#f43f5e', label: 'Too short' }
    if (pw.length < 8) return { w: 48, color: '#f59e0b', label: 'Weak' }
    if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { w: 74, color: '#3b82f6', label: 'Good' }
    return { w: 100, color: '#22c55e', label: 'Strong' }
  }
  const strength = pwStrength(form.password)

  const handle = async () => {
    if (!form.name || !form.email || !form.password) return setError('Please fill in all fields.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (!agreed) return setError('Please accept the terms to continue.')
    setLoading(true); setError('')
    try {
      await signup(form.name, form.email, form.password)
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create account.')
    } finally { setLoading(false) }
  }

  const perks = ['Free forever plan', 'Text & Image detection', 'Video analysis', 'Scan history dashboard', 'Powered by Groq AI']

  return (
    <div className="sgn-root">
      <div className="sgn-bg">
        <div className="sgn-orb1" /><div className="sgn-orb2" /><div className="sgn-grid" />
      </div>

      {/* SIDE */}
      <div className="sgn-side">
        <div className="sgn-side-shine" />
        <div className="sgn-side-icon">🛡️</div>
        <div className="sgn-side-title">Join <span>Unveil</span> Today</div>
        <div className="sgn-side-sub">Start detecting AI-generated content with confidence — free forever</div>
        <div className="sgn-perk-list">
          {perks.map((p, i) => (
            <div key={i} className="sgn-perk-item">
              <div className="sgn-perk-tick">✓</div>
              <span className="sgn-perk-text">{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div className="sgn-main">
        <div className="sgn-logo" onClick={() => navigate('/')}>UNVEIL</div>

        <div className="sgn-title">Create <span>Account</span></div>
        <div className="sgn-sub">Start detecting AI content for free. No credit card required.</div>

        {error && <div className="sgn-error">⚠️ {error}</div>}

        <div className="sgn-field">
          <label className="sgn-label">Full Name</label>
          <input className="sgn-input" type="text" placeholder="Joyesh Kaushik"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>

        <div className="sgn-field">
          <label className="sgn-label">Email Address</label>
          <input className="sgn-input" type="email" placeholder="you@example.com"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>

        <div className="sgn-field">
          <label className="sgn-label">Password</label>
          <div className="sgn-input-wrap">
            <input className="sgn-input" type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              style={{ paddingRight: 48 }} />
            <button className="sgn-eye" onClick={() => setShowPw(p => !p)}>{showPw ? '🙈' : '👁️'}</button>
          </div>
          {strength && (
            <div className="sgn-strength">
              <div className="sgn-strength-track">
                <div className="sgn-strength-fill" style={{ width: `${strength.w}%`, background: strength.color }} />
              </div>
              <div className="sgn-strength-label" style={{ color: strength.color }}>{strength.label}</div>
            </div>
          )}
        </div>

        <div className="sgn-terms" onClick={() => setAgreed(a => !a)}>
          <div className={`sgn-checkbox ${agreed ? 'on' : ''}`} />
          <span className="sgn-terms-text">
            I agree to the <span className="sgn-terms-link">Terms of Service</span> and <span className="sgn-terms-link">Privacy Policy</span>
          </span>
        </div>

        <button className="sgn-submit" disabled={loading} onClick={handle}>
          {loading ? <span className="sgn-spin" /> : 'Create Account →'}
        </button>

        <div className="sgn-toggle">
          Already have an account?{' '}
          <span className="sgn-toggle-link" onClick={() => navigate('/login')}>Sign in</span>
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

/* ── tiny CSS injected once ── */
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
    --blue: #3b82f6;
    --indigo: #6366f1;
  }

  html, body, #root { height: 100%; }
  body { font-family: 'Outfit', sans-serif; background: var(--bg); color: var(--text); overflow-x: hidden; }

  /* scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.25); border-radius: 100px; }

  /* background orbs */
  .uv-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
  .uv-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.55; }
  .uv-o1 { width: 650px; height: 650px; top: -250px; left: -180px;
    background: radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(99,102,241,0.1) 40%, transparent 70%); }
  .uv-o2 { width: 450px; height: 450px; bottom: -150px; right: -100px;
    background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.07) 40%, transparent 70%); }
  .uv-o3 { width: 300px; height: 300px; top: 45%; left: 42%;
    background: radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%); }
  .uv-grid {
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
  }

  /* layout */
  .uv-layout { position: relative; z-index: 1; display: flex; height: 100vh; overflow: hidden; }

  /* sidebar */
  .uv-sidebar {
    width: 220px; flex-shrink: 0; padding: 24px 14px;
    display: flex; flex-direction: column;
    background: linear-gradient(180deg, rgba(59,130,246,0.04) 0%, rgba(255,255,255,0.02) 60%, rgba(99,102,241,0.03) 100%);
    backdrop-filter: blur(32px);
    border-right: 1px solid var(--border);
    overflow-y: auto;
  }
  .uv-logo-block { padding: 4px 10px 20px; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
  .uv-logo {
    font-size: 18px; font-weight: 900; letter-spacing: 3px;
    background: linear-gradient(135deg, #f8faff 30%, #93c5fd 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .uv-logo-tag {
    display: inline-flex; align-items: center; margin-top: 6px;
    padding: 3px 10px; border-radius: 100px;
    background: linear-gradient(135deg, rgba(59,130,246,0.18), rgba(99,102,241,0.18));
    border: 1px solid rgba(59,130,246,0.22);
    font-size: 9px; font-weight: 700; letter-spacing: 1.5px; color: #93c5fd; text-transform: uppercase;
  }
  .uv-nav-section { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: var(--text3); padding: 10px 10px 5px; text-transform: uppercase; }
  .uv-nav-item {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 12px; border-radius: 100px;
    font-size: 13.5px; font-weight: 500; color: var(--text2);
    cursor: pointer; transition: all 0.2s; border: 1px solid transparent; margin-bottom: 1px;
  }
  .uv-nav-item:hover { background: var(--glass2); color: var(--text); border-color: var(--border); box-shadow: inset 0 1px 0 rgba(255,255,255,0.07); }
  .uv-nav-item.active {
    background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1));
    border-color: rgba(59,130,246,0.22); color: var(--text);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 14px rgba(59,130,246,0.15);
  }
  .uv-nav-icon { font-size: 14px; width: 18px; text-align: center; opacity: 0.75; }
  .uv-nav-count {
    margin-left: auto; padding: 2px 8px; border-radius: 100px;
    font-size: 10px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
    background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2));
    color: #93c5fd; border: 1px solid rgba(59,130,246,0.15);
  }
  .uv-sep { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent); margin: 10px 0; }
  .uv-sidebar-bottom { margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border); }
  .uv-user-pill {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 100px;
    background: var(--glass); border: 1px solid var(--border); cursor: pointer; transition: all 0.2s;
  }
  .uv-user-pill:hover { background: var(--glass2); border-color: var(--border-b); box-shadow: inset 0 1px 0 rgba(255,255,255,0.07); }
  .uv-av {
    width: 30px; height: 30px; border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #818cf8);
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 13px; flex-shrink: 0; color: white;
    box-shadow: 0 0 14px rgba(59,130,246,0.4);
  }

  /* main */
  .uv-main { flex: 1; overflow-y: auto; padding: 32px 36px; }

  /* topbar */
  .uv-topbar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; }
  .uv-page-title { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
  .uv-page-title span { background: linear-gradient(90deg, #60a5fa, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .uv-page-sub { font-size: 13px; color: var(--text3); margin-top: 5px; }
  .uv-top-actions { display: flex; align-items: center; gap: 8px; }

  /* buttons */
  .uv-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 18px; border-radius: 100px;
    font-size: 13px; font-weight: 600; font-family: 'Outfit', sans-serif;
    cursor: pointer; transition: all 0.2s; border: none;
  }
  .uv-btn-ghost { background: var(--glass); border: 1px solid var(--border); color: var(--text2); }
  .uv-btn-ghost:hover { background: var(--glass2); color: var(--text); border-color: var(--border-b); }
  .uv-btn-primary {
    background: linear-gradient(135deg, #3b82f6, #6366f1); color: white;
    box-shadow: 0 0 22px rgba(59,130,246,0.38), inset 0 1px 0 rgba(255,255,255,0.22);
  }
  .uv-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 0 32px rgba(59,130,246,0.52), inset 0 1px 0 rgba(255,255,255,0.25); }

  /* card base */
  .uv-card {
    backdrop-filter: blur(28px); border-radius: 20px; position: relative; overflow: hidden;
    transition: all 0.25s;
  }
  .uv-card::before {
    content: ''; position: absolute; top: 0; left: 15%; right: 15%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  }
  .uv-card::after {
    content: ''; position: absolute; bottom: 0; left: 20%; right: 20%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59,130,246,0.12), transparent);
  }

  /* stat cards */
  .uv-stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 16px; }
  .uv-stat { padding: 20px 22px; }

  .sc-blue { background: linear-gradient(145deg, rgba(59,130,246,0.13), rgba(99,102,241,0.06), rgba(255,255,255,0.02)); border: 1px solid rgba(59,130,246,0.18); box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 24px rgba(59,130,246,0.08); }
  .sc-red  { background: linear-gradient(145deg, rgba(244,63,94,0.11), rgba(239,68,68,0.05), rgba(255,255,255,0.02)); border: 1px solid rgba(244,63,94,0.16); box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 24px rgba(244,63,94,0.06); }
  .sc-grn  { background: linear-gradient(145deg, rgba(34,197,94,0.1), rgba(16,185,129,0.05), rgba(255,255,255,0.02)); border: 1px solid rgba(34,197,94,0.16); box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 24px rgba(34,197,94,0.06); }
  .sc-amb  { background: linear-gradient(145deg, rgba(251,191,36,0.1), rgba(245,158,11,0.05), rgba(255,255,255,0.02)); border: 1px solid rgba(251,191,36,0.16); box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 24px rgba(251,191,36,0.05); }

  .sc-blue:hover { background: linear-gradient(145deg,rgba(59,130,246,0.2),rgba(99,102,241,0.1),rgba(255,255,255,0.03)); border-color: rgba(59,130,246,0.3); box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 36px rgba(59,130,246,0.14); transform: translateY(-3px); }
  .sc-red:hover  { background: linear-gradient(145deg,rgba(244,63,94,0.17),rgba(239,68,68,0.08),rgba(255,255,255,0.03)); border-color: rgba(244,63,94,0.26); box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 36px rgba(244,63,94,0.1); transform: translateY(-3px); }
  .sc-grn:hover  { background: linear-gradient(145deg,rgba(34,197,94,0.16),rgba(16,185,129,0.08),rgba(255,255,255,0.03)); border-color: rgba(34,197,94,0.26); box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 36px rgba(34,197,94,0.1); transform: translateY(-3px); }
  .sc-amb:hover  { background: linear-gradient(145deg,rgba(251,191,36,0.16),rgba(245,158,11,0.08),rgba(255,255,255,0.03)); border-color: rgba(251,191,36,0.24); box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 36px rgba(251,191,36,0.08); transform: translateY(-3px); }

  .uv-stat-label { font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--text3); margin-bottom: 10px; }
  .uv-stat-val { font-size: 36px; font-weight: 900; letter-spacing: -2px; line-height: 1; margin-bottom: 10px; }
  .sc-blue .uv-stat-val { background: linear-gradient(135deg,#fff 60%,#93c5fd); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .sc-red  .uv-stat-val { background: linear-gradient(135deg,#fff 60%,#fca5a5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .sc-grn  .uv-stat-val { background: linear-gradient(135deg,#fff 60%,#86efac); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .sc-amb  .uv-stat-val { background: linear-gradient(135deg,#fff 60%,#fde68a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

  .uv-stat-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
  .pb { background: linear-gradient(135deg,rgba(59,130,246,0.16),rgba(99,102,241,0.16)); color:#93c5fd; border:1px solid rgba(59,130,246,0.2); }
  .pr { background: rgba(244,63,94,0.1); color:#fca5a5; border:1px solid rgba(244,63,94,0.18); }
  .pg { background: rgba(34,197,94,0.1); color:#86efac; border:1px solid rgba(34,197,94,0.18); }
  .pw { background: rgba(255,255,255,0.06); color:var(--text2); border:1px solid rgba(255,255,255,0.1); }

  /* neutral card */
  .card-n {
    background: linear-gradient(145deg, rgba(255,255,255,0.05), rgba(59,130,246,0.03), rgba(255,255,255,0.02));
    border: 1px solid var(--border);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 24px rgba(0,0,0,0.28);
  }
  .card-n:hover {
    background: linear-gradient(145deg, rgba(255,255,255,0.075), rgba(59,130,246,0.05), rgba(255,255,255,0.03));
    border-color: rgba(255,255,255,0.12);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 36px rgba(0,0,0,0.36);
    transform: translateY(-3px);
  }

  /* mid row */
  .uv-mid-row { display: grid; grid-template-columns: 1.55fr 1fr; gap: 12px; margin-bottom: 16px; }
  .uv-cpad { padding: 22px 24px; }
  .uv-ct { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
  .uv-cs { font-size: 11.5px; color: var(--text3); margin-bottom: 18px; }

  /* bottom row */
  .uv-bot-row { display: grid; grid-template-columns: 1.5fr 0.5fr; gap: 12px; }

  /* scan rows */
  .uv-scan-row {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 10px; margin: 0 -10px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    border-radius: 12px; transition: all 0.18s; cursor: pointer;
  }
  .uv-scan-row:last-child { border-bottom: none; }
  .uv-scan-row:hover {
    background: linear-gradient(90deg, rgba(59,130,246,0.07), rgba(99,102,241,0.04), transparent);
    border-bottom-color: transparent;
    box-shadow: inset 2px 0 0 rgba(59,130,246,0.5);
  }
  .uv-s-ico {
    width: 36px; height: 36px; border-radius: 100px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0; transition: all 0.18s;
  }
  .uv-scan-row:hover .uv-s-ico { background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.1)); border-color: rgba(59,130,246,0.22); }
  .uv-s-title { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .uv-s-meta { font-size: 10.5px; color: var(--text3); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
  .uv-r-tag { flex-shrink: 0; padding: 4px 11px; border-radius: 100px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
  .rt-ai { background: rgba(244,63,94,0.09); border: 1px solid rgba(244,63,94,0.18); color: #fca5a5; }
  .rt-hu { background: rgba(34,197,94,0.09); border: 1px solid rgba(34,197,94,0.18); color: #86efac; }
  .uv-s-pct { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text3); width: 34px; text-align: right; flex-shrink: 0; }

  /* quick detect */
  .uv-qd-item {
    display: flex; align-items: center; gap: 11px;
    padding: 12px 14px; border-radius: 100px;
    background: var(--glass); border: 1px solid var(--border);
    cursor: pointer; transition: all 0.2s; margin-bottom: 8px;
  }
  .uv-qd-item:last-child { margin-bottom: 0; }
  .uv-qd-item:hover {
    background: linear-gradient(90deg, rgba(59,130,246,0.1), rgba(99,102,241,0.07));
    border-color: rgba(59,130,246,0.25); transform: translateX(4px);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), -3px 0 0 rgba(59,130,246,0.45);
  }
  .uv-qd-arr { margin-left: auto; color: var(--text3); font-size: 14px; transition: all 0.2s; }
  .uv-qd-item:hover .uv-qd-arr { color: #93c5fd; transform: translateX(2px); }

  .uv-count-badge {
    padding: 4px 12px; border-radius: 100px;
    background: linear-gradient(135deg, rgba(59,130,246,0.14), rgba(99,102,241,0.14));
    border: 1px solid rgba(59,130,246,0.2);
    font-size: 12px; font-weight: 700; color: #93c5fd;
    font-family: 'JetBrains Mono', monospace;
  }

  /* modal */
  .uv-modal-bg {
    position: fixed; inset: 0; background: rgba(0,0,0,0.65);
    backdrop-filter: blur(8px); z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }
  .uv-modal {
    background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(59,130,246,0.04), rgba(255,255,255,0.03));
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 24px; padding: 32px; width: 100%; max-width: 500px;
    position: relative; max-height: 80vh; overflow-y: auto;
    backdrop-filter: blur(32px);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 64px rgba(0,0,0,0.5);
  }
  .uv-modal-close {
    position: absolute; top: 16px; right: 16px;
    background: var(--glass); border: 1px solid var(--border);
    border-radius: 100px; width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    color: var(--text3); cursor: pointer; font-size: 14px; transition: all 0.2s;
  }
  .uv-modal-close:hover { background: var(--glass2); color: var(--text); }
  .uv-modal-title {
    font-size: 20px; font-weight: 800; letter-spacing: -0.3px; margin-bottom: 4px;
    background: linear-gradient(135deg, #f8faff 50%, #93c5fd);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .uv-modal-sub { font-size: 13px; color: var(--text3); margin-bottom: 24px; }

  /* toggle */
  .uv-toggle {
    width: 42px; height: 23px; border-radius: 100px; cursor: pointer;
    position: relative; transition: all 0.3s; flex-shrink: 0;
  }
  .uv-toggle-dot {
    position: absolute; top: 3px; width: 17px; height: 17px;
    border-radius: 50%; background: white; transition: left 0.3s;
  }

  /* input */
  .uv-input {
    width: 100%; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
    padding: 12px 16px; color: var(--text); font-size: 14px;
    font-family: 'Outfit', sans-serif; outline: none;
    transition: border-color 0.2s; box-sizing: border-box;
  }
  .uv-input:focus { border-color: rgba(59,130,246,0.45); }

  /* profile dropdown */
  .uv-profile-drop {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(59,130,246,0.03));
    border: 1px solid rgba(255,255,255,0.12); border-radius: 16px;
    padding: 8px; min-width: 210px; z-index: 200;
    backdrop-filter: blur(32px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
  }
  .uv-drop-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 14px; border-radius: 100px;
    cursor: pointer; color: var(--text2); font-size: 13.5px;
    transition: all 0.15s;
  }
  .uv-drop-item:hover { background: var(--glass2); color: var(--text); }
  .uv-drop-item.danger { color: #fca5a5; }
  .uv-drop-item.danger:hover { background: rgba(244,63,94,0.1); }

  /* Recharts custom tooltip */
  .uv-tooltip {
    background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(59,130,246,0.05)) !important;
    border: 1px solid rgba(255,255,255,0.12) !important;
    border-radius: 12px !important; color: #f8faff !important;
    font-family: 'Outfit', sans-serif !important;
    backdrop-filter: blur(20px);
  }
`

/* ── Modal helpers ── */
const Modal = ({ onClose, children }) => (
  <div className="uv-modal-bg" onClick={onClose}>
    <div className="uv-modal" onClick={e => e.stopPropagation()}>
      <div className="uv-modal-close" onClick={onClose}>✕</div>
      {children}
    </div>
  </div>
)

const ModalRow = ({ label, desc, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
    <div>
      <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{label}</div>
      {desc && <div style={{ color: 'var(--text3)', fontSize: 12 }}>{desc}</div>}
    </div>
    {children}
  </div>
)

const HowItWorksModal = ({ onClose }) => (
  <Modal onClose={onClose}>
    <div className="uv-modal-title">How Unveil Works</div>
    <div className="uv-modal-sub">3-step AI content detection</div>
    {[
      { step: '01', title: 'Submit Content', desc: 'Paste text, upload an image, video, or enter a news claim.', icon: '📤' },
      { step: '02', title: 'AI Analysis', desc: 'Groq LLaMA for text, Sightengine for images/video, Google Fact Check for news.', icon: '🧠' },
      { step: '03', title: 'Get Results', desc: 'Receive confidence scores, analysis breakdown, and save to history.', icon: '📊' },
    ].map((s, i) => (
      <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16, padding: 16, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14 }}>
        <div style={{ fontSize: 26 }}>{s.icon}</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>STEP {s.step}</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{s.title}</span>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>{s.desc}</p>
        </div>
      </div>
    ))}
    <div style={{ padding: 14, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.14)', borderRadius: 12, marginTop: 4 }}>
      <p style={{ color: '#93c5fd', fontSize: 12, fontWeight: 700, marginBottom: 4, letterSpacing: 0.5 }}>DETECTION TECH</p>
      <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>Text: Groq LLaMA 3.3 70B · Images: Sightengine GenAI · Video: Frame extraction · News: Google Fact Check</p>
    </div>
  </Modal>
)

const AboutModal = ({ onClose }) => (
  <Modal onClose={onClose}>
    <div className="uv-modal-title">About Unveil</div>
    <div className="uv-modal-sub">Built for the age of synthetic media</div>
    <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>
      Unveil is an AI content detection platform that helps identify AI-generated text, images, videos, and fake news. As AI-generated content becomes increasingly realistic, verifying authenticity is more critical than ever.
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {[
        { label: 'Frontend', value: 'React + Vite + Tailwind' },
        { label: 'Backend', value: 'Node.js + Express' },
        { label: 'Database', value: 'Supabase (PostgreSQL)' },
        { label: 'AI Engine', value: 'Groq + Sightengine' },
      ].map((t, i) => (
        <div key={i} style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ color: 'var(--text3)', fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{t.label}</div>
          <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{t.value}</div>
        </div>
      ))}
    </div>
  </Modal>
)

const ProfileModal = ({ user, onClose }) => {
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [saved, setSaved] = useState(false)
  return (
    <Modal onClose={onClose}>
      <div className="uv-modal-title">Edit Profile</div>
      <div className="uv-modal-sub">Update your account details</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: 16, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14 }}>
        <div className="uv-av" style={{ width: 48, height: 48, fontSize: 18 }}>{user?.name?.charAt(0)?.toUpperCase()}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.name}</div>
          <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>{user?.email}</div>
        </div>
      </div>
      {[{ key: 'name', label: 'Full Name', type: 'text' }, { key: 'email', label: 'Email', type: 'email' }].map(f => (
        <div key={f.key} style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', color: 'var(--text3)', fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>{f.label}</label>
          <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="uv-input" />
        </div>
      ))}
      {saved && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '10px 14px', color: '#86efac', fontSize: 13, marginBottom: 14 }}>✓ Profile updated!</div>}
      <button onClick={() => setSaved(true)} className="uv-btn uv-btn-primary" style={{ width: '100%', justifyContent: 'center', borderRadius: 12, padding: '12px' }}>
        Save Changes
      </button>
    </Modal>
  )
}

const SettingsModal = ({ onClose }) => {
  const [s, setS] = useState({ notifications: true, saveHistory: true, darkMode: true, autoAnalyze: false })
  return (
    <Modal onClose={onClose}>
      <div className="uv-modal-title">Settings</div>
      <div className="uv-modal-sub">Manage your preferences</div>
      {[
        { key: 'notifications', label: 'Email Notifications', desc: 'Receive scan summaries via email' },
        { key: 'saveHistory', label: 'Save Scan History', desc: 'Auto-save all scan results' },
        { key: 'darkMode', label: 'Dark Mode', desc: 'Use dark theme (recommended)' },
        { key: 'autoAnalyze', label: 'Auto Analyze', desc: 'Start analysis after upload' },
      ].map(item => (
        <ModalRow key={item.key} label={item.label} desc={item.desc}>
          <div className="uv-toggle"
            onClick={() => setS({ ...s, [item.key]: !s[item.key] })}
            style={{ background: s[item.key] ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'rgba(255,255,255,0.1)' }}>
            <div className="uv-toggle-dot" style={{ left: s[item.key] ? '22px' : '3px' }} />
          </div>
        </ModalRow>
      ))}
      <div style={{ marginTop: 20, padding: 14, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.14)', borderRadius: 12 }}>
        <div style={{ color: '#fca5a5', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Danger Zone</div>
        <div style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 10 }}>These actions cannot be undone</div>
        <button style={{ background: 'transparent', border: '1px solid rgba(244,63,94,0.35)', borderRadius: 100, padding: '7px 16px', color: '#fca5a5', fontSize: 12, cursor: 'pointer' }}>
          Clear All Scan History
        </button>
      </div>
    </Modal>
  )
}

const NotificationsModal = ({ onClose }) => (
  <Modal onClose={onClose}>
    <div className="uv-modal-title">Notifications</div>
    <div className="uv-modal-sub">Your alerts and updates</div>
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 14 }}>🔔</div>
      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No notifications yet</p>
      <p style={{ color: 'var(--text3)', fontSize: 13 }}>Scan results and updates will appear here</p>
    </div>
  </Modal>
)

/* ── Custom Tooltip for Recharts ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(7,9,15,0.9)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: '8px 14px', fontFamily: 'Outfit, sans-serif' }}>
      <p style={{ color: 'rgba(248,250,255,0.5)', fontSize: 11, marginBottom: 2 }}>{label}</p>
      <p style={{ color: '#93c5fd', fontSize: 14, fontWeight: 700 }}>{payload[0].value} scans</p>
    </div>
  )
}

/* ══════════ MAIN DASHBOARD ══════════ */
export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [activeNav, setActiveNav] = useState('dashboard')
  const profileRef = useRef(null)

  /* inject CSS once */
  useEffect(() => {
    const id = 'uv-styles'
    if (!document.getElementById(id)) {
      const el = document.createElement('style')
      el.id = id; el.textContent = CSS
      document.head.appendChild(el)
    }
  }, [])

  useEffect(() => {
    api.get('/detect/history')
      .then(res => setHistory(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handler = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* stats */
  const stats = {
    total: history.length,
    ai: history.filter(s => s.result === 'ai').length,
    human: history.filter(s => s.result === 'human').length,
    avgConf: history.length
      ? Math.round(history.reduce((a, s) => a + (s.confidence || 0), 0) / history.length * 100)
      : 0,
  }

  /* chart data — last 7 days */
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      scans: history.filter(s => new Date(s.created_at).toDateString() === d.toDateString()).length
    }
  })

  const aiRate = stats.total ? Math.round((stats.ai / stats.total) * 100) : 0
  const todayCount = history.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length

  const typeIcon = t => t === 'image' ? '🖼️' : t === 'video' ? '🎬' : t === 'news' ? '📰' : '📝'
  const fmtDate = d => {
    const dt = new Date(d)
    return `${dt.getMonth() + 1}/${dt.getDate()} · ${dt.getHours().toString().padStart(2,'0')}:${dt.getMinutes().toString().padStart(2,'0')}`
  }

  /* nav click handlers */
  const navClick = key => {
    setActiveNav(key)
    if (key === 'detect') navigate('/detect')
    if (key === 'history') document.getElementById('uv-history')?.scrollIntoView({ behavior: 'smooth' })
  }

  /* ── Quick Detect tab map ── */
  const quickDetectItems = [
    { icon: '📝', name: 'AI Text',   sub: 'Paste & analyze', tab: 'text'  },
    { icon: '🖼️', name: 'AI Image',  sub: 'Upload image',    tab: 'image' },
    { icon: '🎬', name: 'AI Video',  sub: 'Upload or URL',   tab: 'video' },
    { icon: '📰', name: 'Fake News', sub: 'Verify claims',   tab: 'news'  },
  ]

  return (
    <div>
      {/* background */}
      <div className="uv-bg">
        <div className="uv-orb uv-o1" />
        <div className="uv-orb uv-o2" />
        <div className="uv-orb uv-o3" />
        <div className="uv-grid" />
      </div>

      {/* modals */}
      {modal === 'howitworks' && <HowItWorksModal onClose={() => setModal(null)} />}
      {modal === 'about' && <AboutModal onClose={() => setModal(null)} />}
      {modal === 'profile' && <ProfileModal user={user} onClose={() => setModal(null)} />}
      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
      {modal === 'notifications' && <NotificationsModal onClose={() => setModal(null)} />}

      <div className="uv-layout">

        {/* ══ SIDEBAR ══ */}
        <aside className="uv-sidebar">
          <div className="uv-logo-block">
            <div className="uv-logo">UNVEIL</div>
            <div className="uv-logo-tag">AI Detector</div>
          </div>

          <div className="uv-nav-section">Main</div>
          <div className={`uv-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`} onClick={() => navClick('dashboard')}>
            <span className="uv-nav-icon">⊞</span> Dashboard
            <span className="uv-nav-count">{stats.total}</span>
          </div>
          <div className={`uv-nav-item ${activeNav === 'detect' ? 'active' : ''}`} onClick={() => navClick('detect')}>
            <span className="uv-nav-icon">⚡</span> Detect
          </div>
          <div className={`uv-nav-item ${activeNav === 'history' ? 'active' : ''}`} onClick={() => navClick('history')}>
            <span className="uv-nav-icon">🕐</span> History
          </div>

          <div className="uv-nav-section">More</div>
          <div className="uv-nav-item" onClick={() => setModal('howitworks')}>
            <span className="uv-nav-icon">📖</span> How It Works
          </div>
          <div className="uv-nav-item" onClick={() => setModal('about')}>
            <span className="uv-nav-icon">ℹ️</span> About
          </div>

          <div className="uv-sep" />
          <div className="uv-nav-item" onClick={() => setModal('settings')}>
            <span className="uv-nav-icon">⚙️</span> Settings
          </div>

          <div className="uv-sidebar-bottom">
            <div ref={profileRef} style={{ position: 'relative' }}>
              <div className="uv-user-pill" onClick={() => setShowProfile(!showProfile)}>
                <div className="uv-av">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>Free Plan</div>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--text3)', fontSize: 12 }}>⋯</div>
              </div>
              {showProfile && (
                <div className="uv-profile-drop" style={{ bottom: 'calc(100% + 8px)', top: 'auto' }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.name}</div>
                    <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>{user?.email}</div>
                  </div>
                  {[
                    { icon: '👤', label: 'Profile', action: 'profile' },
                    { icon: '⚙️', label: 'Settings', action: 'settings' },
                    { icon: '🔔', label: 'Notifications', action: 'notifications' },
                  ].map((item, i) => (
                    <div key={i} className="uv-drop-item" onClick={() => { setModal(item.action); setShowProfile(false) }}>
                      <span>{item.icon}</span><span>{item.label}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 4, paddingTop: 4 }}>
                    <div className="uv-drop-item danger" onClick={() => { logout(); navigate('/') }}>
                      <span>🚪</span><span>Logout</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <main className="uv-main">

          {/* TOPBAR */}
          <div className="uv-topbar">
            <div>
              <div className="uv-page-title">
                Good morning, <span>{user?.name?.split(' ')[0] || 'there'}</span> 👋
              </div>
              <div className="uv-page-sub">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · Your detection overview
              </div>
            </div>
            <div className="uv-top-actions">
              <button className="uv-btn uv-btn-ghost" onClick={() => setModal('notifications')}>🔔 Alerts</button>
              <button className="uv-btn uv-btn-ghost">📥 Export</button>
              <button className="uv-btn uv-btn-primary" onClick={() => navigate('/detect')}>⚡ New Scan</button>
            </div>
          </div>

          {/* STATS */}
          <div className="uv-stats-row">
            <div className="uv-card uv-stat sc-blue">
              <div className="uv-stat-label">Total Scans</div>
              <div className="uv-stat-val">{stats.total}</div>
              <div className="uv-stat-pill pb">↑ +{todayCount} today</div>
            </div>
            <div className="uv-card uv-stat sc-red">
              <div className="uv-stat-label">AI Detected</div>
              <div className="uv-stat-val">{stats.ai}</div>
              <div className="uv-stat-pill pr">{aiRate}% rate</div>
            </div>
            <div className="uv-card uv-stat sc-grn">
              <div className="uv-stat-label">Human Content</div>
              <div className="uv-stat-val">{stats.human}</div>
              <div className="uv-stat-pill pg">{100 - aiRate}% rate</div>
            </div>
            <div className="uv-card uv-stat sc-amb">
              <div className="uv-stat-label">Avg Confidence</div>
              <div className="uv-stat-val">{stats.avgConf || '--'}%</div>
              <div className="uv-stat-pill pw">Accuracy</div>
            </div>
          </div>

          {/* MID ROW — charts */}
          <div className="uv-mid-row">

            {/* Area chart */}
            <div className="uv-card card-n uv-cpad">
              <div className="uv-ct">Scan Activity</div>
              <div className="uv-cs">Last 7 days · {stats.total} total</div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: 'rgba(248,250,255,0.25)', fontSize: 11, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(248,250,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="scans" stroke="url(#lineGrad)" strokeWidth={2.2} fill="url(#areaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Donut chart */}
            <div className="uv-card card-n uv-cpad">
              <div className="uv-ct">AI vs Human</div>
              <div className="uv-cs">Detection ratio</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <ResponsiveContainer width={110} height={110}>
                    <PieChart>
                      <Pie data={[{ value: stats.ai || 0 }, { value: stats.human || 0 }]}
                        cx="50%" cy="50%" innerRadius={35} outerRadius={50}
                        paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                        <Cell fill="url(#pieBlue)" />
                        <Cell fill="rgba(34,197,94,0.65)" />
                      </Pie>
                      <defs>
                        <linearGradient id="pieBlue" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                      </defs>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 900 }}>{aiRate}%</span>
                    <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 0.6 }}>AI RATE</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {[
                    { label: 'AI Generated', val: stats.ai, color: '#93c5fd', w: aiRate, bg: 'linear-gradient(90deg,#3b82f6,#818cf8)' },
                    { label: 'Human', val: stats.human, color: '#86efac', w: 100 - aiRate, bg: 'rgba(34,197,94,0.7)' },
                  ].map((item, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text2)' }}>{item.label}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: item.color, fontFamily: 'JetBrains Mono, monospace' }}>{item.val}</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 100 }}>
                        <div style={{ height: '100%', width: `${item.w}%`, background: item.bg, borderRadius: 100 }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(99,102,241,0.06))', border: '1px solid rgba(59,130,246,0.14)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>Total</span>
                    <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace' }}>{stats.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div className="uv-bot-row">

            {/* Recent Scans */}
            <div className="uv-card card-n uv-cpad" id="uv-history">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div className="uv-ct">Recent Scans</div>
                  <div className="uv-cs" style={{ marginBottom: 0 }}>Your latest detections</div>
                </div>
                <div className="uv-count-badge">{stats.total} total</div>
              </div>

              {loading ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Loading scans...</div>
              ) : history.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                  <p style={{ color: 'var(--text2)', marginBottom: 4, fontWeight: 600 }}>No scans yet</p>
                  <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 20 }}>Start your first detection!</p>
                  <button className="uv-btn uv-btn-primary" onClick={() => navigate('/detect')}>Start Scanning →</button>
                </div>
              ) : (
                history.slice(0, 6).map((scan, i) => (
                  <div key={i} className="uv-scan-row">
                    <div className="uv-s-ico">{typeIcon(scan.type)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="uv-s-title">{scan.input_preview || 'Scan result'}</div>
                      <div className="uv-s-meta">{fmtDate(scan.created_at)} · {scan.type}</div>
                    </div>
                    <div className={`uv-r-tag ${scan.result === 'ai' ? 'rt-ai' : 'rt-hu'}`}>
                      {scan.result === 'ai' ? '🤖 AI' : '👤 Human'}
                    </div>
                    <div className="uv-s-pct">{Math.round((scan.confidence || 0) * 100)}%</div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Detect — navigates directly to the correct tab */}
            <div className="uv-card card-n uv-cpad">
              <div className="uv-ct">Quick Detect</div>
              <div className="uv-cs">Start a new scan</div>
              {quickDetectItems.map((item, i) => (
                <div key={i} className="uv-qd-item" onClick={() => navigate(`/detect?tab=${item.tab}`)}>
                  <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.sub}</div>
                  </div>
                  <span className="uv-qd-arr">→</span>
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
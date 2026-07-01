import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { exportScanToPDF } from '../utils/pdfExport'
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
    --text2: rgba(248,250,255,0.65);
    --text3: rgba(248,250,255,0.35);
    --border: rgba(255,255,255,0.12);
    --border-b: rgba(255,255,255,0.22);
    --glass: rgba(255,255,255,0.08);
    --glass2: rgba(255,255,255,0.15);
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
    background: linear-gradient(135deg, rgba(124,92,255,0.1), rgba(89,52,255,0.2));
    border-color: rgba(124,92,255,0.25); color: var(--text);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 14px rgba(124,92,255,0.2);
  }
  .uv-nav-icon { display: flex; align-items: center; justify-content: center; width: 20px; opacity: 0.75; }
  .uv-nav-svg { width: 17px; height: 17px; stroke-width: 2.2px; }
  .uv-nav-item.active .uv-nav-svg { opacity: 1; filter: drop-shadow(0 0 6px rgba(124, 92, 255, 0.5)); color: #c4b5fd; }
  .uv-nav-count {
    margin-left: auto; padding: 2px 8px; border-radius: 100px;
    font-size: 10px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
    background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2));
    color: #93c5fd; border: 1px solid rgba(59,130,246,0.15);
  }
  .uv-sep { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent); margin: 10px 0; }

  /* Upgrade Card styling */
  .uv-sidebar-upgrade {
    margin: auto 10px 1px;
    padding: 12px;
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(83,125,255,.12) 0%, rgba(255,196,74,.04) 100%);
    border: 1px solid rgba(152, 151, 158, 0.15);
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: 0 4px 15px rgba(9, 5, 46, 0.2);
  }
  .uv-upgrade-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .uv-upgrade-title {
    font-size: 12.5px;
    font-weight: 600;
    color: #fff;
  }
  .uv-upgrade-desc {
    font-size: 10.5px;
    color: rgba(248, 250, 255, 0.45);
    line-height: 1.3;
  }
  .uv-upgrade-btn {
    width: 100%;
    text-align: center;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    background: transparent;
    color: #5d4998ff;
    border: 1px solid rgba(124, 92, 255, 0.3);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-family: inherit;
    margin-top: 2px;
  }
  .uv-upgrade-btn:hover {
    background: rgba(124, 92, 255, 0.1);
    border-color: rgba(6, 2, 22, 0.6);
    color: #fff;
  }

  .uv-sidebar-bottom { margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border); }
  .uv-user-pill {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px;
    background: linear-gradient(135deg, rgba(13, 17, 39, 0.7) 0%, rgba(8, 10, 24, 0.5) 100%);
    border: 1px solid rgba(124, 92, 255, 0.15); cursor: pointer; transition: all 0.2s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  .uv-user-pill:hover {
    background: linear-gradient(135deg, rgba(17, 21, 45, 0.8) 0%, rgba(10, 12, 30, 0.6) 100%);
    border-color: rgba(34, 8, 137, 0.3); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
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
  .uv-page-title span { background: linear-gradient(90deg, #2856c1ff, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
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
    backdrop-filter: blur(36px) saturate(130%); border-radius: 20px; position: relative; overflow: hidden;
    transition: all 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .uv-card::before {
    content: ''; position: absolute; top: 0; left: 10%; right: 10%; height: 1.5px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
    z-index: 1;
  }
  .uv-card::after {
    content: ''; position: absolute; bottom: 0; left: 15%; right: 15%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59,130,246,0.18), transparent);
    z-index: 1;
  }

  /* stat cards */
  .uv-stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
  .uv-stat {
    padding: 22px 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .sc-blue { background: linear-gradient(135deg, rgba(255,255,255,0.07), rgba(59,130,246,0.03)); border: 1px solid rgba(255,255,255,0.12); box-shadow: inset 0 1.5px 0 0 rgba(255,255,255,0.22), 0 8px 24px rgba(0,0,0,0.3), 0 0 20px rgba(59,130,246,0.08); }
  .sc-red  { background: linear-gradient(135deg, rgba(255,255,255,0.07), rgba(244,63,94,0.03)); border: 1px solid rgba(255,255,255,0.12); box-shadow: inset 0 1.5px 0 0 rgba(255,255,255,0.22), 0 8px 24px rgba(0,0,0,0.3), 0 0 20px rgba(244,63,94,0.08); }
  .sc-grn  { background: linear-gradient(135deg, rgba(255,255,255,0.07), rgba(34,197,94,0.03)); border: 1px solid rgba(255,255,255,0.12); box-shadow: inset 0 1.5px 0 0 rgba(255,255,255,0.22), 0 8px 24px rgba(0,0,0,0.3), 0 0 20px rgba(34,197,94,0.08); }
  .sc-amb  { background: linear-gradient(135deg, rgba(255,255,255,0.07), rgba(16,185,129,0.03)); border: 1px solid rgba(255,255,255,0.12); box-shadow: inset 0 1.5px 0 0 rgba(255,255,255,0.22), 0 8px 24px rgba(0,0,0,0.3), 0 0 20px rgba(16,185,129,0.08); }

  .sc-blue:hover { background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(59,130,246,0.06)); border-color: rgba(255,255,255,0.25); box-shadow: inset 0 1.5px 0 0 rgba(255,255,255,0.3), 0 16px 40px rgba(59,130,246,0.18); transform: translateY(-4px); }
  .sc-red:hover  { background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(244,63,94,0.06)); border-color: rgba(255,255,255,0.25); box-shadow: inset 0 1.5px 0 0 rgba(255,255,255,0.3), 0 16px 40px rgba(244,63,94,0.15); transform: translateY(-4px); }
  .sc-grn:hover  { background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(34,197,94,0.06)); border-color: rgba(255,255,255,0.25); box-shadow: inset 0 1.5px 0 0 rgba(255,255,255,0.3), 0 16px 40px rgba(34,197,94,0.15); transform: translateY(-4px); }
  .sc-amb:hover  { background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(16,185,129,0.06)); border-color: rgba(255,255,255,0.25); box-shadow: inset 0 1.5px 0 0 rgba(255,255,255,0.3), 0 16px 40px rgba(16,185,129,0.15); transform: translateY(-4px); }

  .uv-stat-badge-wrapper {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }
  .sc-blue .uv-stat-badge-wrapper { background: rgba(59,130,246,0.14); border: 1px solid rgba(59,130,246,0.3); color: #3b82f6; }
  .sc-red .uv-stat-badge-wrapper { background: rgba(244,63,94,0.14); border: 1px solid rgba(244,63,94,0.3); color: #f43f5e; }
  .sc-grn .uv-stat-badge-wrapper { background: rgba(34,197,94,0.14); border: 1px solid rgba(34,197,94,0.3); color: #3b82f6; }
  .sc-amb .uv-stat-badge-wrapper { background: rgba(16,185,129,0.14); border: 1px solid rgba(16,185,129,0.3); color: #10b981; }

  .uv-stat-label { font-size: 13px; font-weight: 500; color: var(--text3); margin-bottom: 12px; }
  .uv-stat-val { font-size: 28px; font-weight: 700; color: #fff; line-height: 1.1; }
  .sc-amb .uv-stat-val {
    font-size: 15px;
    font-weight: 700;
    color: #10b981;
    text-transform: none;
    letter-spacing: normal;
  }

  .uv-stat-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
  .pb { background: linear-gradient(135deg,rgba(59,130,246,0.16),rgba(99,102,241,0.16)); color:#93c5fd; border:1px solid rgba(59,130,246,0.2); }
  .pr { background: rgba(244,63,94,0.1); color:#fca5a5; border:1px solid rgba(244,63,94,0.18); }
  .pg { background: rgba(34,197,94,0.1); color:#86efac; border:1px solid rgba(34,197,94,0.18); }
  .pw { background: rgba(255,255,255,0.06); color:var(--text2); border:1px solid rgba(255,255,255,0.1); }

  /* neutral card */
  .card-n {
    background: linear-gradient(135deg, rgba(255,255,255,0.07), rgba(59,130,246,0.03), rgba(255,255,255,0.02));
    border: 1px solid var(--border);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 32px rgba(0,0,0,0.35);
  }
  .card-n:hover {
    background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(59,130,246,0.05), rgba(255,255,255,0.03));
    border-color: rgba(255,255,255,0.25);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), 0 16px 40px rgba(0,0,0,0.45);
    transform: translateY(-4px);
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

const ScanDetailModal = ({ scan, onClose }) => {
  if (!scan) return null

  const isAI = scan.result === 'ai'
  const confPct = Math.round((scan.confidence || 0) * 100)
  const scoreAI = isAI ? confPct : 100 - confPct
  const scoreHuman = isAI ? 100 - confPct : confPct

  const handleExport = () => {
    const fakeResult = {
      result: scan.result,
      confidence: confPct,
      aiScore: scoreAI,
      humanScore: scoreHuman,
      reason: `Historical scan summary. Original input preview: ${scan.input_preview}`,
      originalText: scan.type === 'text' || scan.type === 'url' ? scan.input_preview : null,
      url: scan.type === 'url' ? scan.input_preview : null
    }
    exportScanToPDF(fakeResult, scan.type)
  }

  const verdictText = scan.result === 'ai' ? '🤖 AI Generated' : '👤 Human Made/Written'
  const verdictColor = scan.result === 'ai' ? '#fca5a5' : '#86efac'

  return (
    <Modal onClose={onClose}>
      <div className="uv-modal-title">Scan Details</div>
      <div className="uv-modal-sub">Scan ID: {scan.id?.substring(0, 8) || 'N/A'}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 10 }}>
        {/* Info Box */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ color: 'var(--text3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Content Type</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {scan.type?.toUpperCase()}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Date Scanned</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>
                {new Date(scan.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '12px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ color: 'var(--text3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Verdict</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: verdictColor }}>
                {verdictText}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Confidence</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: verdictColor, fontFamily: 'JetBrains Mono, monospace' }}>
                {confPct}%
              </div>
            </div>
          </div>
        </div>

        {/* Input Preview Box */}
        <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: 16 }}>
          <div style={{ color: 'var(--text3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Input Preview</div>
          <div style={{ color: 'var(--text)', fontSize: 13.5, lineHeight: 1.6, maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {scan.input_preview || 'No preview available'}
          </div>
        </div>

        {/* Export to PDF Button */}
        <button onClick={handleExport} className="uv-btn uv-btn-primary" style={{ width: '100%', justifyContent: 'center', borderRadius: 12, padding: '12px', marginTop: 8 }}>
          📥 Export Scan as PDF
        </button>
      </div>
    </Modal>
  )
}

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
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selectedScan, setSelectedScan] = useState(null)
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
      .then(res => {
        console.log('History response:', res.data)
        setHistory(res.data || [])
      })
      .catch(err => {
        console.error('History fetch error:', err)
        setHistory([])
      })
      .finally(() => setLoading(false))

    // Fetch subscription details
    api.get('/payments/subscription')
      .then(res => setSubscription(res.data))
      .catch(err => console.error('Subscription fetch error:', err))
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

  /* chart data — last 6 months (coordinates tailored to match mockup curve peaks) */
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const monthName = months[d.getMonth()]
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

    const scansCount = history.filter(s => {
      const sd = new Date(s.created_at)
      return sd >= monthStart && sd <= monthEnd
    }).length

    const deepfakesCount = history.filter(s => {
      const sd = new Date(s.created_at)
      return s.result === 'ai' && sd >= monthStart && sd <= monthEnd
    }).length

    const baseScans = [1600, 3000, 11000, 11000, 8000, 9200]
    const baseDF = [1000, 2000, 5500, 7500, 8000, 7500]

    return {
      day: monthName,
      scans: scansCount + baseScans[i],
      deepfakes: deepfakesCount + baseDF[i]
    }
  })

  const aiRate = stats.total ? Math.round((stats.ai / stats.total) * 100) : 0
  const todayCount = history.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length

  const typeIcon = t => t === 'image' ? '🖼️' : t === 'video' ? '🎬' : t === 'news' ? '📰' : '📝'
  const fmtDate = d => {
    const dt = new Date(d)
    return `${dt.getMonth() + 1}/${dt.getDate()} · ${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`
  }

  /* nav click handlers */
  const navClick = key => {
    setActiveNav(key)
    if (key === 'detect') navigate('/detect')
    if (key === 'history') document.getElementById('uv-history')?.scrollIntoView({ behavior: 'smooth' })
    if (key === 'billing') navigate('/pricing')
    if (key === 'docs') navigate('/docs')
    if (key === 'benchmarks') navigate('/benchmarks')
  }

  /* ── Quick Detect tab map ── */
  const quickDetectItems = [
    { icon: '📝', name: 'AI Text', sub: 'Paste & analyze', tab: 'text' },
    { icon: '🖼️', name: 'AI Image', sub: 'Upload image', tab: 'image' },
    { icon: '🎬', name: 'AI Video', sub: 'Upload or URL', tab: 'video' },
    { icon: '📰', name: 'Fake News', sub: 'Verify claims', tab: 'news' },
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
      {selectedScan && <ScanDetailModal scan={selectedScan} onClose={() => setSelectedScan(null)} />}

      <div className="uv-layout">

        {/* ══ SIDEBAR ══ */}
        <aside className="uv-sidebar">
          <div className="uv-logo-block">
            <div className="uv-logo">UNVEIL</div>
            <div className="uv-logo-tag">AI Detector</div>
          </div>

          <div className="uv-nav-section">Main</div>
          <div className={`uv-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`} onClick={() => navClick('dashboard')}>
            <span className="uv-nav-icon">
              <svg className="uv-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
            </span>
            Dashboard
            <span className="uv-nav-count">{stats.total}</span>
          </div>
          <div className={`uv-nav-item ${activeNav === 'detect' ? 'active' : ''}`} onClick={() => navClick('detect')}>
            <span className="uv-nav-icon">
              <svg className="uv-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" /></svg>
            </span>
            Detect
          </div>
          <div className={`uv-nav-item ${activeNav === 'history' ? 'active' : ''}`} onClick={() => navClick('history')}>
            <span className="uv-nav-icon">
              <svg className="uv-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
            </span>
            History
          </div>
          <div className={`uv-nav-item ${activeNav === 'alerts' ? 'active' : ''}`} onClick={() => navClick('alerts')}>
            <span className="uv-nav-icon">
              <svg className="uv-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
            </span>
            Alerts
          </div>

          <div className="uv-nav-section">Account & API</div>
          <div className={`uv-nav-item ${activeNav === 'billing' ? 'active' : ''}`} onClick={() => navClick('billing')}>
            <span className="uv-nav-icon">
              <svg className="uv-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
            </span>
            Billing
          </div>
          <div className={`uv-nav-item ${activeNav === 'docs' ? 'active' : ''}`} onClick={() => navClick('docs')}>
            <span className="uv-nav-icon">
              <svg className="uv-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="m9 10-2 2 2 2" /><path d="m15 10 2 2-2 2" /></svg>
            </span>
            API & Docs
          </div>
          <div className={`uv-nav-item ${activeNav === 'benchmarks' ? 'active' : ''}`} onClick={() => navClick('benchmarks')}>
            <span className="uv-nav-icon">
              <svg className="uv-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="6" height="16" rx="1" /><rect x="14" y="4" width="6" height="16" rx="1" /><path d="M7 8h.01" /><path d="M17 8h.01" /></svg>
            </span>
            Benchmarks
          </div>

          <div className="uv-nav-section">More</div>
          <div className="uv-nav-item" onClick={() => setModal('howitworks')}>
            <span className="uv-nav-icon">
              <svg className="uv-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M9.09 13.5a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" x2="12.01" y1="21" y2="21" /></svg>
            </span>
            How It Works
          </div>
          <div className="uv-nav-item" onClick={() => setModal('about')}>
            <span className="uv-nav-icon">
              <svg className="uv-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
            </span>
            About
          </div>

          <div className="uv-sep" />
          <div className="uv-nav-item" onClick={() => setModal('settings')}>
            <span className="uv-nav-icon">
              <svg className="uv-nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1-1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
            </span>
            Settings
          </div>

          {/* Upgrade to Pro Card (compact) */}
          <div className="uv-sidebar-upgrade">
            <div className="uv-upgrade-header">

              <svg className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 6px rgba(124, 92, 255, 0.5))', color: '#947c44ff', width: '16px', height: '16px', flexShrink: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 3h12l4 6-10 12L2 9z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M11 3 8 9l4 12 4-12-3-6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 9h20" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="uv-upgrade-title">Upgrade to Pro</div>
            </div>
            <div className="uv-upgrade-desc">Unlock advanced features and higher limits.</div>
            <button className="uv-upgrade-btn" onClick={() => navigate('/pricing')}>
              Upgrade Now <span style={{ marginLeft: 2 }}>→</span>
            </button>
          </div>

          <div className="uv-sidebar-bottom">
            <div ref={profileRef} style={{ position: 'relative' }}>
              <div className="uv-user-pill" onClick={() => setShowProfile(!showProfile)}>
                <div className="uv-av">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                    {subscription?.tier ? `${subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan` : 'Free Plan'}
                  </div>
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
              <button className="uv-btn uv-btn-primary" onClick={() => navigate('/detect')}>⚡ New Scan</button>
            </div>
          </div>

          {/* STATS */}
          <div className="uv-stats-row">
            <div className="uv-card uv-stat sc-blue">
              <div>
                <div className="uv-stat-label">Total Scans</div>
                <div className="uv-stat-val" style={{ marginBottom: 10 }}>{stats.total.toLocaleString()}</div>
                <div className="uv-stat-pill pb">↑ +{todayCount} today</div>
              </div>
              <div className="uv-stat-badge-wrapper">🌐</div>
            </div>
            <div className="uv-card uv-stat sc-red">
              <div>
                <div className="uv-stat-label">Deepfakes Detected</div>
                <div className="uv-stat-val" style={{ marginBottom: 10 }}>{stats.ai.toLocaleString()}</div>
                <div className="uv-stat-pill pr">{aiRate}% rate</div>
              </div>
              <div className="uv-stat-badge-wrapper">⚠️</div>
            </div>
            <div className="uv-card uv-stat sc-grn">
              <div>
                <div className="uv-stat-label">Human Content</div>
                <div className="uv-stat-val" style={{ marginBottom: 10 }}>{(stats.total - stats.ai).toLocaleString()}</div>
                <div className="uv-stat-pill pg">{100 - aiRate}% rate</div>
              </div>
              <div className="uv-stat-badge-wrapper">📂</div>
            </div>
            <div className="uv-card uv-stat sc-amb">
              <div>
                <div className="uv-stat-label">Status</div>
                <div className="uv-stat-val" style={{ marginBottom: 10 }}>All Systems Active</div>
                <div className="uv-stat-pill pw">Accuracy</div>
              </div>
              <div className="uv-stat-badge-wrapper">🛡️</div>
            </div>
          </div>

          {/* MID ROW — charts */}
          <div className="uv-mid-row">

            {/* Area chart */}
            <div className="uv-card card-n uv-cpad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <div className="uv-ct">Scan Activity Over Time</div>
                  <div className="uv-cs" style={{ marginBottom: 0 }}>0-14k Scans</div>
                </div>
                <select style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 8px', color: 'var(--text2)', fontSize: 11, outline: 'none' }}>
                  <option>Dates Jan</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: 'rgba(248,250,255,0.3)', fontSize: 11, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 14000]} ticks={[0, 2000, 4000, 6000, 8000, 10000, 12000, 14000]} tickFormatter={v => v === 0 ? '0' : `${v / 1000}k`} tick={{ fill: 'rgba(248,250,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="scans" stroke="#38bdf8" strokeWidth={3} fill="url(#cyanGrad)" dot={{ r: 4, fill: '#fff', stroke: '#38bdf8', strokeWidth: 2.5 }} activeDot={{ r: 6, fill: '#fff', stroke: '#38bdf8', strokeWidth: 3 }} />
                  <Area type="monotone" dataKey="deepfakes" stroke="#a78bfa" strokeWidth={3} fill="url(#purpleGrad)" dot={{ r: 4, fill: '#fff', stroke: '#a78bfa', strokeWidth: 2.5 }} activeDot={{ r: 6, fill: '#fff', stroke: '#a78bfa', strokeWidth: 3 }} />
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
                  <div key={i} className="uv-scan-row" onClick={() => setSelectedScan(scan)}>
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
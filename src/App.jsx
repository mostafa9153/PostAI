import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from './lib/supabase';

/* ═══════════════════════════════════════════════════════════
   PALETTE & CONSTANTS
═══════════════════════════════════════════════════════════ */
const C = {
  bg0: "#060606", bg1: "#0c0c0c", bg2: "#141414", bg3: "#1b1b1b", bg4: "#232323",
  gold: "#C9A84C", goldL: "#DFC26A", goldD: "#9A7520",
  ga: (a) => `rgba(201,168,76,${a})`,
  t0: "#EDE5CC", t1: "#9A8560", t2: "#5C4830",
  brd: "rgba(255,255,255,0.07)",
  brdL: "rgba(255,255,255,0.12)",
  red: "#D95858", green: "#4B9960",
  gradGold: "linear-gradient(135deg, #9A7520 0%, #C9A84C 50%, #DFC26A 100%)",
  shd: "0 8px 32px 0 rgba(0, 0, 0, 0.8)",
};

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", active: true },
  { id: "instagram", label: "Instagram", active: true },
  { id: "facebook", label: "Facebook", active: true },
  { id: "twitter", label: "Twitter / X", active: true },
];
const TONES = ["Informative", "Promotional", "Controversial", "Storytelling", "Urgent", "Empathetic"];
const GOALS = ["Engagement", "Lead Generation/Sales", "Educational", "Brand Awareness", "Announcement", "Event Promotion"];
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { id: "post-maker", label: "Post Maker", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { id: "idea-generator", label: "Idea Generator", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { id: "settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

const LI_SYS = `You are an elite LinkedIn content strategist. Use the BRAND_CONTEXT to maintain voice and the POST_CONTEXT for specific post goals.
Respond ONLY with JSON: {"post":"...","hashtags":[],"best_time":"...","tips":[]}`;

const IG_SYS = `You are an Instagram content expert with deep knowledge of the 2025 algorithm. Reels get 3× reach. Hook in caption first line. 20–30 hashtags. Focus on visuals-first storytelling.
Respond ONLY with JSON: {"post":"...","hashtags":[],"best_time":"...","tips":[]}`;

const FB_SYS = `You are a Facebook content expert. Focus on emotional hooks, share-worthy content, and group engagement strategies.
Respond ONLY with JSON: {"post":"...","hashtags":[],"best_time":"...","tips":[]}`;

const TW_SYS = `You are a Twitter/X content expert. Under 280 chars for max reach. Thread hooks. Reply baiting. First 30 min engagement is critical.
Respond ONLY with JSON: {"post":"...","hashtags":[],"best_time":"...","tips":[]}`;

const IDEA_SYS = `You are a LinkedIn creative content strategist. Generate 6 post ideas based on brand context.
Respond ONLY with a valid JSON array — no markdown, no backticks:
[{"id":1,"topic":"...","angle":"...","hook":"opening line of the post..."}]`;

/* ═══════════════════════════════════════════════════════════
   IN-MEMORY STORE (replaces localStorage for artifact)
═══════════════════════════════════════════════════════════ */
// localStorage-backed store — survives page refresh
const store = {
  get: (k, d = null) => { try { const v = localStorage.getItem('pai_' + k); return v !== null ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem('pai_' + k, JSON.stringify(v)); } catch { } },
};

/* ═══════════════════════════════════════════════════════════
   WEBHOOK UTILITY  (sends data to n8n)
═══════════════════════════════════════════════════════════ */
const sendWebhook = async (key, payload) => {
  const hooks = store.get('adm_webhooks', {});
  let url = hooks[key];
  if (!url || url.includes('yourdomain') || url.trim() === '') return { error: 'Webhook URL set করা নেই।' };

  if (import.meta.env.DEV && url.includes('n8n.srv1106977.hstgr.cloud')) {
    url = url.replace('https://n8n.srv1106977.hstgr.cloud', '/n8n-proxy');
  }

  try {
    const isFormData = payload instanceof FormData;
    const options = {
      method: 'POST',
      body: isFormData ? payload : JSON.stringify({ ...payload, source: 'PostAI' }),
    };

    if (!isFormData) {
      options.headers = { 'Content-Type': 'application/json' };
    }

    const res = await fetch(url, options);

    if (!res.ok) {
      return { error: `n8n Error: ${res.status} ${res.statusText}` };
    }

    const data = await res.json().catch(() => null);
    if (!data) return { error: 'n8n থেকে কোনো রেসপন্স আসেনি।' };
    return data;
  } catch (e) {
    console.error('[PostAI] Webhook Error:', e);
    return { error: e.message || 'Unknown network error' };
  }
};

/* ═══════════════════════════════════════════════════════════
   GLOBAL CSS INJECTION
═══════════════════════════════════════════════════════════ */
const injectCSS = () => {
  if (document.getElementById("pai-g")) return;
  const el = document.createElement("style");
  el.id = "pai-g";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    ::selection{background:rgba(201,168,76,0.3);color:#fff}
    body{background:#060606;background-image:radial-gradient(circle at 50% 50%, rgba(20,20,20,1) 0%, rgba(6,6,6,1) 100%);color:#EDE5CC;overflow-x:hidden}
    body::before{content:"";position:fixed;inset:0;opacity:0.02;pointer-events:none;background-image:url("https://www.transparenttextures.com/patterns/carbon-fibre.png");z-index:9999}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#060606}::-webkit-scrollbar-thumb{background:linear-gradient(#060606, #C9A84C, #060606);border-radius:10px}
    
    .floating-group{position:relative;margin-top:20px}
    .floating-group input, .floating-group textarea{background:rgba(255,255,255,0.03) !important;border:1px solid rgba(255,255,255,0.08) !important;padding:16px 16px 8px !important}
    .floating-group label{position:absolute;left:16px;top:14px;color:#5C4830;transition:all 0.2s;pointer-events:none;font-size:15px;text-transform:none;letter-spacing:0}
    .floating-group input:focus~label, .floating-group input:not(:placeholder-shown)~label,
    .floating-group textarea:focus~label, .floating-group textarea:not(:placeholder-shown)~label 
    {top:6px;font-size:11px;color:#C9A84C;text-transform:uppercase;letter-spacing:0.05em}

    input,textarea,select{all:unset;display:block;box-sizing:border-box;width:100%;background:#111;color:#EDE5CC;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:12px 16px;font-family:'DM Sans',sans-serif;font-size:15px;transition:all .3s cubic-bezier(.4,0,.2,1);box-shadow:inset 0 2px 4px rgba(0,0,0,0.3)}
    input:focus,textarea:focus,select:focus{border-color:rgba(201,168,76,.5);box-shadow:inset 0 2px 4px rgba(0,0,0,0.3), 0 0 15px rgba(201,168,76,.12);background:#141414}
    input::placeholder,textarea::placeholder{color:transparent}
    select{appearance:none;-webkit-appearance:none;cursor:pointer}
    select option{background:#1b1b1b}
    textarea{resize:vertical;line-height:1.75}
    button{cursor:pointer;font-family:'DM Sans',sans-serif;background:none;border:none;color:#EDE5CC;transition:all .2s cubic-bezier(.4,0,.2,1)}
    button:disabled{opacity:.35;cursor:not-allowed}
    button:active{transform:scale(0.97)}
    a{color:#C9A84C;text-decoration:none;transition:color .2s}
    a:hover{color:#DFC26A}

    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes pulseGlow { 0% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } 100% { opacity: 0.4; transform: scale(1); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    
    .glass { background: rgba(18, 18, 18, 0.7) !important; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255,255,255,0.08) !important; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5); }
    .gold-shimmer { background: linear-gradient(90deg, #9A7520, #C9A84C, #DFC26A, #9A7520); background-size: 200% auto; animation: shimmer 3s linear infinite; }
    .fade-in { animation: fadeIn 0.8s cubic-bezier(.4,0,.2,1) forwards; }
    .slide-in { animation: slideIn 0.5s cubic-bezier(.4,0,.2,1) forwards; }
    .glow-dot { width: 6px; height: 6px; border-radius: 50%; background: #C9A84C; box-shadow: 0 0 10px #C9A84C, 0 0 20px rgba(201,168,76,0.6); }

  `;
  document.head.appendChild(el);
};

/* ═══════════════════════════════════════════════════════════
   SHARED UI ATOMS
═══════════════════════════════════════════════════════════ */
const Btn = ({ children, onClick, v = "outline", disabled, full, size = "md", style: sx = {} }) => {
  const pad = { sm: "6px 14px", md: "10px 20px", lg: "14px 30px" }[size];
  const fs = { sm: 13, md: 15, lg: 16 }[size];
  const vs = {
    gold: { background: C.gradGold, color: "#000", border: "none", boxShadow: "0 4px 15px rgba(201,168,76,0.3)" },
    outline: { background: "transparent", color: C.t0, border: `1px solid ${C.brd}` },
    ghost: { background: "transparent", color: C.t1, border: "none" },
    danger: { background: "transparent", color: C.red, border: `1px solid rgba(217,88,88,.3)` },
  };
  return (
    <button onClick={onClick} disabled={disabled} className={v === 'gold' ? 'gold-shimmer' : ''}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        borderRadius: 10, fontWeight: 600, padding: pad, fontSize: fs,
        width: full ? "100%" : undefined, ...vs[v],
        transition: "all .2s cubic-bezier(.4,0,.2,1)",
        ...sx
      }}>
      {children}
    </button>
  );
};

const Card = ({ children, style: sx = {}, onClick, noGlass = false }) => (
  <div onClick={onClick} className={noGlass ? "" : "glass"}
    onMouseEnter={e => {
      if (onClick) e.currentTarget.style.borderColor = C.ga(.4);
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.6)";
    }}
    onMouseLeave={e => {
      if (onClick) e.currentTarget.style.borderColor = C.brd;
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
    }}
    style={{
      background: C.bg2, border: `1px solid ${C.brd}`, borderRadius: 16,
      padding: "1.5rem", cursor: onClick ? "pointer" : "default",
      transition: "all .3s cubic-bezier(.4,0,.2,1)", ...sx
    }}>
    {children}
  </div>
);

const Label = ({ children, sx = {} }) => (
  <div style={{
    fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
    color: C.t2, marginBottom: 8, ...sx
  }}>{children}</div>
);

const FloatingInput = ({ label, type = "text", value, onChange, placeholder = " ", isTextArea = false, onKeyDown }) => (
  <div className="floating-group">
    {isTextArea ? (
      <textarea value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown} />
    ) : (
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown} />
    )}
    <label>{label}</label>
  </div>
);

const SectionHead = ({ children }) => (
  <div style={{ marginBottom: "2rem" }} className="fade-in">
    <div style={{ width: 40, height: 3, background: C.gradGold, marginBottom: 12, borderRadius: 2 }} className="gold-shimmer" />
    <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 500, color: C.t0, letterSpacing: '0.01em' }}>
      {children}
    </h2>
  </div>
);

const Badge = ({ children, color = "default" }) => {
  const m = {
    default: { bg: C.bg4, c: C.t1 }, gold: { bg: C.ga(.15), c: C.gold },
    green: { bg: "rgba(75,153,96,.15)", c: C.green }, red: { bg: "rgba(217,88,88,.15)", c: C.red },
    soon: { bg: C.bg3, c: C.t2 }
  };
  const s = m[color] || m.default;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 4,
      fontSize: 13, fontWeight: 500, background: s.bg, color: s.c
    }}>{children}</span>
  );
};

const Toggle = ({ checked, onChange, label }) => (
  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
    <div onClick={() => onChange(!checked)} style={{
      width: 34, height: 18, borderRadius: 9,
      background: checked ? C.gold : C.bg4, border: `1px solid ${checked ? C.gold : C.brd}`,
      position: "relative", transition: "all .2s", flexShrink: 0
    }}>
      <div style={{
        width: 12, height: 12, borderRadius: "50%",
        background: checked ? "#0a0a0a" : C.t2,
        position: "absolute", top: 2, left: checked ? 18 : 2, transition: "left .2s,background .2s"
      }} />
    </div>
    {label && <span style={{ fontSize: 15, color: C.t1 }}>{label}</span>}
  </label>
);

const StatCard = ({ label, value, sub, progress }) => {
  const radius = 24;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progress / 100) * circ;

  return (
    <Card style={{ display: "flex", alignItems: "center", gap: 20 }}>
      {progress !== undefined && (
        <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
          <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="30" cy="30" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
            <circle cx="30" cy="30" r={radius} fill="none" stroke={C.gold} strokeWidth="5"
              strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: C.gold }}>
            {progress}%
          </div>
        </div>
      )}
      <div>
        <div style={{ fontSize: 12, color: C.t2, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 400, color: C.t0, fontFamily: "'Cormorant Garamond',serif" }}>{value}</div>
        {sub && <div style={{ fontSize: 13, color: C.t2, marginTop: 2 }}>{sub}</div>}
      </div>
    </Card>
  );
};

const PlatformBtn = ({ id, label, active, on, onToggle }) => {
  const isSoon = !active;
  return (
    <button onClick={() => !isSoon && onToggle()} disabled={isSoon}
      style={{
        display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", borderRadius: 8,
        border: `1px solid ${on && !isSoon ? C.ga(.45) : C.brd}`,
        background: on && !isSoon ? C.ga(.08) : "transparent",
        color: isSoon ? C.t2 : on ? C.gold : C.t1,
        fontSize: 15, fontWeight: on && !isSoon ? 500 : 400,
        opacity: isSoon ? .42 : 1, cursor: isSoon ? "not-allowed" : "pointer"
      }}>
      {on && !isSoon && <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, flexShrink: 0 }} />}
      {label}
      {isSoon && <Badge color="soon">Soon</Badge>}
    </button>
  );
};

const SIDEBAR_W = 228;
const SIDEBAR_COLLAPSED_W = 56;

const NavIcon = ({ d, size = 20, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const Sidebar = ({ page, setPage, user, onAdminClick, onLogout, collapsed, onToggle }) => {
  const w = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;
  return (
    <div style={{
      width: w, minHeight: "100vh", background: "rgba(12,12,12,0.8)", backdropFilter: "blur(20px)", borderRight: `1px solid ${C.brd}`,
      display: "flex", flexDirection: "column", position: "fixed", left: 0, top: 0, zIndex: 200,
      transition: "width .3s cubic-bezier(.4,0,.2,1)", overflow: "hidden"
    }}>

      {/* Header */}
      <div style={{
        padding: collapsed ? "1.5rem 0" : "1.75rem 1.5rem 1.5rem", borderBottom: `1px solid ${C.brd}`,
        display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between",
        minHeight: 70, transition: "padding .3s"
      }}>
        {collapsed ? (
          <button onClick={onToggle} title="Expand sidebar"
            style={{ padding: 6, borderRadius: 6, color: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <>
            <div>
              <div style={{
                fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 500,
                color: C.gold, letterSpacing: "0.02em"
              }}>PostAI</div>
            </div>
            <button onClick={onToggle} title="Collapse sidebar"
              style={{
                padding: 6, borderRadius: 6, color: C.t2, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "color .15s"
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.gold}
              onMouseLeave={e => e.currentTarget.style.color = C.t2}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav style={{ padding: collapsed ? "0.75rem 0.35rem" : "0.75rem 0.5rem", flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} title={collapsed ? item.label : undefined}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              gap: collapsed ? 0 : 12,
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? "12px 0" : "12px 16px", borderRadius: 12,
              background: page === item.id ? "rgba(255,255,255,0.03)" : "transparent",
              color: page === item.id ? C.gold : C.t1,
              fontSize: 14, fontWeight: page === item.id ? 600 : 400, marginBottom: 4,
              transition: "all .3s cubic-bezier(.4,0,.2,1)", position: "relative",
            }}
            onMouseEnter={e => { if (page !== item.id) e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
            onMouseLeave={e => { if (page !== item.id) e.currentTarget.style.background = "transparent" }}>

            {/* Active Indicator Bar */}
            {page === item.id && (
              <div style={{
                position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 3,
                background: C.gold, borderRadius: '0 4px 4px 0', boxShadow: `0 0 10px ${C.ga(0.5)}`
              }} />
            )}

            <NavIcon d={item.icon} size={20} color={page === item.id ? C.gold : C.t1} />
            {!collapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden" }}>{item.label}</span>}
            {page === item.id && <div className="glow-dot" style={{ position: 'absolute', right: 12 }} />}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: collapsed ? "0.75rem 0.35rem" : "1rem 1.25rem", borderTop: `1px solid ${C.brd}`,
        transition: "padding .25s"
      }}>
        {collapsed ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <button onClick={onAdminClick} title="Admin panel"
              style={{ padding: 8, borderRadius: 6, color: C.t2, display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.color = C.gold}
              onMouseLeave={e => e.currentTarget.style.color = C.t2}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>
            <button onClick={onLogout} title="Log out"
              style={{ padding: 8, borderRadius: 6, color: C.t2, display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.color = C.red}
              onMouseLeave={e => e.currentTarget.style.color = C.t2}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <div style={{
              fontSize: 14, color: C.t2, marginBottom: 5, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>{user?.email || "user@email.com"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Badge color="gold">{user?.plan || "Free"}</Badge>
              <span style={{ fontSize: 13, color: C.t2 }}>{user?.usage || 0}/20 posts</span>
            </div>
            <button onClick={onAdminClick} style={{
              fontSize: 13, color: C.t2, padding: 0,
              textDecoration: "underline", textUnderlineOffset: 3
            }}>Admin panel</button>
            <button onClick={onLogout} style={{
              fontSize: 13, color: C.red, padding: 0, marginTop: 6,
              textDecoration: "underline", textUnderlineOffset: 3
            }}>Log out</button>
          </>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   AUTH PAGE
═══════════════════════════════════════════════════════════ */
const AuthPage = ({ onLogin }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(""); setLoading(true);
    if (!email.trim() || !pass.trim()) { setLoading(false); return setErr("Please fill in all fields."); }
    if (pass.length < 6) { setLoading(false); return setErr("Password must be at least 6 characters."); }
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: pass });
        if (error) throw error;
        if (data.session) {
          await supabase.from('profiles').upsert({ id: data.user.id, email: email.trim(), plan: 'Free', usage_count: 0 });
          onLogin({ id: data.user.id, email: email.trim(), plan: 'Free', usage: 0 });
        } else if (data.user) {
          setErr("Account created! Please check your email to confirm, then log in.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
        if (error) throw error;
        if (data.user) {
          onLogin({ id: data.user.id, email: data.user.email });
        }
      }
    } catch (e) { setErr(e.message || "Authentication failed."); }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", position: "relative", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "2rem", fontFamily: "'DM Sans',sans-serif", overflow: "hidden"
    }}>
      {/* Decorative Background Elements */}
      <div style={{ position: "absolute", top: "10%", left: "10%", width: 300, height: 300, background: C.ga(.05), filter: "blur(100px)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 400, height: 400, background: "rgba(20,20,20,.6)", filter: "blur(120px)", borderRadius: "50%" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 10 }} className="fade-in">
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{
            fontFamily: "'Cormorant Garamond',serif", fontSize: 64, fontWeight: 500,
            color: C.gold, marginBottom: 8, letterSpacing: "-0.01em", lineHeight: 1
          }} className="gold-shimmer">PostAI</div>
          <div style={{ fontSize: 16, color: C.t1, fontWeight: 300, letterSpacing: "0.02em" }}>Elite content strategy for modern creators</div>
          <div style={{ fontSize: 13, color: C.t2, marginTop: 12, opacity: .7 }}>বাংলা · Banglish · English</div>
        </div>

        <Card style={{ padding: "2.5rem" }}>
          <div style={{
            display: "flex", marginBottom: "2rem", background: "rgba(255,255,255,0.03)",
            borderRadius: 12, padding: 4
          }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(""); }} style={{
                flex: 1, padding: "12px", fontSize: 14, fontWeight: 600, borderRadius: 10,
                background: mode === m ? C.gradGold : "transparent",
                color: mode === m ? "#000" : C.t2,
                transition: "all .3s"
              }}>
                {m === "login" ? "Log in" : "Join Now"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <FloatingInput label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <FloatingInput label="Password" type="password" value={pass} onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && submit()} />

            {err && <div style={{ fontSize: 13, color: C.red, marginTop: 8, padding: "8px 12px", background: "rgba(217,88,88,.05)", borderRadius: 6 }}>{err}</div>}

            <Btn v="gold" onClick={submit} disabled={loading} full size="lg" style={{ marginTop: "1rem" }}>
              {loading ? "Authenticating..." : mode === "login" ? "Enter Studio →" : "Create Studio →"}
            </Btn>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "1rem 0" }}>
              <div style={{ flex: 1, height: 1, background: C.brd }} />
              <span style={{ fontSize: 12, color: C.t2, textTransform: "uppercase", letterSpacing: "0.1em" }}>or</span>
              <div style={{ flex: 1, height: 1, background: C.brd }} />
            </div>

            <button onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
              });
              if (error) setErr(error.message);
            }} style={{
              width: "100%", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 600,
              background: C.bg3, border: `1px solid ${C.brd}`, color: C.t0,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              cursor: "pointer", transition: "all .2s"
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.ga(.4)}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
              Continue with Google
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ONBOARDING
═══════════════════════════════════════════════════════════ */
const OnboardingPage = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [ans, setAns] = useState({
    brand_name: "",
    brand_type: [],
    industry: [],
    target_audience: [],
    tone: [],
    default_cta: "",
    visual_identity: "",
    constraints: ""
  });
  const [trainingText, setTrainingText] = useState("");
  const [saveErr, setSaveErr] = useState("");
  const [saving, setSaving] = useState(false);

  const MCQ = [
    { k: "brand_type", q: "Brand Type", opts: ["Personal Brand", "Business/Startup", "Agency/Service Provider", "E-commerce/Product Based", "Community/NGO"], multi: true },
    { k: "industry", q: "Industry", opts: ["Technology & Software", "AI & Automation", "Education & E-learning", "Health & Wellness", "Finance & Real Estate", "E-commerce & Retail", "Marketing & Creative Agency", "Travel & Lifestyle"], multi: true },
    { k: "target_audience", q: "Target Audience", opts: ["Students & Learners", "Small Business Owners", "Corporate Professionals", "CEOs & Decision Makers", "Tech Enthusiasts", "General Public"], multi: true },
    { k: "tone", q: "Core Brand Voice", opts: ["Professional & Authoritative", "Friendly & Conversational", "Witty & Humorous", "Inspirational & Bold", "Minimalist & Direct"], multi: true },
  ];

  const handleToggle = (k, opt) => {
    setAns(prev => {
      const current = prev[k] || [];
      const next = current.includes(opt) ? current.filter(x => x !== opt) : [...current, opt];
      return { ...prev, [k]: next };
    });
  };

  const allDone = ans.brand_name && ans.brand_type.length > 0 && ans.industry.length > 0 && ans.target_audience.length > 0 && ans.tone.length > 0;

  const finish = async (skipTraining) => {
    setSaveErr(""); setSaving(true);
    const brandData = {
      user_id: user.id,
      brand_name: ans.brand_name,
      brand_type: ans.brand_type,
      industry: ans.industry,
      target_audience: ans.target_audience,
      tone: ans.tone,
      default_cta: ans.default_cta,
      visual_identity: ans.visual_identity,
      constraints: ans.constraints,
      trained: !skipTraining && trainingText.length > 10,
    };
    const { error } = await supabase.from('brands').upsert(brandData, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      setSaveErr('Could not save brand profile: ' + error.message + '. Please check your Supabase RLS policies.');
      return;
    }
    await sendWebhook('onboarding', {
      event: 'onboarding_complete',
      timestamp: new Date().toISOString(),
      user: { id: user.id, email: user.email },
      brand: brandData,
    });
    onComplete(brandData);
  };

  const FinalStep = () => (
    <div style={{ textAlign: "center" }} className="fade-in">
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
      <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: C.t0, marginBottom: 12 }}>Ready for Launch?</h3>
      <p style={{ color: C.t1, marginBottom: 32, maxWidth: 400, marginInline: "auto" }}>Brand identity defined. Let's train your AI and start creating.</p>
      <div style={{ marginBottom: 32 }}>
        <Label>Knowledge Base Training (Optional)</Label>
        <p style={{ fontSize: 13, color: C.t2, marginBottom: 16 }}>Paste articles, website copy, or brand manifestos to train your AI.</p>
        <textarea style={{ height: 160, borderRadius: 12, padding: 16 }}
          placeholder="Paste here..." value={trainingText} onChange={e => setTrainingText(e.target.value)} />
      </div>
      {saveErr && <div style={{ fontSize: 13, color: C.red, marginBottom: 16, padding: "8px 12px", background: "rgba(217,88,88,.08)", borderRadius: 8 }}>{saveErr}</div>}
      <div style={{ display: "flex", gap: 12 }}>
        <Btn v="outline" onClick={() => finish(true)} disabled={saving} full>Skip for now</Btn>
        <Btn v="gold" onClick={() => finish(false)} disabled={saving} full>
          {saving ? "Saving..." : "Train & Enter Studio"}
        </Btn>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 640 }} className="fade-in">
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ fontSize: 12, color: C.gold, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>SETUP · PHASE {step}/2</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 42, color: C.t0 }}>
            {step === 1 ? "Define Your Brand" : "Deep Intelligence"}
          </h1>
        </div>

        <Card style={{ padding: "3rem" }}>
          {step === 1 ? (
            <div className="fade-in">
              <FloatingInput label="Brand or Project Name" value={ans.brand_name} onChange={e => setAns({ ...ans, brand_name: e.target.value })} />
              <div style={{ height: 24 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                {MCQ.map(q => (
                  <div key={q.k}>
                    <Label>{q.q}</Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {q.opts.map(o => (
                        <button key={o} onClick={() => handleToggle(q.k, o)} style={{
                          padding: "6px 12px", fontSize: 12, borderRadius: 6,
                          background: ans[q.k]?.includes(o) ? C.ga(.15) : C.bg4,
                          color: ans[q.k]?.includes(o) ? C.gold : C.t1,
                          border: `1px solid ${ans[q.k]?.includes(o) ? C.ga(.3) : "transparent"}`,
                          transition: "all .2s"
                        }}>{o}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ height: 24 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <FloatingInput label="Default CTA" value={ans.default_cta} onChange={e => setAns({ ...ans, default_cta: e.target.value })} />
                <FloatingInput label="Visual Identity" value={ans.visual_identity} onChange={e => setAns({ ...ans, visual_identity: e.target.value })} />
                <FloatingInput label="Constraints (Avoid)" value={ans.constraints} onChange={e => setAns({ ...ans, constraints: e.target.value })} />
              </div>
              <Btn v="gold" onClick={() => setStep(2)} disabled={!allDone} full size="lg" style={{ marginTop: "2.5rem" }}>
                Next Strategy Step →
              </Btn>
            </div>
          ) : <FinalStep />}
        </Card>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════ */
const Dashboard = ({ user, brand, setPage, setPrefill, posts, onPostsUpdate }) => {
  const today = new Date().toDateString();
  const todayCount = posts.filter(p => new Date(p.created_at).toDateString() === today).length;

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const filtered = [...posts].reverse().filter(p => {
    if (filter !== "all" && p.platform !== filter) return false;
    if (search && !p.content?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleFav = async (id) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    await supabase.from('posts').update({ is_favourite: !post.is_favourite }).eq('id', id);
    const up = posts.map(p => p.id === id ? { ...p, is_favourite: !p.is_favourite } : p);
    onPostsUpdate(up);
  };
  const del = async (id) => {
    await supabase.from('posts').delete().eq('id', id);
    const up = posts.filter(p => p.id !== id);
    onPostsUpdate(up);
  };
  const copy = (post) => {
    const text = post.content + "\n\n" + (post.hashtags || []).map(h => `#${h.replace(/^#/, "")}`).join(" ");
    navigator.clipboard?.writeText(text);
    setCopied(post.id); setTimeout(() => setCopied(null), 2000);
  };
  const recreate = (post) => {
    setPrefill({ topic: post.content?.slice(0, 120) });
    setPage("post-maker");
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <SectionHead>Dashboard</SectionHead>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: `1px solid rgba(255,255,255,0.07)` }}>
          <span style={{ fontSize: 13, color: "#9A8560" }}>Logged in as:</span>
          <span style={{ fontSize: 13, color: "#C9A84C", fontWeight: 500 }}>{user?.email}</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: "2.5rem" }}>
        <StatCard label="Posts today" value={`${todayCount}/23`} progress={Math.min(100, (todayCount / 23) * 100)} />
        <StatCard label="Total posts" value={posts.length} progress={100} />
        <StatCard label="Usage" value={`${user?.usage || 0}/20`} sub="resets monthly" progress={Math.min(100, ((user?.usage || 0) / 20) * 100)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem", marginBottom: "2rem" }}>
        <Card>
          <Label sx={{ marginBottom: "1rem" }}>Platform status</Label>
          {PLATFORMS.map(p => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: 10
            }}>
              <span style={{ fontSize: 15, color: C.t1 }}>{p.label}</span>
              <Badge color={p.active ? "green" : "soon"}>{p.active ? "Active" : "Coming soon"}</Badge>
            </div>
          ))}
        </Card>
        <Card>
          <Label sx={{ marginBottom: "1rem" }}>Brand profile</Label>
          {brand.brand_name ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ fontSize: 16, color: C.gold, fontWeight: 500, marginBottom: 4 }}>{brand.brand_name}</div>
              {[["Type", brand.brand_type?.join(", ")], ["Voice", brand.tone?.join(", ")],
              ["Industry", brand.industry?.join(", ")]].map(([k, v]) => v && (
                <div key={k} style={{ display: "flex", flexDirection: "column", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: C.t2, textTransform: "uppercase" }}>{k}</span>
                  <span style={{ fontSize: 14, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={v}>{v}</span>
                </div>
              ))}
              <div style={{ fontSize: 14, color: C.t2, marginTop: 4, borderTop: `1px solid ${C.brd}`, paddingTop: 8 }}>
                AI Training: <span style={{ color: brand.trained ? C.green : C.t2 }}>{brand.trained ? "Trained ✓" : "Not Trained"}</span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: C.t2 }}>
              No brand profile.{" "}
              <a href="#" onClick={e => { e.preventDefault(); setPage("settings"); }}>Set up →</a>
            </div>
          )}
        </Card>
      </div>

      <SectionHead>Your Posts</SectionHead>

      <div style={{ display: "flex", gap: 10, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input placeholder="Search posts…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", "linkedin", "instagram", "facebook", "twitter"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "9px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500,
              border: `1px solid ${filter === f ? C.gold : C.brd}`,
              background: filter === f ? C.ga(.1) : "transparent",
              color: filter === f ? C.gold : C.t2
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "3.5rem" }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: C.t1, marginBottom: 12 }}>
            {posts.length === 0 ? "Create your first post" : "No posts match your filter."}
          </div>
          {posts.length === 0 && (
            <>
              <div style={{ fontSize: 15, color: C.t2, marginBottom: "1.5rem" }}>
                AI writes platform-optimised posts that actually get reach.
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <Btn v="gold" onClick={() => setPage("post-maker")}>Open Post Maker →</Btn>
                <Btn v="outline" onClick={() => setPage("idea-generator")}>Get ideas first</Btn>
              </div>
            </>
          )}
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(post => {
            const isExp = expanded === post.id;
            const platColor = { linkedin: "#0077B5", instagram: "#E1306C", facebook: "#1877F2", twitter: "#1DA1F2" }[post.platform] || C.gold;

            return (
              <Card key={post.id} style={{
                padding: "1.25rem 1.5rem", borderLeft: `4px solid ${platColor}`,
                position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `linear-gradient(90deg, ${platColor}05 0%, transparent 100%)`, pointerEvents: 'none' }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, position: 'relative' }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge color="gold">{post.platform}</Badge>
                    {post.tone && <Badge>{post.tone}</Badge>}
                    {post.language && <Badge>{post.language}</Badge>}
                    {post.is_favourite && <span className="fade-in" style={{ color: C.gold, fontSize: 16 }}>★</span>}
                  </div>
                  <span style={{ fontSize: 13, color: C.t2, fontVariantNumeric: "tabular-nums" }}>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>

                <div style={{
                  fontSize: 15, color: C.t0, lineHeight: 1.75, marginBottom: "1rem",
                  whiteSpace: "pre-line", position: 'relative',
                  ...(isExp ? {} : {
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 3, WebkitBoxOrient: "vertical"
                  })
                }}>
                  {post.content}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, position: 'relative' }}>
                  {post.content?.split("\n").length > 3 && (
                    <button onClick={() => setExpanded(isExp ? null : post.id)}
                      style={{ fontSize: 13, color: C.gold, padding: 0, fontWeight: 600 }}>
                      {isExp ? "Collapse ↑" : "Read Full Post ↓"}
                    </button>
                  )}

                  <div style={{ flex: 1 }} />

                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn size="sm" v="outline" onClick={() => copy(post)}>
                      {copied === post.id ? "Copied ✓" : "Copy"}
                    </Btn>
                    <Btn size="sm" v="outline" onClick={() => recreate(post)}>Recreate</Btn>
                    <Btn size="sm" v="ghost" onClick={() => toggleFav(post.id)}>
                      {post.is_favourite ? "★" : "☆"}
                    </Btn>
                    <Btn size="sm" v="danger" onClick={() => del(post.id)}>Delete</Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   POST MAKER
═══════════════════════════════════════════════════════════ */
const PostMaker = ({ user, brand: brandProp, prefill, setPrefill, onPostsUpdate }) => {
  const [plats, setPlats] = useState({ linkedin: true, instagram: false, facebook: false, twitter: false });
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [file, setFile] = useState(null);
  const [goal, setGoal] = useState("Engagement");
  const [tone, setTone] = useState("");
  const [postSize, setPostSize] = useState("Medium");
  const [mentions, setMentions] = useState("");
  const [imageNeed, setImageNeed] = useState("not");

  const [loading, setLoading] = useState(false);
  const [outputs, setOutputs] = useState({});
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    if (prefill?.topic) { setContext(prefill.topic); setPrefill(null); }
  }, [prefill]);

  const brand = brandProp || {};
  const activePlats = Object.entries(plats)
    .filter(([k, v]) => v && PLATFORMS.find(p => p.id === k)?.active).map(([k]) => k);
  const canGen = context.trim().length > 2 && activePlats.length > 0 && !loading;

  const callAPI = async (platform) => {
    const bCtx = `BRAND CONTEXT:
- Name: ${brand.brand_name}
- Type: ${brand.brand_type?.join(", ")}
- Industry: ${brand.industry?.join(", ")}
- Audience: ${brand.target_audience?.join(", ")}
- Core Voice: ${brand.tone?.join(", ")}
- Default CTA: ${brand.default_cta}
- Visual ID: ${brand.visual_identity}
- Constraints: ${brand.constraints}`;

    const pCtx = `POST OBJECTIVE:
- Title/Hook: ${title}
- Core Message: ${context}
- Goal: ${goal}
- Post Size: ${postSize}
- Current Tone Override: ${tone || "Use Core Voice"}
- Mentions/Tags: ${mentions}`;

    const systemPrompt = store.get(`adm_prompt_${platform}`,
      platform === 'linkedin' ? LI_SYS :
        platform === 'instagram' ? IG_SYS :
          platform === 'facebook' ? FB_SYS :
            platform === 'twitter' ? TW_SYS : LI_SYS
    );

    const fd = new FormData();
    fd.append('event', 'post_requested');
    fd.append('platform', platform);
    fd.append('system_prompt', systemPrompt);
    
    // Send all platform prompts
    fd.append('li_prompt', store.get('adm_prompt_linkedin', LI_SYS));
    fd.append('ig_prompt', store.get('adm_prompt_instagram', IG_SYS));
    fd.append('fb_prompt', store.get('adm_prompt_facebook', FB_SYS));
    fd.append('tw_prompt', store.get('adm_prompt_twitter', TW_SYS));

    fd.append('brand_context', bCtx);
    fd.append('post_context', pCtx);

    // User Info
    fd.append('user_id', user.id);
    fd.append('user_email', user.email);

    // Brand Info (Flattened)
    fd.append('brand_name', brand.brand_name || "");
    fd.append('brand_type', (brand.brand_type || []).join(", "));
    fd.append('industry', (brand.industry || []).join(", "));
    fd.append('audience', (brand.target_audience || []).join(", "));
    fd.append('brand_tone', (brand.tone || []).join(", "));
    fd.append('default_cta', brand.default_cta || "");
    fd.append('visual_identity', brand.visual_identity || "");
    fd.append('constraints', brand.constraints || "");

    // Request Info (Flattened)
    fd.append('title', title);
    fd.append('context', context);
    fd.append('goal', goal);
    fd.append('tone', tone || (brand.tone?.[0]) || "Professional");
    fd.append('post_size', postSize);
    fd.append('mentions', mentions || "");
    fd.append('image_need', imageNeed);

    fd.append('file_attached', file ? 'yes' : 'no');
    if (file) {
      fd.append('file', file);
    }

    const n8nResponse = await sendWebhook('post_maker', fd);

    // Check if there's an error in the webhook call
    if (n8nResponse?.error) {
      throw new Error(n8nResponse.error);
    }

    // --- NEW: HANDLE NESTED n8n RESPONSE ---
    let finalData = n8nResponse;
    // n8n often returns an array [ { ... } ], so take the first item
    if (Array.isArray(finalData)) {
      finalData = finalData[0];
    }
    // If the data is nested inside an 'output' object, extract it
    if (finalData && finalData.output) {
      finalData = finalData.output;
    }

    if (finalData && finalData.post) {
      return {
        post: finalData.post,
        hashtags: finalData.hashtags || [],
        best_time: finalData.best_time || "Not specified",
        tips: finalData.tips || []
      };
    }

    throw new Error(`n8n থেকে সঠিক ফরম্যাটে ডাটা পাওয়া যায়নি। Webhook response-এ এসেছে: ${JSON.stringify(n8nResponse)}`);
  };

  const generate = async () => {
    if (!canGen) return;
    setLoading(true); setErr(""); setOutputs({});
    try {
      const results = {};
      for (const p of activePlats) {
        results[p] = await callAPI(p);
      }
      setOutputs(results);

      const newPosts = [];
      for (const [platform, out] of Object.entries(results)) {
        // Ensure hashtags is an array (even if n8n sends a comma-separated string)
        let finalHashtags = out.hashtags || [];
        if (typeof finalHashtags === 'string') {
          finalHashtags = finalHashtags.split(',').map(s => s.trim().replace(/^#/, ''));
        }

        newPosts.push({
          user_id: user.id,
          platform,
          content: out.post,
          hashtags: finalHashtags,
          tone: tone || brand.tone?.[0] || "Professional",
          purpose: goal,
          post_size: postSize,
          is_favourite: false
        });
      }

      const { data, error: postErr } = await supabase.from('posts').insert(newPosts).select();

      if (postErr) {
        console.error('[PostAI] Supabase Insert Error:', postErr);
        // Special check for foreign key or missing column errors
        if (postErr.code === '42703') setErr("Error: ডাটাবেসে কোনো একটি কলাম মিসিং আছে। দয়া করে SQL স্ক্রিপ্টটি রান করুন।");
        else if (postErr.code === '23503') setErr("Error: User ID সঠিক নয়। লগআউট করে আবার লগইন করুন।");
        else setErr(`সেভ করতে সমস্যা হয়েছে: ${postErr.message}`);
        throw postErr;
      }


      if (onPostsUpdate) {
        const { data: allPosts } = await supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
        onPostsUpdate(allPosts || []);
      }
    } catch (e) {
      if (!err) setErr(e.message || "n8n কানেকশন বা জেনারেশনে সমস্যা হয়েছে।");
      console.error(e);
    }
    setLoading(false);
  };

  const copy = (platform, out) => {
    const text = out.post + "\n\n" + (out.hashtags || []).map(h => `#${h.replace(/^#/, "")}`).join(" ");
    navigator.clipboard?.writeText(text);
    setCopied(platform); setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fade-in">
      <SectionHead>Post Maker</SectionHead>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }}>

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Card>
            <Label>Platforms</Label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {PLATFORMS.map(p => (
                <PlatformBtn key={p.id} {...p} on={plats[p.id]}
                  onToggle={() => setPlats(prev => ({ ...prev, [p.id]: !prev[p.id] }))} />
              ))}
            </div>
          </Card>

          <Card>
            <Label sx={{ marginBottom: 12 }}>Main Input</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <FloatingInput label="Post Title / Working Headline" value={title} onChange={e => setTitle(e.target.value)} />
              <FloatingInput label="Raw Context / Core Message" value={context} onChange={e => setContext(e.target.value)} isTextArea />

              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: `1px dashed ${C.brd}`, marginTop: 8 }}>
                <span style={{ fontSize: 13, color: C.t2 }}>Upload Context (PDF/Img)</span>
                <input type="file" onChange={e => setFile(e.target.files[0])} style={{ display: "none" }} id="f-up" />
                <label htmlFor="f-up" style={{ fontSize: 13, color: C.gold, cursor: "pointer", marginLeft: "auto", fontWeight: 600 }}>
                  {file ? file.name : "Browse Files"}
                </label>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Card style={{ flex: 1 }}>
            <Label sx={{ marginBottom: 12 }}>Post Strategy</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              <div>
                <Label sx={{ fontSize: 12, opacity: 0.6 }}>Primary Goal</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {GOALS.map(g => (
                    <button key={g} onClick={() => setGoal(g)} style={{
                      padding: "7px 14px", borderRadius: 6, fontSize: 13,
                      border: `1px solid ${goal === g ? C.gold : C.brd}`,
                      background: goal === g ? C.ga(.1) : "transparent",
                      color: goal === g ? C.gold : C.t1
                    }}>{g}</button>
                  ))}
                </div>
              </div>

              <div>
                <Label sx={{ fontSize: 12, opacity: 0.6 }}>Post Size</Label>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  {["Short", "Medium", "Long"].map(len => (
                    <button key={len} onClick={() => setPostSize(len)} style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13, cursor: "pointer",
                      border: `1px solid ${postSize === len ? C.gold : C.brd}`,
                      background: postSize === len ? C.ga(.12) : "transparent",
                      color: postSize === len ? C.gold : C.t1,
                      fontWeight: postSize === len ? 600 : 400,
                      transition: "all .2s",
                      boxShadow: postSize === len ? `0 0 10px ${C.ga(.15)}` : "none"
                    }}>
                      {len === "Short" ? "✦ Short" : len === "Medium" ? "◈ Medium" : "⬡ Long"}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: C.t2, marginTop: 5, opacity: 0.7 }}>
                  Short ≈ 100w &nbsp;·&nbsp; Medium ≈ 250w &nbsp;·&nbsp; Long ≈ 450w+
                </div>
              </div>

              <div>
                <Label sx={{ fontSize: 12, opacity: 0.6 }}>Generate AI Image?</Label>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button onClick={() => setImageNeed("yes")} style={{
                    padding: "6px 12px", borderRadius: 6, fontSize: 13, cursor: "pointer",
                    border: `1px solid ${imageNeed === 'yes' ? C.gold : C.brd}`,
                    background: imageNeed === 'yes' ? C.ga(.1) : "transparent",
                    color: imageNeed === 'yes' ? C.gold : C.t1
                  }}>Yes</button>
                  <button onClick={() => setImageNeed("not")} style={{
                    padding: "6px 12px", borderRadius: 6, fontSize: 13, cursor: "pointer",
                    border: `1px solid ${imageNeed === 'not' ? C.gold : C.brd}`,
                    background: imageNeed === 'not' ? C.ga(.1) : "transparent",
                    color: imageNeed === 'not' ? C.gold : C.t1
                  }}>No</button>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <Label sx={{ fontSize: 12, opacity: 0.6 }}>Tone Override (Optional)</Label>
                <div style={{ position: "relative" }}>
                  <select value={tone} onChange={e => setTone(e.target.value)}>
                    <option value="">Default Brand Voice</option>
                    {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.t2, pointerEvents: "none", fontSize: 12 }}>▾</div>
                </div>
              </div>

              <FloatingInput label="Specific Mentions & Tags (Optional)" value={mentions} onChange={e => setMentions(e.target.value)} />
            </div>

            <Btn v="gold" full onClick={generate} disabled={!canGen} style={{ marginTop: "1.5rem", height: 44 }}>
              {loading ? "Analyzing Context & Generating..." : "Create High-Performance Post"}
            </Btn>
            {err && <div style={{ color: C.red, fontSize: 14, marginTop: 10, textAlign: "center" }}>{err}</div>}
          </Card>
        </div>
      </div>

      {Object.keys(outputs).length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <SectionHead>Generated Content</SectionHead>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(400px,1fr))", gap: "1.25rem" }}>
            {Object.entries(outputs).map(([p, out]) => (
              <Card key={p}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <Badge color="gold">{p.toUpperCase()}</Badge>
                  <Btn size="sm" v="outline" onClick={() => copy(p, out)}>
                    {copied === p ? "Copied ✓" : "Copy"}
                  </Btn>
                </div>
                <div style={{ fontSize: 15, color: C.t1, lineHeight: 1.8, whiteSpace: "pre-wrap", marginBottom: "1.25rem" }}>
                  {out.post}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
                  {out.hashtags?.map(h => <Badge key={h}>#{h.replace(/^#/, "")}</Badge>)}
                </div>
                <div style={{ padding: "0.75rem", background: C.bg3, borderRadius: 8, fontSize: 14, border: `1px solid ${C.brd}` }}>
                  <div style={{ color: C.gold, fontWeight: 500, marginBottom: 4 }}>Strategy Insight:</div>
                  {out.tips?.map((t, i) => <div key={i} style={{ color: C.t2, marginBottom: 2 }}>• {t}</div>)}
                  <div style={{ marginTop: 6, color: C.t1, fontSize: 13 }}>
                    Best time: <span style={{ color: C.t0 }}>{out.best_time}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   IDEA GENERATOR
═══════════════════════════════════════════════════════════ */
const CONTENT_PILLARS = ["Authority/Value", "Personal Branding", "Hot Take/Opinion", "Social Proof", "Future/Trends", "AI Chose"];
const INTENTS = ["Profile Visit", "Lead Gen", "Authority", "Newsletter/Link", "AI Chose"];
const HOOKS = ["How-to", "Shocking", "Story", "Data", "AI Chose"];

const ChipSelector = ({ options, value, onChange, otherValue, onOtherChange, label }) => {
  const hasOther = value === "__other__";
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: hasOther ? 8 : 0 }}>
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)} style={{
            padding: "8px 16px", borderRadius: 10, fontSize: 13,
            border: `1px solid ${value === opt ? C.ga(.5) : C.brd}`,
            background: value === opt ? C.ga(.15) : "rgba(255,255,255,0.02)",
            color: value === opt ? C.gold : C.t1,
            fontWeight: value === opt ? 600 : 400, transition: "all .2s",
            boxShadow: value === opt ? `0 0 12px ${C.ga(.15)}` : "none"
          }}>
            {opt}
          </button>
        ))}
        <button onClick={() => onChange("__other__")} style={{
          padding: "8px 16px", borderRadius: 10, fontSize: 13,
          border: `1px solid ${hasOther ? C.ga(.5) : C.brd}`,
          background: hasOther ? C.ga(.15) : "rgba(255,255,255,0.02)",
          color: hasOther ? C.gold : C.t1,
          fontWeight: hasOther ? 600 : 400, transition: "all .2s"
        }}>
          Other
        </button>
      </div>
      {hasOther && (
        <FloatingInput label="Custom value..." value={otherValue} onChange={e => onOtherChange(e.target.value)} />
      )}
    </div>
  );
};

const IdeaGenerator = ({ user, brand: brandProp, setPage, setPrefill }) => {
  const [pillar, setPillar] = useState("AI Chose");
  const [pillarOther, setPillarOther] = useState("");
  const [intent, setIntent] = useState("AI Chose");
  const [intentOther, setIntentOther] = useState("");
  const [hook, setHook] = useState("AI Chose");
  const [hookOther, setHookOther] = useState("");
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const brand = brandProp || {};

  const getVal = (sel, other) => sel === "__other__" ? (other || "Custom") : sel;

  const generate = async () => {
    setLoading(true); setErr(""); setIdeas([]);
    try {
      const fd = new FormData();
      fd.append('event', 'ideas_requested');

      // Basic Info
      fd.append('user_id', user?.id || "");
      fd.append('user_email', user?.email || "");
      fd.append('brand_name', brand.brand_name || "");

      // Idea Generation Fields
      fd.append('content_pillar', getVal(pillar, pillarOther));
      fd.append('specific_intent', getVal(intent, intentOther));
      fd.append('hook_type', getVal(hook, hookOther));
      fd.append('context', input || 'Generic brand awareness');

      fd.append('file_attached', file ? 'yes' : 'no');
      if (file) {
        fd.append('file', file);
      }

      const n8nResponse = await sendWebhook('idea_generator', fd);

      if (n8nResponse?.error) {
        throw new Error(n8nResponse.error);
      }

      // Handle nested n8n response formats
      let finalData = n8nResponse;
      if (Array.isArray(finalData) && finalData.length > 0) {
        if (finalData[0].topic || finalData[0].id) { setIdeas(finalData); setLoading(false); return; }
        if (finalData[0].output && Array.isArray(finalData[0].output)) { setIdeas(finalData[0].output); setLoading(false); return; }
        finalData = finalData[0];
      }
      if (finalData?.output && Array.isArray(finalData.output)) { setIdeas(finalData.output); setLoading(false); return; }
      if (finalData && Array.isArray(finalData.ideas)) { setIdeas(finalData.ideas); setLoading(false); return; }
      throw new Error('n8n response check korun.');
    } catch (e) { console.error(e); setErr(e.message || 'n8n connection error.'); }
    setLoading(false);
  };

  const use = (idea) => {
    setPrefill({ topic: idea.topic + ' -- ' + idea.angle + '\n\nHook: ' + idea.hook });
    setPage('post-maker');
  };

  return (
    <div className="fade-in">
      <SectionHead>Idea Generator</SectionHead>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card>
            <ChipSelector label="Content Pillar" options={CONTENT_PILLARS} value={pillar} onChange={setPillar} otherValue={pillarOther} onOtherChange={setPillarOther} />
          </Card>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <FloatingInput label="Draft/Topic/Article Content" value={input} onChange={e => setInput(e.target.value)} isTextArea />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: `1px dashed ${C.brd}`, marginTop: 8 }}>
                <span style={{ fontSize: 13, color: C.t2 }}>Reference File (PDF/Img)</span>
                <input type="file" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} id="i-up" />
                <label htmlFor="i-up" style={{ fontSize: 13, color: C.gold, cursor: 'pointer', marginLeft: 'auto', fontWeight: 600 }}>{file ? file.name : 'Browse Files'}</label>
              </div>
            </div>
          </Card>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card><ChipSelector label="Specific Intent" options={INTENTS} value={intent} onChange={setIntent} otherValue={intentOther} onOtherChange={setIntentOther} /></Card>
          <Card><ChipSelector label="Hook Type" options={HOOKS} value={hook} onChange={setHook} otherValue={hookOther} onOtherChange={setHookOther} /></Card>
        </div>
      </div>
      <Btn v="gold" full onClick={generate} disabled={loading} size="lg" style={{ marginBottom: '2rem' }}>
        {loading ? 'Brainstorming ideas...' : '✦ Generate 6 Strategic Ideas'}
      </Btn>
      {err && <div style={{ fontSize: 14, color: C.red, marginBottom: '1rem', padding: '12px 16px', background: 'rgba(217,88,88,.05)', borderRadius: 10 }}>{err}</div>}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: C.t1, marginBottom: 8 }}>Analyzing your brand...</div>
          <div style={{ fontSize: 14, color: C.t2 }}>Crafting 6 high-performance content angles</div>
        </div>
      )}
      {ideas.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
            <div style={{ width: 32, height: 2, borderRadius: 2 }} className="gold-shimmer" />
            <div style={{ fontSize: 13, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Click any idea to open in Post Maker</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {ideas.map((idea, i) => (
              <Card key={idea.id || i} onClick={() => use(idea)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ minWidth: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.ga(.12), color: C.gold, fontSize: 14, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.t0, marginBottom: 6 }}>{idea.topic}</div>
                    <div style={{ fontSize: 13, color: C.t1, marginBottom: 8 }}>{idea.angle}</div>
                    <div style={{ fontSize: 13, color: C.gold, fontStyle: 'italic', lineHeight: 1.5, borderLeft: `2px solid ${C.ga(.3)}`, paddingLeft: 10 }}>"{idea.hook}"</div>
                  </div>
                  <div style={{ color: C.gold, fontSize: 18, opacity: 0.6, marginTop: 4, flexShrink: 0 }}>→</div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};



/* ═══════════════════════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════════════════════ */
const Settings = ({ user, brand: brandProp, onBrandUpdate }) => {
  const [brand, setBrand] = useState(brandProp || {});
  const [training, setTraining] = useState("");
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("brand");

  const MCQ = [
    { k: "brand_type", q: "Brand Type", opts: ["Personal Brand", "Business/Startup", "Agency/Service Provider", "E-commerce/Product Based", "Community/NGO"], multi: true },
    { k: "industry", q: "Industry", opts: ["Technology & Software", "AI & Automation", "Education & E-learning", "Health & Wellness", "Finance & Real Estate", "E-commerce & Retail", "Marketing & Creative Agency", "Travel & Lifestyle"], multi: true },
    { k: "target_audience", q: "Target Audience", opts: ["Students & Learners", "Small Business Owners", "Corporate Professionals", "CEOs & Decision Makers", "Tech Enthusiasts", "General Public"], multi: true },
    { k: "tone", q: "Core Brand Voice", opts: ["Professional & Authoritative", "Friendly & Conversational", "Witty & Humorous", "Inspirational & Bold", "Minimalist & Direct"], multi: true },
  ];

  const handleToggle = (k, opt) => {
    setBrand(prev => {
      const current = prev[k] || [];
      const next = current.includes(opt) ? current.filter(x => x !== opt) : [...current, opt];
      return { ...prev, [k]: next };
    });
  };

  const save = async () => {
    const updated = training.length > 10
      ? { ...brand, trained: true }
      : brand;
    const updateData = {
      brand_name: updated.brand_name,
      brand_type: updated.brand_type,
      industry: updated.industry,
      target_audience: updated.target_audience,
      tone: updated.tone,
      default_cta: updated.default_cta,
      visual_identity: updated.visual_identity,
      constraints: updated.constraints,
      trained: updated.trained || false,
      user_id: user.id,
    };
    // Use upsert so it works whether brand row exists or not
    await supabase.from('brands').upsert(updateData, { onConflict: 'user_id' });
    setBrand(updated); setTraining("");
    if (onBrandUpdate) onBrandUpdate(updated);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fade-in">
      <SectionHead>Settings</SectionHead>
      <div style={{ display: "flex", marginBottom: "2rem", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {[{ id: "brand", label: "Brand Identity" }, { id: "training", label: "Deep Knowledge" }, { id: "plan", label: "Strategy Plan" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 24px", fontSize: 14, fontWeight: 600, borderRadius: 10,
            background: tab === t.id ? C.gradGold : "transparent",
            color: tab === t.id ? "#000" : C.t2,
            transition: "all .25s", whiteSpace: "nowrap"
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "brand" && (
        <Card style={{ padding: "2.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <FloatingInput label="Brand or Project Name" value={brand.brand_name || ""} onChange={e => setBrand(b => ({ ...b, brand_name: e.target.value }))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem" }}>
              {MCQ.map(({ k, q, opts }) => (
                <div key={k}>
                  <Label>{q}</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {opts.map(opt => {
                      const isSel = brand[k]?.includes(opt);
                      return (
                        <button key={opt} onClick={() => handleToggle(k, opt)} style={{
                          padding: "7px 14px", borderRadius: 10, fontSize: 13,
                          border: `1px solid ${isSel ? C.ga(.5) : C.brd}`,
                          background: isSel ? C.ga(.15) : "rgba(255,255,255,0.02)",
                          color: isSel ? C.gold : C.t1, transition: "all .2s",
                          boxShadow: isSel ? `0 0 10px ${C.ga(.15)}` : "none"
                        }}>{opt}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <FloatingInput label="Default Call-to-Action" value={brand.default_cta || ""} onChange={e => setBrand(b => ({ ...b, default_cta: e.target.value }))} />
              <FloatingInput label="Visual Identity Notes" value={brand.visual_identity || ""} onChange={e => setBrand(b => ({ ...b, visual_identity: e.target.value }))} />
            </div>
            <FloatingInput label="Negative Constraints (Things to avoid)" value={brand.constraints || ""} onChange={e => setBrand(b => ({ ...b, constraints: e.target.value }))} isTextArea />
            <Btn v="gold" onClick={save} size="lg" style={{ alignSelf: "flex-start" }}>
              {saved ? "✓ Saved Successfully" : "Save Brand Profile"}
            </Btn>
          </div>
        </Card>
      )}

      {tab === "training" && (
        <Card style={{ padding: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, color: C.t0, marginBottom: 4 }}>AI Training</div>
              <div style={{ fontSize: 14, color: C.t2 }}>Make AI sound exactly like you</div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <Badge color={brand.trained ? "green" : "default"}>{brand.trained ? "✓ Trained" : "Not Trained"}</Badge>
            </div>
          </div>
          <p style={{ fontSize: 14, color: C.t2, marginBottom: "1.5rem", lineHeight: 1.7 }}>
            Paste 5–10 of your past posts so the AI can learn your unique writing style and voice.
          </p>
          <textarea value={training} onChange={e => setTraining(e.target.value)}
            placeholder="Paste your past LinkedIn posts here..."
            style={{ minHeight: 200, marginBottom: "1.5rem" }} />
          <Btn v="gold" onClick={save} size="lg">{saved ? "✓ Training Updated" : "Update Brand Training"}</Btn>
        </Card>
      )}

      {tab === "plan" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.5rem" }}>
          {[
            { name: "Free", price: "৳0 / mo", limit: "20 posts", features: ["LinkedIn only", "Basic AI", "Email support"] },
            { name: "Starter", price: "৳499 / mo", limit: "100 posts", features: ["All platforms", "Priority AI", "Image gen", "Brand training"], pop: true },
            { name: "Pro", price: "৳999 / mo", limit: "Unlimited", features: ["All platforms", "Unlimited posts", "Full image gen", "Priority support", "Analytics hints"] },
          ].map(plan => (
            <Card key={plan.name} style={{
              padding: "2rem", textAlign: "center",
              border: `1px solid ${plan.pop ? C.ga(.5) : C.brd}`,
              boxShadow: plan.pop ? `0 0 30px ${C.ga(.08)}` : "none"
            }}>
              {plan.pop && <div style={{ marginBottom: 12 }}><Badge color="gold">✦ Most Popular</Badge></div>}
              <div style={{ fontSize: 20, fontWeight: 700, color: C.t0, marginBottom: 6 }}>{plan.name}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, color: plan.pop ? C.gold : C.t1, marginBottom: 4 }}>{plan.price}</div>
              <div style={{ fontSize: 13, color: C.t2, marginBottom: "1.5rem" }}>{plan.limit} / month</div>
              <div style={{ borderTop: `1px solid ${C.brd}`, paddingTop: "1.5rem", marginBottom: "1.5rem" }}>
                {plan.features.map(f => (
                  <div key={f} style={{ fontSize: 13, color: C.t1, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
                    <span style={{ color: C.green, fontSize: 12 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <Btn v={plan.pop ? "gold" : "outline"} full size="sm">
                {plan.name === user?.plan ? "⬤ Current Plan" : "Upgrade →"}
              </Btn>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ADMIN PANEL
═══════════════════════════════════════════════════════════ */
const AdminPanel = ({ onExit, posts }) => {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [passErr, setPassErr] = useState("");
  const [sec, setSec] = useState("stats");
  const defaultAdmin = import.meta.env.VITE_ADMIN_PASSWORD || "admin_postai_2026";
  const [adminKey, setAdminKey] = useState(() => {
    const p = store.get("adm_password");
    if (!p) return defaultAdmin;
    try { return atob(p); } catch(e) { store.set("adm_password", btoa(p)); return p; }
  });
  const [newPass, setNewPass] = useState("");
  const [passSaved, setPassSaved] = useState(false);

  const [prompts, setPrompts] = useState({
    linkedin: store.get("adm_prompt_linkedin", LI_SYS),
    instagram: store.get("adm_prompt_instagram", IG_SYS),
    facebook: store.get("adm_prompt_facebook", FB_SYS),
    twitter: store.get("adm_prompt_twitter", TW_SYS),
  });
  const [activeProm, setActiveProm] = useState("linkedin");
  const [promSaved, setPromSaved] = useState(false);
  const [testOut, setTestOut] = useState("");
  const [testing, setTesting] = useState(false);

  const [webhooks, setWebhooks] = useState(store.get("adm_webhooks", {
    post_maker: "https://n8n.yourdomain.com/webhook/post-maker",
    multi_platform: "https://n8n.yourdomain.com/webhook/multi-platform",
    idea_generator: "https://n8n.yourdomain.com/webhook/idea-generator",
    image_gen: "https://n8n.yourdomain.com/webhook/image-gen",
    onboarding: "https://n8n.yourdomain.com/webhook/onboarding",
    training_update: "https://n8n.yourdomain.com/webhook/training-update",
    admin_config: "https://n8n.yourdomain.com/webhook/admin-config",
  }));
  const [whSaved, setWhSaved] = useState(null);

  const [flags, setFlags] = useState(store.get("adm_flags", {
    linkedin: true, instagram: false, facebook: false, twitter: false,
    image_gen: true, maintenance: false,
  }));
  const [model, setModel] = useState("claude-sonnet-4-5");
  const [flagSaved, setFlagSaved] = useState(false);

  const today = new Date().toDateString();
  const mockUsers = [
    { id: 1, email: "demo@postai.app", plan: "Free", usage: 7, img_gen: 2, trained: true, joined: "2025-01-10" },
    { id: 2, email: "founder@startup.bd", plan: "Starter", usage: 42, img_gen: 5, trained: false, joined: "2025-01-15" },
    { id: 3, email: "agency@digital.com", plan: "Pro", usage: 89, img_gen: 24, trained: true, joined: "2024-12-28" },
  ];

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans,sans-serif", color: C.t0 }}>
        <Card style={{ width: 360 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: C.gold, marginBottom: "1.5rem" }}>
            Admin Panel
          </div>

          <Label>Password</Label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (pass === adminKey ? setAuthed(true) : setPassErr("Wrong password."))}
            placeholder="Enter admin password" style={{ marginTop: 8, marginBottom: "0.75rem" }} />
          {passErr && <div style={{ fontSize: 14, color: C.red, marginBottom: "0.75rem" }}>{passErr}</div>}
          <div style={{ display: "flex", gap: 10, marginBottom: "1.25rem" }}>
            <Btn v="gold" onClick={() => pass === adminKey ? setAuthed(true) : setPassErr("Wrong password.")}>
              Enter →
            </Btn>
            <Btn v="ghost" onClick={onExit}>← Back</Btn>
          </div>
          
          <div style={{ borderTop: `1px solid ${C.brd}`, paddingTop: "1rem", textAlign: "center" }}>
            <button 
              onClick={() => {
                const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@postai.app";
                const input = prompt("Verify Identity: Please enter your Admin Email address:");
                if (!input) return;
                
                if (input.trim() !== adminEmail) {
                  alert("❌ Invalid admin email. Access denied.");
                  return;
                }
                
                // If email matches, simply reset back to default
                store.set("adm_password", btoa(defaultAdmin));
                setAdminKey(defaultAdmin);
                setPassErr("");
                alert("✅ Identity verified! Your password has been reset to the origin default.");
              }}
              style={{ fontSize: 13, color: C.t2, textDecoration: "underline", opacity: 0.8, cursor: "pointer" }}
            >
              Forgot password? Reset instantly
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const SECTIONS = [
    { id: "stats", label: "Stats" },
    { id: "webhooks", label: "Webhooks" },
    { id: "prompts", label: "Prompts" },
    { id: "users", label: "Users" },
    { id: "config", label: "Config" },
  ];

  const savePrompt = () => {
    store.set(`adm_prompt_${activeProm}`, prompts[activeProm]);
    setPromSaved(true); setTimeout(() => setPromSaved(false), 2000);
  };
  const testPrompt = async () => {
    setTesting(true); setTestOut("");
    try {
      // Proxied through n8n to avoid browser CORS and exposing API keys
      const res = await sendWebhook("admin_config", {
        event: "test_prompt",
        platform: activeProm,
        system_prompt: prompts[activeProm],
        test_message: "Topic: AI trends in Bangladesh 2025 · Tone: Casual"
      });
      
      if (res?.error) {
        setTestOut("Webhook Test Failed: " + res.error + "\nEnsure your 'admin_config' workflow handles the 'test_prompt' event.");
      } else {
        const finalContent = res?.content || res?.text || res?.data || JSON.stringify(res, null, 2);
        setTestOut(finalContent);
      }
    } catch(e) { setTestOut("Error: " + e.message); }
    setTesting(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg0, fontFamily: "DM Sans,sans-serif", color: C.t0 }}>
      <div style={{
        width: 200, background: C.bg1, borderRight: `1px solid ${C.brd}`,
        position: "fixed", top: 0, left: 0, bottom: 0, display: "flex", flexDirection: "column"
      }}>
        <div style={{ padding: "1.25rem", borderBottom: `1px solid ${C.brd}` }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: C.gold }}>PostAI Admin</div>
          <div style={{ fontSize: 13, color: C.t2, marginTop: 2 }}>/admin · restricted</div>
        </div>
        <nav style={{ padding: "0.75rem 0.5rem", flex: 1 }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSec(s.id)} style={{
              width: "100%", textAlign: "left", padding: "8px 14px", borderRadius: 8,
              background: sec === s.id ? C.ga(.1) : "transparent",
              color: sec === s.id ? C.gold : C.t1, fontSize: 15, marginBottom: 2,
              borderLeft: sec === s.id ? `2px solid ${C.gold}` : "2px solid transparent"
            }}>
              {s.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "1rem", borderTop: `1px solid ${C.brd}` }}>
          <Btn v="ghost" onClick={onExit} size="sm" style={{ color: C.t2, fontSize: 14 }}>← Exit admin</Btn>
        </div>
      </div>

      <div style={{ marginLeft: 200, flex: 1, padding: "2rem 2.5rem", minHeight: "100vh" }}>

        {sec === "stats" && (
          <>
            <SectionHead>Stats Dashboard</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: "1.5rem" }}>
              <StatCard label="Posts today" value={posts.filter(p => new Date(p.created_at).toDateString() === today).length} />
              <StatCard label="Total posts" value={posts.length} />
              <StatCard label="Total users" value={mockUsers.length} />
              <StatCard label="Trained users" value={mockUsers.filter(u => u.trained).length} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <Card>
                <Label sx={{ marginBottom: "1rem" }}>Posts by platform</Label>
                {["linkedin", "instagram", "facebook", "twitter"].map(p => {
                  const n = posts.filter(x => x.platform === p).length;
                  const pct = posts.length ? Math.round((n / posts.length) * 100) : 0;
                  return (
                    <div key={p} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.t1, marginBottom: 4 }}>
                        <span style={{ textTransform: "capitalize" }}>{p}</span>
                        <span>{n} posts</span>
                      </div>
                      <div style={{ height: 3, background: C.bg4, borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${pct || 4}%`, background: C.gold, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </Card>
              <Card>
                <Label sx={{ marginBottom: "1rem" }}>Users by plan</Label>
                {["Free", "Starter", "Pro"].map(plan => {
                  const n = mockUsers.filter(u => u.plan === plan).length;
                  return (
                    <div key={plan} style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: 15, padding: "9px 0", borderBottom: `1px solid ${C.brd}`
                    }}>
                      <span style={{ color: C.t1 }}>{plan}</span>
                      <span style={{ color: C.t0 }}>{n} user{n !== 1 ? "s" : ""}</span>
                    </div>
                  );
                })}
                <div style={{ marginTop: "1rem", fontSize: 14, color: C.t2 }}>
                  Training completion: {Math.round((mockUsers.filter(u => u.trained).length / mockUsers.length) * 100)}%
                </div>
              </Card>
            </div>
          </>
        )}

        {sec === "webhooks" && (
          <>
            <SectionHead>Webhook Manager</SectionHead>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(webhooks).map(([key, url]) => (
                <Card key={key} style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Label sx={{ margin: 0 }}>{key.replace(/_/g, " ")}</Label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn v="outline" size="sm" onClick={() => { store.set("adm_webhooks", webhooks); setWhSaved(key); setTimeout(() => setWhSaved(null), 2000); }}>
                        {whSaved === key ? "Saved ✓" : "Save"}
                      </Btn>
                      <Btn v="ghost" size="sm" style={{ color: C.t2 }}>Ping →</Btn>
                    </div>
                  </div>
                  <input value={url} onChange={e => setWebhooks(w => ({ ...w, [key]: e.target.value }))}
                    style={{ fontFamily: "monospace", fontSize: 14 }} />
                </Card>
              ))}
            </div>
          </>
        )}

        {sec === "prompts" && (
          <>
            <SectionHead>Expert Persona Prompt Editor</SectionHead>
            <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem" }}>
              {["linkedin", "instagram", "facebook", "twitter"].map(p => (
                <button key={p} onClick={() => setActiveProm(p)} style={{
                  padding: "8px 18px", borderRadius: 8, fontSize: 15,
                  border: `1px solid ${activeProm === p ? C.gold : C.brd}`,
                  background: activeProm === p ? C.ga(.1) : "transparent",
                  color: activeProm === p ? C.gold : C.t2
                }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <Card style={{ marginBottom: "1rem" }}>
              <textarea value={prompts[activeProm]}
                onChange={e => setPrompts(pr => ({ ...pr, [activeProm]: e.target.value }))}
                style={{ minHeight: 280, fontFamily: "monospace", fontSize: 14, marginBottom: "1rem" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <Btn v="gold" onClick={savePrompt}>{promSaved ? "Saved ✓" : "Save prompt"}</Btn>
                <Btn v="outline" onClick={testPrompt} disabled={testing}>
                  {testing ? "Testing…" : "Test with sample post"}
                </Btn>
              </div>
            </Card>
            {testOut && (
              <Card>
                <Label sx={{ marginBottom: "0.75rem" }}>Test output</Label>
                <div style={{
                  fontFamily: "monospace", fontSize: 14, color: C.t1,
                  whiteSpace: "pre-wrap", lineHeight: 1.7
                }}>{testOut}</div>
              </Card>
            )}
          </>
        )}

        {sec === "users" && (
          <>
            <SectionHead>User Management</SectionHead>
            <Card style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr>
                    {["Email", "Plan", "Posts", "Image gen", "Trained", "Joined", "Actions"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "8px 12px", color: C.t2,
                        borderBottom: `1px solid ${C.brd}`, fontWeight: 500, whiteSpace: "nowrap"
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{ padding: "10px 12px", color: C.t0 }}>{u.email}</td>
                      <td style={{ padding: "10px 12px" }}><Badge color="gold">{u.plan}</Badge></td>
                      <td style={{ padding: "10px 12px", color: C.t1 }}>{u.usage}</td>
                      <td style={{ padding: "10px 12px", color: C.t1 }}>{u.img_gen}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <Badge color={u.trained ? "green" : "default"}>{u.trained ? "Yes" : "No"}</Badge>
                      </td>
                      <td style={{ padding: "10px 12px", color: C.t2 }}>{u.joined}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn size="sm" v="ghost" style={{ color: C.t2, fontSize: 13 }}>Edit plan</Btn>
                          <Btn size="sm" v="ghost" style={{ color: C.t2, fontSize: 13 }}>Reset usage</Btn>
                          <Btn size="sm" v="danger" style={{ fontSize: 13 }}>Block</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        )}

        {sec === "config" && (
          <>
            <SectionHead>System Config & Feature Flags</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <Card>
                <Label sx={{ marginBottom: "1rem" }}>Platform flags</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {["linkedin", "instagram", "facebook", "twitter"].map(p => (
                    <div key={p} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 15, color: C.t1, textTransform: "capitalize" }}>{p}</span>
                      <Toggle checked={flags[p]} onChange={v => setFlags(f => ({ ...f, [p]: v }))} />
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <Label sx={{ marginBottom: "1rem" }}>Feature flags & AI config</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, color: C.t1 }}>Image generation</span>
                    <Toggle checked={flags.image_gen} onChange={v => setFlags(f => ({ ...f, image_gen: v }))} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, color: C.t1 }}>Maintenance mode</span>
                    <Toggle checked={flags.maintenance} onChange={v => setFlags(f => ({ ...f, maintenance: v }))} />
                  </div>
                </div>
                <Label>Claude model</Label>
                <div style={{ position: "relative", marginTop: 8, marginBottom: "1.25rem" }}>
                  <select value={model} onChange={e => setModel(e.target.value)}>
                    <option value="claude-sonnet-4-5">Claude Sonnet 4.5 (recommended)</option>
                    <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (faster)</option>
                  </select>
                  <div style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    color: C.t2, pointerEvents: "none", fontSize: 12
                  }}>▾</div>
                </div>
                <Btn v="gold" full onClick={() => { store.set("adm_flags", flags); setFlagSaved(true); setTimeout(() => setFlagSaved(false), 2000); }}>
                  {flagSaved ? "Config saved ✓" : "Save config"}
                </Btn>
              </Card>

              <Card>
                <Label sx={{ marginBottom: "1rem" }}>Security & Access</Label>
                <div style={{ fontSize: 14, color: C.t2, marginBottom: "1.25rem" }}>
                  Update your admin dashboard password.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <FloatingInput 
                    label="New Password" 
                    value={newPass} 
                    onChange={e => setNewPass(e.target.value)} 
                    type="password"
                  />
                  <Btn v="gold" full onClick={() => {
                    if (newPass.trim()) {
                      store.set("adm_password", btoa(newPass.trim()));
                      setAdminKey(newPass.trim());
                      setNewPass("");
                      setPassSaved(true);
                      setTimeout(() => setPassSaved(false), 2000);
                    }
                  }}>
                    {passSaved ? "Password Updated ✓" : "Save New Password"}
                  </Btn>
                  
                  <div style={{ borderTop: `1px solid ${C.brd}`, paddingTop: "1rem", marginTop: "0.5rem" }}>
                    <button 
                      onClick={() => {
                        if (confirm("Reset password to default?")) {
                          store.set("adm_password", btoa(defaultAdmin));
                          setAdminKey(defaultAdmin);
                          alert("Password reset to default");
                        }
                      }}
                      style={{ fontSize: 12, color: C.red, background: "none", border: "none", cursor: "pointer", opacity: 0.7 }}
                    >
                      Reset to factory default
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════════════ */
export default function App() {
  useEffect(() => injectCSS(), []);

  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState("dashboard");
  const [onboarding, setOnboarding] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [loading, setLoading] = useState(true);
  const activeSessionRef = useRef(null);

  const loadUserData = useCallback(async (userId, email) => {
    try {
      let { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!profile) {
        await supabase.from('profiles').insert({ id: userId, email, plan: 'Free', usage_count: 0 });
        profile = { id: userId, email, plan: 'Free', usage_count: 0 };
      }
      setUser({ id: userId, email, plan: profile.plan || 'Free', usage: profile.usage_count || 0 });
      const { data: brandData } = await supabase.from('brands').select('*').eq('user_id', userId).maybeSingle();
      setBrand(brandData || null);
      if (!brandData) setOnboarding(true);
      const { data: postsData } = await supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: true });
      setPosts(postsData || []);
    } catch (e) { console.error("Error loading user data:", e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (activeSessionRef.current !== session.user.id) {
          activeSessionRef.current = session.user.id;
          loadUserData(session.user.id, session.user.email);
        }
      } else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
        activeSessionRef.current = null;
        setUser(null); setBrand(null); setPosts([]); setLoading(false);
      } else if (session?.user) {
        if (activeSessionRef.current !== session.user.id) {
          activeSessionRef.current = session.user.id;
          loadUserData(session.user.id, session.user.email);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const handleLogin = async (userData) => {
    if (activeSessionRef.current !== userData.id) {
      activeSessionRef.current = userData.id;
      await loadUserData(userData.id, userData.email);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setBrand(null); setPosts([]);
  };

  const handlePostsUpdate = (updated) => {
    setPosts([...updated]);
  };

  const handleBrandUpdate = (updatedBrand) => {
    setBrand(updatedBrand);
  };

  const handleOnboardComplete = async (data) => {
    setBrand(data);
    setOnboarding(false);
    setPage("dashboard");
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(store.get('sidebar_collapsed', false));
  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    store.set('sidebar_collapsed', next);
  };
  const sidebarW = sidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

  const openAdmin = () => setAdmin(true);
  const exitAdmin = () => { setAdmin(false); };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans,sans-serif" }}>
      <div style={{ color: C.gold, fontSize: 18, fontFamily: "'Cormorant Garamond',serif" }}>Loading...</div>
    </div>
  );
  if (!user) return <AuthPage onLogin={handleLogin} />;
  // Keep onboarding strictly separate as it's a one-time structural setup
  if (onboarding) return <OnboardingPage user={user} onComplete={handleOnboardComplete} />;

  return (
    <div style={{ background: C.bg0, minHeight: "100vh", position: "relative" }}>
      {/* Admin Panel as an Overlay to keep App state alive */}
      {admin && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
          <AdminPanel onExit={exitAdmin} posts={posts} />
        </div>
      )}

      {/* Main App Container */}
      <div style={{
        display: admin ? "none" : "flex",
        minHeight: "100vh",
        fontFamily: "DM Sans,sans-serif",
        color: C.t0
      }}>
        <Sidebar page={page} setPage={setPage} user={user} onAdminClick={openAdmin} onLogout={handleLogout}
          collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

        <main style={{
          marginLeft: sidebarW, flex: 1, padding: "2.25rem 2.75rem 4rem",
          maxWidth: `calc(100vw - ${sidebarW}px)`, transition: "margin-left .25s cubic-bezier(.4,0,.2,1), max-width .25s cubic-bezier(.4,0,.2,1)"
        }}>
          {/* PERSISTENT STATE: Keep all components mounted, toggle visibility only */}
          <div style={{ display: page === "dashboard" ? "block" : "none" }}>
            <Dashboard user={user} brand={brand || {}} setPage={setPage} setPrefill={setPrefill} posts={posts} onPostsUpdate={handlePostsUpdate} />
          </div>

          <div style={{ display: page === "post-maker" ? "block" : "none" }}>
            <PostMaker user={user} brand={brand || {}} prefill={prefill} setPrefill={setPrefill} onPostsUpdate={handlePostsUpdate} />
          </div>

          <div style={{ display: page === "idea-generator" ? "block" : "none" }}>
            <IdeaGenerator user={user} brand={brand || {}} setPage={setPage} setPrefill={setPrefill} />
          </div>

          <div style={{ display: page === "settings" ? "block" : "none" }}>
            <Settings user={user} brand={brand || {}} onBrandUpdate={handleBrandUpdate} />
          </div>
        </main>
      </div>
    </div>
  );
}

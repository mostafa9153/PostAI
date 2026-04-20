import React from 'react';
import { C } from '../../lib/constants';

export const Btn = ({ children, onClick, v = "outline", disabled, full, size = "md", style: sx = {} }) => {
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

export const Card = ({ children, style: sx = {}, onClick, noGlass = false }) => (
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

export const Label = ({ children, sx = {} }) => (
  <div style={{
    fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
    color: C.t2, marginBottom: 8, ...sx
  }}>{children}</div>
);

export const FloatingInput = ({ label, type = "text", value, onChange, placeholder = " ", isTextArea = false, onKeyDown }) => (
  <div className="floating-group">
    {isTextArea ? (
      <textarea value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown} />
    ) : (
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown} />
    )}
    <label>{label}</label>
  </div>
);

export const SectionHead = ({ children }) => (
  <div style={{ marginBottom: "2rem" }} className="fade-in">
    <div style={{ width: 40, height: 3, background: C.gradGold, marginBottom: 12, borderRadius: 2 }} className="gold-shimmer" />
    <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 500, color: C.t0, letterSpacing: '0.01em' }}>
      {children}
    </h2>
  </div>
);

export const Badge = ({ children, color = "default" }) => {
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

export const Toggle = ({ checked, onChange, label }) => (
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

export const NavIcon = ({ d, size = 20, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

export const StatCard = ({ label, value, sub, progress }) => (
  <Card style={{ padding: "1.25rem" }}>
    <Label sx={{ fontSize: 11, opacity: 0.8 }}>{label}</Label>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
      <div style={{ fontSize: 24, fontWeight: 600, color: C.gold }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.t2 }}>{sub}</div>}
    </div>
    <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
      <div style={{ height: "100%", width: `${progress}%`, background: C.gradGold, borderRadius: 2, transition: "width 1s ease-out" }} />
    </div>
  </Card>
);

export const PlatformBtn = ({ id, label, active, on, onToggle }) => {
  const isSoon = !active;
  return (
    <button onClick={isSoon ? undefined : onToggle}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 16px", borderRadius: 10,
        background: on && !isSoon ? C.ga(.1) : "rgba(255,255,255,0.02)",
        color: on && !isSoon ? C.gold : C.t1,
        border: `1px solid ${on && !isSoon ? C.ga(.3) : C.brd}`,
        fontSize: 15, fontWeight: on && !isSoon ? 500 : 400,
        opacity: isSoon ? .42 : 1, cursor: isSoon ? "not-allowed" : "pointer"
      }}>
      {on && !isSoon && <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, flexShrink: 0 }} />}
      {label}
      {isSoon && <Badge color="soon">Soon</Badge>}
    </button>
  );
};

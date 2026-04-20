import React from 'react';
import { C, NAV_ITEMS, SIDEBAR_W, SIDEBAR_COLLAPSED_W } from '../lib/constants';
import { NavIcon, Badge } from './common/UIAtoms';

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

export default Sidebar;

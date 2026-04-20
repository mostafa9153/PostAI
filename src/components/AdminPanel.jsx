import React, { useState } from 'react';
import { C, LI_SYS, IG_SYS, FB_SYS, TW_SYS } from '../lib/constants';
import { Card, Label, Btn, Badge, Toggle, FloatingInput } from './common/UIAtoms';
import { store } from '../lib/utils';


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

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: C.t0, display: "flex", fontFamily: "DM Sans,sans-serif" }} className="fade-in">
      {/* Sidebar */}
      <div style={{ width: 260, borderRight: `1px solid ${C.brd}`, padding: "2rem 1.5rem", background: "#0a0a0a" }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, color: C.gold, marginBottom: "2.5rem" }}>System Console</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { id: "stats", l: "Overview Stats" },
            { id: "prompts", l: "Master Prompts" },
            { id: "webhooks", l: "Webhook Hub" },
            { id: "users", l: "User Management" },
            { id: "config", l: "System Config" },
          ].map(i => (
            <button key={i.id} onClick={() => setSec(i.id)} style={{
              width: "100%", textAlign: "left", padding: "12px 16px", borderRadius: 10,
              background: sec === i.id ? C.ga(.08) : "transparent",
              color: sec === i.id ? C.gold : C.t2,
              fontWeight: sec === i.id ? 600 : 400, transition: "all .2s"
            }}>{i.l}</button>
          ))}
          <div style={{ height: 40 }} />
          <Btn v="outline" onClick={onExit} full size="sm">Exit Console</Btn>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "3rem 4rem", overflowY: "auto" }}>
        {sec === "stats" && (
          <>
            <SectionHead>Platform Statistics</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "3rem" }}>
              {[
                { l: "Total Requests", v: "12,842", p: "+12%" },
                { l: "Active Users", v: "1,529", p: "+5%" },
                { l: "Avg Response", v: "4.2s", p: "-0.8s" },
                { l: "Token Usage", v: "4.2M", p: "89%" },
              ].map(s => (
                <Card key={s.l} style={{ padding: "1.5rem" }}>
                  <div style={{ fontSize: 13, color: C.t2, textTransform: "uppercase", marginBottom: 8 }}>{s.l}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: C.t0 }}>{s.v}</div>
                  <div style={{ fontSize: 13, color: s.p.startsWith('+') ? C.green : C.t2, marginTop: 4 }}>{s.p} vs last month</div>
                </Card>
              ))}
            </div>

            <SectionHead>Performance by Platform</SectionHead>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${C.brd}` }}>
                    {["Platform", "Total Posts", "Avg Length", "Success Rate", "Status"].map(h => (
                      <th key={h} style={{ padding: "14px 20px", fontSize: 13, fontWeight: 600, color: C.t2, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { p: "LinkedIn", t: 8421, a: "240w", s: "99.2%", st: "Operational" },
                    { p: "Instagram", t: 2150, a: "120w", s: "98.5%", st: "Operational" },
                    { p: "Facebook", t: 1240, a: "310w", s: "99.8%", st: "Operational" },
                    { p: "Twitter/X", t: 1031, a: "42w", s: "97.2%", st: "Operational" },
                  ].map(r => (
                    <tr key={r.p} style={{ borderBottom: `1px solid ${C.brd}` }}>
                      <td style={{ padding: "16px 20px", color: C.t0, fontWeight: 500 }}>{r.p}</td>
                      <td style={{ padding: "16px 20px", color: C.t1 }}>{r.t.toLocaleString()}</td>
                      <td style={{ padding: "16px 20px", color: C.t1 }}>{r.a}</td>
                      <td style={{ padding: "16px 20px", color: C.green }}>{r.s}</td>
                      <td style={{ padding: "16px 20px" }}><Badge color="green">{r.st}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        )}

        {sec === "prompts" && (
          <div style={{ maxWidth: 900 }}>
            <SectionHead>AI Master Prompts</SectionHead>
            <div style={{ display: "flex", gap: 10, marginBottom: "1.5rem" }}>
              {["linkedin", "instagram", "facebook", "twitter"].map(p => (
                <button key={p} onClick={() => setActiveProm(p)} style={{
                  padding: "8px 18px", borderRadius: 8, fontSize: 15,
                  background: activeProm === p ? C.ga(.15) : "transparent",
                  color: activeProm === p ? C.gold : C.t2,
                  border: `1px solid ${activeProm === p ? C.ga(.4) : C.brd}`,
                }}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
              ))}
            </div>
            <Card style={{ padding: "2rem" }}>
              <Label sx={{ marginBottom: 12 }}>System Prompt for {activeProm.toUpperCase()}</Label>
              <textarea value={prompts[activeProm]} onChange={e => setPrompts({ ...prompts, [activeProm]: e.target.value })}
                style={{ height: 400, fontFamily: "monospace", fontSize: 14, background: "#080808", lineHeight: 1.6 }} />
              <div style={{ display: "flex", gap: 12, marginTop: "2rem" }}>
                <Btn v="gold" onClick={() => {
                  store.set(`adm_prompt_${activeProm}`, prompts[activeProm]);
                  setPromSaved(true); setTimeout(() => setPromSaved(false), 2000);
                }}>{promSaved ? "✓ Prompt Saved" : "Save changes"}</Btn>
                <Btn v="outline" onClick={async () => {
                   alert("Test generation feature would go here. For now, prompt is saved.");
                }}>Test with live context</Btn>
              </div>
            </Card>
          </div>
        )}

        {sec === "webhooks" && (
          <div style={{ maxWidth: 800 }}>
            <SectionHead>Webhook Configuration</SectionHead>
            <Card style={{ padding: "2.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {Object.entries(webhooks).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <Label sx={{ margin: 0 }}>{k.replace('_', ' ')}</Label>
                      {whSaved === k && <Badge color="green">Saved ✓</Badge>}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <input value={v} onChange={e => setWebhooks({ ...webhooks, [k]: e.target.value })}
                        placeholder="https://n8n.yournode.com/webhook/..." />
                      <Btn v="outline" size="sm" onClick={() => {
                        const next = { ...webhooks, [k]: v };
                        setWebhooks(next);
                        store.set("adm_webhooks", next);
                        setWhSaved(k); setTimeout(() => setWhSaved(null), 2000);
                      }}>Save</Btn>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${C.brd}`, marginTop: "2.5rem", paddingTop: "2rem" }}>
                <Label>Backup endpoints</Label>
                <p style={{ fontSize: 14, color: C.t2, marginBottom: "1rem" }}>In case primary n8n instance fails, traffic routes through secondary.</p>
                <input placeholder="Secondary Node URL (Optional)" />
              </div>
            </Card>
          </div>
        )}

        {sec === "users" && (
          <>
            <SectionHead>Active Users</SectionHead>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${C.brd}` }}>
                    {["User Email", "Plan", "Posts", "Img Gen", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "14px 20px", fontSize: 13, fontWeight: 600, color: C.t2 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${C.brd}` }}>
                      <td style={{ padding: "16px 20px", color: C.t0 }}>{u.email}</td>
                      <td style={{ padding: "16px 20px" }}><Badge color={u.plan === 'Pro' ? 'gold' : 'default'}>{u.plan}</Badge></td>
                      <td style={{ padding: "16px 20px", color: C.t1 }}>{u.usage} / 20</td>
                      <td style={{ padding: "16px 20px", color: C.t1 }}>{u.img_gen}</td>
                      <td style={{ padding: "16px 20px" }}><Badge color="green">Active</Badge></td>
                      <td style={{ padding: "16px 20px" }}><Btn size="sm" v="outline">Manage</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        )}

        {sec === "config" && (
          <div style={{ maxWidth: 700 }}>
            <SectionHead>Security & Access</SectionHead>
            <Card style={{ padding: "2rem", marginBottom: "2rem" }}>
              <Label>System Password</Label>
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
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

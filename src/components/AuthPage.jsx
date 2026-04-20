import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { C } from '../lib/constants';
import { Card, FloatingInput, Btn } from './common/UIAtoms';

const AuthPage = ({ onLogin }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !pass) return setErr("Email and password required.");
    setErr(""); setLoading(true);
    const { data, error } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password: pass })
      : await supabase.auth.signUp({ email, password: pass });

    if (error) setErr(error.message);
    else if (data?.user) onLogin(data.user);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.bg0, padding: "2rem", fontFamily: "DM Sans, sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 400 }} className="fade-in">
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 600,
            color: C.gold, marginBottom: 8, letterSpacing: "-0.01em"
          }}>PostAI</div>
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

export default AuthPage;

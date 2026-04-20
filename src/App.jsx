import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from './lib/supabase';
import { C } from './lib/constants';

// Component Imports
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PostMaker from './components/PostMaker';
import IdeaGenerator from './components/IdeaGenerator';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import AuthPage from './components/AuthPage';
import OnboardingPage from './components/OnboardingPage';
import { configDebug } from './lib/supabase';

export default function App() {
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState("dashboard");
  const [onboarding, setOnboarding] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const activeSessionRef = useRef(null);

  const loadUserData = useCallback(async (userId, email) => {
    try {
      // Parallelize fetching to reduce initial load time
      const [profileRes, brandRes, postsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('brands').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
      ]);

      let profile = profileRes.data;
      if (!profile) {
        const { data: newProfile } = await supabase.from('profiles').insert({ id: userId, email, plan: 'Free', usage_count: 0 }).select().single();
        profile = newProfile;
      }

      setUser({ 
        id: userId, 
        email, 
        plan: profile?.plan || 'Free', 
        usage: profile?.usage_count || 0 
      });
      
      setBrand(brandRes.data || null);
      if (!brandRes.data) setOnboarding(true);
      setPosts(postsRes.data || []);
    } catch (e) { 
      console.error("Error loading user data:", e); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (activeSessionRef.current !== session.user.id) {
          activeSessionRef.current = session.user.id;
          loadUserData(session.user.id, session.user.email);
        }
      } else setLoading(false);
    });

    if (!supabase) return;
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="gold-shimmer" style={{ width: 40, height: 40, borderRadius: "50%", opacity: 0.5 }} />
      </div>
    );
  }

  if (!supabase) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg0, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
        <div style={{ maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🚧</div>
          <h2 style={{ color: C.gold, marginBottom: 12 }}>Configuration Missing</h2>
          <p style={{ color: C.t1, lineHeight: 1.6, marginBottom: 20 }}>Supabase API keys are missing in your environment. Please add <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> to your Vercel settings.</p>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 8, fontSize: 12, color: C.t2, fontFamily: "monospace" }}>
            Status: URL: {configDebug.url ? "✅ FOUND" : "❌ MISSING"} | KEY: {configDebug.key ? "✅ FOUND" : "❌ MISSING"}
          </div>
          <button onClick={() => window.location.reload()} style={{ marginTop: 20, color: C.gold, fontSize: 13, textDecoration: "underline" }}>Refresh Page</button>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage onLogin={(u) => loadUserData(u.id, u.email)} />;
  if (onboarding) return <OnboardingPage user={user} onComplete={(b) => { setBrand(b); setOnboarding(false); }} />;
  if (admin) return <AdminPanel onExit={() => setAdmin(false)} posts={posts} />;

  return (
    <div style={{ minHeight: "100vh", background: C.bg0, color: C.t0, fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar 
        page={page} 
        setPage={setPage} 
        user={user} 
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        onAdminClick={() => setAdmin(true)} 
        onLogout={() => supabase.auth.signOut()} 
      />

      <main style={{ 
        marginLeft: collapsed ? 56 : 228, 
        padding: "2rem 3rem", 
        transition: "margin-left .3s cubic-bezier(.4,0,.2,1)",
        minHeight: "100vh"
      }}>
        {page === "dashboard" && (
          <Dashboard 
            user={user} 
            brand={brand} 
            setPage={setPage} 
            setPrefill={setPrefill} 
            posts={posts} 
            onPostsUpdate={setPosts} 
          />
        )}
        {page === "post-maker" && (
          <PostMaker 
            user={user} 
            brand={brand} 
            prefill={prefill} 
            setPrefill={setPrefill} 
            onPostsUpdate={setPosts} 
          />
        )}
        {page === "idea-generator" && (
          <IdeaGenerator 
            user={user} 
            brand={brand} 
            setPage={setPage} 
            setPrefill={setPrefill} 
          />
        )}
        {page === "settings" && (
          <Settings 
            user={user} 
            brand={brand} 
            onBrandUpdate={setBrand} 
          />
        )}
      </main>
    </div>
  );
}

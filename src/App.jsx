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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="gold-shimmer" style={{ width: 40, height: 40, borderRadius: "50%", opacity: 0.5 }} />
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
        padding: "2rem 4rem", 
        transition: "margin-left .3s cubic-bezier(.4,0,.2,1)",
        maxWidth: 1200,
        marginInline: "auto"
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

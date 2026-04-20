import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { C, PLATFORMS } from '../lib/constants';
import { SectionHead, StatCard, Card, Label, Badge, Btn } from './common/UIAtoms';

const Dashboard = ({ user, brand, setPage, setPrefill, posts, onPostsUpdate }) => {
  const today = new Date().toDateString();
  const todayCount = posts.filter(p => new Date(p.created_at).toDateString() === today).length;

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const filtered = [...posts].filter(p => {
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

export default Dashboard;

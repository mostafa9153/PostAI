import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { C, PLATFORMS, GOALS, TONES, LI_SYS, IG_SYS, FB_SYS, TW_SYS } from '../lib/constants';
import { SectionHead, Card, Label, PlatformBtn, FloatingInput, Btn, Badge } from './common/UIAtoms';
import { sendWebhook, store } from '../lib/utils';

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
  }, [prefill, setPrefill]);

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

    const store_get = (k, d) => { try { const v = localStorage.getItem('pai_' + k); return v !== null ? JSON.parse(v) : d; } catch { return d; } };

    const systemPrompt = store_get(`adm_prompt_${platform}`,
      platform === 'linkedin' ? LI_SYS :
        platform === 'instagram' ? IG_SYS :
          platform === 'facebook' ? FB_SYS :
            platform === 'twitter' ? TW_SYS : LI_SYS
    );

    const fd = new FormData();
    fd.append('event', 'post_requested');
    fd.append('platform', platform);
    fd.append('system_prompt', systemPrompt);
    
    fd.append('li_prompt', store_get('adm_prompt_linkedin', LI_SYS));
    fd.append('ig_prompt', store_get('adm_prompt_instagram', IG_SYS));
    fd.append('fb_prompt', store_get('adm_prompt_facebook', FB_SYS));
    fd.append('tw_prompt', store_get('adm_prompt_twitter', TW_SYS));

    fd.append('brand_context', bCtx);
    fd.append('post_context', pCtx);
    fd.append('user_id', user.id);
    fd.append('user_email', user.email);
    fd.append('brand_name', brand.brand_name || "");
    fd.append('brand_type', (brand.brand_type || []).join(", "));
    fd.append('industry', (brand.industry || []).join(", "));
    fd.append('audience', (brand.target_audience || []).join(", "));
    fd.append('brand_tone', (brand.tone || []).join(", "));
    fd.append('default_cta', brand.default_cta || "");
    fd.append('visual_identity', brand.visual_identity || "");
    fd.append('constraints', brand.constraints || "");

    fd.append('title', title);
    fd.append('context', context);
    fd.append('goal', goal);
    fd.append('tone', tone || (brand.tone?.[0]) || "Professional");
    fd.append('post_size', postSize);
    fd.append('mentions', mentions || "");
    fd.append('image_need', imageNeed);

    fd.append('file_attached', file ? 'yes' : 'no');
    if (file) fd.append('file', file);

    const n8nResponse = await sendWebhook('post_maker', fd);
    if (n8nResponse?.error) throw new Error(n8nResponse.error);

    let finalData = n8nResponse;
    if (Array.isArray(finalData)) finalData = finalData[0];
    if (finalData && finalData.output) finalData = finalData.output;

    if (finalData && finalData.post) {
      return {
        post: finalData.post,
        hashtags: finalData.hashtags || [],
        best_time: finalData.best_time || "Not specified",
        tips: finalData.tips || []
      };
    }
    throw new Error(`n8n থেকে সঠিক ফরম্যাটে ডাটা পাওয়া যায়নি।`);
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
        if (postErr.code === '42703') setErr("Error: ডাটাবেসে কোনো একটি কলাম মিসিং আছে।");
        else if (postErr.code === '23503') setErr("Error: User ID সঠিক নয়।");
        else setErr(`সেভ করতে সমস্যা হয়েছে: ${postErr.message}`);
        throw postErr;
      }

      if (onPostsUpdate) {
        const { data: allPosts } = await supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
        onPostsUpdate(allPosts || []);
      }
    } catch (e) {
      if (!err) setErr(e.message || "n8n কানেকশন বা জেনারেশনে সমস্যা হয়েছে।");
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
              </div>
              <div>
                <Label sx={{ fontSize: 12, opacity: 0.6 }}>Generate AI Image?</Label>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  {['yes', 'not'].map(val => (
                    <button key={val} onClick={() => setImageNeed(val)} style={{
                      padding: "6px 12px", borderRadius: 6, fontSize: 13, cursor: "pointer",
                      border: `1px solid ${imageNeed === val ? C.gold : C.brd}`,
                      background: imageNeed === val ? C.ga(.1) : "transparent",
                      color: imageNeed === val ? C.gold : C.t1
                    }}>{val === 'yes' ? 'Yes' : 'No'}</button>
                  ))}
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
                {out.tips && out.tips.length > 0 && (
                  <div style={{ padding: "0.75rem", background: C.bg3, borderRadius: 8, fontSize: 14, border: `1px solid ${C.brd}` }}>
                    <div style={{ color: C.gold, fontWeight: 500, marginBottom: 4 }}>Strategy Insight:</div>
                    {out.tips.map((t, i) => <div key={i} style={{ color: C.t2, marginBottom: 2 }}>• {t}</div>)}
                    <div style={{ marginTop: 6, color: C.t1, fontSize: 13 }}>
                      Best time: <span style={{ color: C.t0 }}>{out.best_time}</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostMaker;

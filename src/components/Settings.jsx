import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { C } from '../lib/constants';
import { SectionHead, Card, Label, FloatingInput, Btn, Badge } from './common/UIAtoms';

const Settings = ({ user, brand: brandProp, onBrandUpdate }) => {
  const [tab, setTab] = useState("brand");
  const [brand, setBrand] = useState(brandProp || {});
  const [training, setTraining] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const MCQ = [
    { k: "brand_type", q: "Brand Type", opts: ["Personal Brand", "Business/Startup", "Agency/Service Provider", "E-commerce/Product Based", "Community/NGO"] },
    { k: "industry", q: "Industry", opts: ["Technology & Software", "AI & Automation", "Education & E-learning", "Health & Wellness", "Finance & Real Estate", "E-commerce & Retail", "Marketing & Creative Agency", "Travel & Lifestyle"] },
    { k: "target_audience", q: "Target Audience", opts: ["Students & Learners", "Small Business Owners", "Corporate Professionals", "CEOs & Decision Makers", "Tech Enthusiasts", "General Public"] },
    { k: "tone", q: "Core Brand Voice", opts: ["Professional & Authoritative", "Friendly & Conversational", "Witty & Humorous", "Inspirational & Bold", "Minimalist & Direct"] },
  ];

  const handleToggle = (k, opt) => {
    const current = brand[k] || [];
    const next = current.includes(opt) ? current.filter(x => x !== opt) : [...current, opt];
    setBrand({ ...brand, [k]: next });
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('brands').upsert({
      ...brand,
      user_id: user.id,
      trained: training.length > 10 || brand.trained
    }, { onConflict: 'user_id' });

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onBrandUpdate({ ...brand, trained: training.length > 10 || brand.trained });
    }
    setSaving(false);
  };

  return (
    <div className="fade-in">
      <SectionHead>Settings</SectionHead>

      <div style={{ display: "flex", gap: 12, marginBottom: "2rem", borderBottom: `1px solid ${C.brd}`, paddingBottom: 12, overflowX: "auto" }}>
        {[
          { id: "brand", label: "Brand Identity" },
          { id: "training", label: "AI Training" },
          { id: "plan", label: "Subscription Plan" }
        ].map(t => (
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
            <Btn v="gold" onClick={save} size="lg" style={{ alignSelf: "flex-start" }} disabled={saving}>
              {saved ? "✓ Saved Successfully" : saving ? "Saving..." : "Save Brand Profile"}
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
          <Btn v="gold" onClick={save} size="lg" disabled={saving}>{saved ? "✓ Training Updated" : saving ? "Updating..." : "Update Brand Training"}</Btn>
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
                    <span style={{ color: "rgba(75,153,96,0.8)", fontSize: 12 }}>✓</span> {f}
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

export default Settings;

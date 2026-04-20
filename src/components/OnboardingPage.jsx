import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { C } from '../lib/constants';
import { Card, FloatingInput, Label, Btn } from './common/UIAtoms';
import { sendWebhook, store } from '../lib/utils';

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
    
    if (error) {
      setSaveErr('Could not save brand profile: ' + error.message);
      setSaving(false);
      return;
    }

    // Attempt to send webhook but don't block on it
    fetch(localStorage.getItem('pai_adm_webhooks_onboarding') || '', {
      method: 'POST',
      body: JSON.stringify({
        event: 'onboarding_complete',
        timestamp: new Date().toISOString(),
        user: { id: user.id, email: user.email },
        brand: brandData,
      })
    }).catch(() => {});

    setSaving(false);
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

export default OnboardingPage;

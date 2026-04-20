import React, { useState } from 'react';
import { C } from '../lib/constants';
import { SectionHead, Card, Label, FloatingInput, Btn } from './common/UIAtoms';
import { sendWebhook } from '../lib/utils';

const CONTENT_PILLARS = ["Authority/Value", "Personal Branding", "Hot Take/Opinion", "Social Proof", "Future/Trends", "AI Chose"];
const INTENTS = ["Profile Visit", "Lead Gen", "Authority", "Newsletter/Link", "AI Chose"];
const HOOKS = ["How-to", "Shocking", "Story", "Data", "AI Chose"];

const ChipSelector = ({ options, value, onChange, otherValue, onOtherChange, label }) => {
  const hasOther = value === "__other__";
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: hasOther ? 8 : 0 }}>
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)} style={{
            padding: "8px 16px", borderRadius: 10, fontSize: 13,
            border: `1px solid ${value === opt ? C.ga(.5) : C.brd}`,
            background: value === opt ? C.ga(.15) : "rgba(255,255,255,0.02)",
            color: value === opt ? C.gold : C.t1,
            fontWeight: value === opt ? 600 : 400, transition: "all .2s",
            boxShadow: value === opt ? `0 0 12px ${C.ga(.15)}` : "none"
          }}>
            {opt}
          </button>
        ))}
        <button onClick={() => onChange("__other__")} style={{
          padding: "8px 16px", borderRadius: 10, fontSize: 13,
          border: `1px solid ${hasOther ? C.ga(.5) : C.brd}`,
          background: hasOther ? C.ga(.15) : "rgba(255,255,255,0.02)",
          color: hasOther ? C.gold : C.t1,
          fontWeight: hasOther ? 600 : 400, transition: "all .2s"
        }}>
          Other
        </button>
      </div>
      {hasOther && (
        <FloatingInput label="Custom value..." value={otherValue} onChange={e => onOtherChange(e.target.value)} />
      )}
    </div>
  );
};

const IdeaGenerator = ({ user, brand: brandProp, setPage, setPrefill }) => {
  const [pillar, setPillar] = useState("AI Chose");
  const [pillarOther, setPillarOther] = useState("");
  const [intent, setIntent] = useState("AI Chose");
  const [intentOther, setIntentOther] = useState("");
  const [hook, setHook] = useState("AI Chose");
  const [hookOther, setHookOther] = useState("");
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const brand = brandProp || {};


  const getVal = (sel, other) => sel === "__other__" ? (other || "Custom") : sel;

  const generate = async () => {
    setLoading(true); setErr(""); setIdeas([]);
    try {
      const fd = new FormData();
      fd.append('event', 'ideas_requested');
      fd.append('user_id', user?.id || "");
      fd.append('user_email', user?.email || "");
      fd.append('brand_name', brand.brand_name || "");
      fd.append('content_pillar', getVal(pillar, pillarOther));
      fd.append('specific_intent', getVal(intent, intentOther));
      fd.append('hook_type', getVal(hook, hookOther));
      fd.append('context', input || 'Generic brand awareness');

      fd.append('file_attached', file ? 'yes' : 'no');
      if (file) fd.append('file', file);

      const n8nResponse = await sendWebhook('idea_generator', fd);
      if (n8nResponse?.error) throw new Error(n8nResponse.error);

      let finalData = n8nResponse;
      if (Array.isArray(finalData) && finalData.length > 0) {
        if (finalData[0].topic || finalData[0].id) { setIdeas(finalData); setLoading(false); return; }
        if (finalData[0].output && Array.isArray(finalData[0].output)) { setIdeas(finalData[0].output); setLoading(false); return; }
        finalData = finalData[0];
      }
      if (finalData?.output && Array.isArray(finalData.output)) { setIdeas(finalData.output); setLoading(false); return; }
      if (finalData && Array.isArray(finalData.ideas)) { setIdeas(finalData.ideas); setLoading(false); return; }
      throw new Error('n8n response check korun.');
    } catch (e) { 
      console.error(e); 
      setErr(e.message || 'n8n connection error.'); 
    }
    setLoading(false);
  };

  const use = (idea) => {
    setPrefill({ topic: idea.topic + ' -- ' + idea.angle + '\n\nHook: ' + idea.hook });
    setPage('post-maker');
  };

  return (
    <div className="fade-in">
      <SectionHead>Idea Generator</SectionHead>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card>
            <ChipSelector label="Content Pillar" options={CONTENT_PILLARS} value={pillar} onChange={setPillar} otherValue={pillarOther} onOtherChange={setPillarOther} />
          </Card>
          <Card>
            <ChipSelector label="Specific Intent" options={INTENTS} value={intent} onChange={setIntent} otherValue={intentOther} onOtherChange={setIntentOther} />
          </Card>
          <Card>
            <ChipSelector label="Hook Type" options={HOOKS} value={hook} onChange={setHook} otherValue={hookOther} onOtherChange={setHookOther} />
          </Card>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card style={{ flex: 1 }}>
            <Label>Context & Inputs</Label>
            <FloatingInput label="Topic or Recent Event" value={input} onChange={e => setInput(e.target.value)} isTextArea />
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', 
              background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: `1px dashed ${C.brd}`, marginTop: 8 
            }}>
              <span style={{ fontSize: 13, color: C.t2 }}>Upload for Context</span>
              <input type="file" style={{ display: 'none' }} id="idea-f" onChange={e => setFile(e.target.files[0])} />
              <label htmlFor="idea-f" style={{ fontSize: 13, color: C.gold, cursor: 'pointer', marginLeft: 'auto', fontWeight: 600 }}>
                {file ? file.name : 'Browse'}
              </label>
            </div>
            <Btn v="gold" full onClick={generate} disabled={loading} style={{ marginTop: '1.5rem', height: 44 }}>
              {loading ? 'Brainstorming...' : 'Generate 6 Content Ideas'}
            </Btn>
            {err && <div style={{ color: C.red, fontSize: 13, marginTop: 10, textAlign: 'center' }}>{err}</div>}
          </Card>
        </div>
      </div>

      {ideas.length > 0 && (
        <div className="fade-in">
          <SectionHead>Generated Ideas</SectionHead>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {ideas.map((idea, i) => (
              <Card key={idea.id || i} style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ 
                    minWidth: 32, height: 32, borderRadius: 8, display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', background: C.ga(.12), color: C.gold, fontSize: 14, fontWeight: 600, 
                    flexShrink: 0 
                  }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 13, color: C.t1, marginBottom: 8 }}>{idea.angle}</div>
                    <div style={{ fontSize: 17, fontWeight: 500, color: C.t0, marginBottom: 12, lineHeight: 1.4 }}>{idea.topic}</div>
                    <div style={{ padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: 13, color: C.t2, border: `1px solid ${C.brd}`, marginBottom: 16 }}>
                      <span style={{ color: C.gold, fontWeight: 600 }}>Hook:</span> {idea.hook}
                    </div>
                    <Btn size="sm" v="gold" onClick={() => use(idea)}>Use this idea</Btn>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaGenerator;

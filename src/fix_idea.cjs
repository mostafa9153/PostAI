const fs = require('fs');
let c = fs.readFileSync('App.jsx', 'utf8');
const lines = c.split('\n');

// Find the corrupted range
let startIdx = -1;
for (let i = 1280; i < 1360; i++) {
  if (lines[i] && lines[i].includes('// Handle nested n8n response formats')) {
    // Check if next line is JSX (corrupted)
    if (lines[i+1] && lines[i+1].includes('</div>')) {
      startIdx = i;
      break;
    }
  }
}

if (startIdx === -1) {
  console.log('Corruption not found or already fixed');
  process.exit(0);
}

// Find end of component
let endIdx = startIdx;
for (let i = startIdx; i < startIdx + 100; i++) {
  if (lines[i] && lines[i] === '};') {
    endIdx = i;
    break;
  }
}

console.log(`Replacing lines ${startIdx+1} to ${endIdx+1}`);

const replacement = `      // Handle nested n8n response formats
      let finalData = n8nResponse;
      if (Array.isArray(finalData) && finalData.length > 0) {
        if (finalData[0].topic || finalData[0].id) { setIdeas(finalData); setLoading(false); return; }
        if (finalData[0].output && Array.isArray(finalData[0].output)) { setIdeas(finalData[0].output); setLoading(false); return; }
        finalData = finalData[0];
      }
      if (finalData?.output && Array.isArray(finalData.output)) { setIdeas(finalData.output); setLoading(false); return; }
      if (finalData && Array.isArray(finalData.ideas)) { setIdeas(finalData.ideas); setLoading(false); return; }
      throw new Error('n8n response check korun.');
    } catch (e) { console.error(e); setErr(e.message || 'n8n connection error.'); }
    setLoading(false);
  };

  const use = (idea) => {
    setPrefill({ topic: idea.topic + ' -- ' + idea.angle + '\\n\\nHook: ' + idea.hook });
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <FloatingInput label="Draft/Topic/Article Content" value={input} onChange={e => setInput(e.target.value)} isTextArea />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: \`1px dashed \${C.brd}\`, marginTop: 8 }}>
                <span style={{ fontSize: 13, color: C.t2 }}>Reference File (PDF/Img)</span>
                <input type="file" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} id="i-up" />
                <label htmlFor="i-up" style={{ fontSize: 13, color: C.gold, cursor: 'pointer', marginLeft: 'auto', fontWeight: 600 }}>{file ? file.name : 'Browse Files'}</label>
              </div>
            </div>
          </Card>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card><ChipSelector label="Specific Intent" options={INTENTS} value={intent} onChange={setIntent} otherValue={intentOther} onOtherChange={setIntentOther} /></Card>
          <Card><ChipSelector label="Hook Type" options={HOOKS} value={hook} onChange={setHook} otherValue={hookOther} onOtherChange={setHookOther} /></Card>
        </div>
      </div>
      <Btn v="gold" full onClick={generate} disabled={loading} size="lg" style={{ marginBottom: '2rem' }}>
        {loading ? 'Brainstorming ideas...' : '\u2726 Generate 6 Strategic Ideas'}
      </Btn>
      {err && <div style={{ fontSize: 14, color: C.red, marginBottom: '1rem', padding: '12px 16px', background: 'rgba(217,88,88,.05)', borderRadius: 10 }}>{err}</div>}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: C.t1, marginBottom: 8 }}>Analyzing your brand...</div>
          <div style={{ fontSize: 14, color: C.t2 }}>Crafting 6 high-performance content angles</div>
        </div>
      )}
      {ideas.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
            <div style={{ width: 32, height: 2, borderRadius: 2 }} className="gold-shimmer" />
            <div style={{ fontSize: 13, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Click any idea to open in Post Maker</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {ideas.map((idea, i) => (
              <Card key={idea.id || i} onClick={() => use(idea)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ minWidth: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.ga(.12), color: C.gold, fontSize: 14, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.t0, marginBottom: 6 }}>{idea.topic}</div>
                    <div style={{ fontSize: 13, color: C.t1, marginBottom: 8 }}>{idea.angle}</div>
                    <div style={{ fontSize: 13, color: C.gold, fontStyle: 'italic', lineHeight: 1.5, borderLeft: \`2px solid \${C.ga(.3)}\`, paddingLeft: 10 }}>"{idea.hook}"</div>
                  </div>
                  <div style={{ color: C.gold, fontSize: 18, opacity: 0.6, marginTop: 4, flexShrink: 0 }}>\u2192</div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};`.split('\n');

lines.splice(startIdx, endIdx - startIdx + 1, ...replacement);
fs.writeFileSync('App.jsx', lines.join('\n'));
console.log('Done! Fixed lines', startIdx+1, 'to', endIdx+1);

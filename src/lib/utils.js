export const store = {
  get: (k, d = null) => {
    try {
      const v = localStorage.getItem('pai_' + k);
      return v !== null ? JSON.parse(v) : d;
    } catch {
      return d;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem('pai_' + k, JSON.stringify(v));
    } catch { }
  }
};

export const sendWebhook = async (key, payload) => {
  const hooks = store.get('adm_webhooks', {});
  let url = hooks[key];
  if (!url || url.includes('yourdomain') || url.trim() === '') return { error: 'Webhook URL not set.' };

  if (import.meta.env.DEV && url.includes('n8n.srv1106977.hstgr.cloud')) {
    url = url.replace('https://n8n.srv1106977.hstgr.cloud', '/n8n-proxy');
  }

  try {
    const isFormData = payload instanceof FormData;
    const options = {
      method: 'POST',
      body: isFormData ? payload : JSON.stringify({ ...payload, source: 'PostAI' }),
    };

    if (!isFormData) {
      options.headers = { 'Content-Type': 'application/json' };
    }

    const res = await fetch(url, options);
    if (!res.ok) return { error: `n8n Error: ${res.status} ${res.statusText}` };

    const data = await res.json().catch(() => null);
    if (!data) return { error: 'No response from n8n.' };
    return data;
  } catch (e) {
    console.error('[PostAI] Webhook Error:', e);
    return { error: e.message || 'Unknown network error' };
  }
};

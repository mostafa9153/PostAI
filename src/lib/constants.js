export const C = {
  bg0: "#060606", bg1: "#0c0c0c", bg2: "#141414", bg3: "#1b1b1b", bg4: "#232323",
  gold: "#C9A84C", goldL: "#DFC26A", goldD: "#9A7520",
  ga: (a) => `rgba(201,168,76,${a})`,
  t0: "#EDE5CC", t1: "#9A8560", t2: "#5C4830",
  brd: "rgba(255,255,255,0.07)",
  brdL: "rgba(255,255,255,0.12)",
  red: "#D95858", green: "#4B9960",
  gradGold: "linear-gradient(135deg, #9A7520 0%, #C9A84C 50%, #DFC26A 100%)",
  shd: "0 8px 32px 0 rgba(0, 0, 0, 0.8)",
};

export const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", active: true },
  { id: "instagram", label: "Instagram", active: true },
  { id: "facebook", label: "Facebook", active: true },
  { id: "twitter", label: "Twitter / X", active: true },
];

export const TONES = ["Informative", "Promotional", "Controversial", "Storytelling", "Urgent", "Empathetic"];

export const GOALS = ["Engagement", "Lead Generation/Sales", "Educational", "Brand Awareness", "Announcement", "Event Promotion"];

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { id: "post-maker", label: "Post Maker", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { id: "idea-generator", label: "Idea Generator", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { id: "settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

export const LI_SYS = `You are an elite LinkedIn content strategist. Use the BRAND_CONTEXT to maintain voice and the POST_CONTEXT for specific post goals.
Respond ONLY with JSON: {"post":"...","hashtags":[],"best_time":"...","tips":[]}`;

export const IG_SYS = `You are an Instagram content expert with deep knowledge of the 2025 algorithm. Reels get 3× reach. Hook in caption first line. 20–30 hashtags. Focus on visuals-first storytelling.
Respond ONLY with JSON: {"post":"...","hashtags":[],"best_time":"...","tips":[]}`;

export const FB_SYS = `You are a Facebook content expert. Focus on emotional hooks, share-worthy content, and group engagement strategies.
Respond ONLY with JSON: {"post":"...","hashtags":[],"best_time":"...","tips":[]}`;

export const TW_SYS = `You are a Twitter/X content expert. Under 280 chars for max reach. Thread hooks. Reply baiting. First 30 min engagement is critical.
Respond ONLY with JSON: {"post":"...","hashtags":[],"best_time":"...","tips":[]}`;

export const IDEA_SYS = `You are a LinkedIn creative content strategist. Generate 6 post ideas based on brand context.
Respond ONLY with a valid JSON array — no markdown, no backticks:
[{"id":1,"topic":"...","angle":"...","hook":"opening line of the post..."}]`;

export const SIDEBAR_W = 228;
export const SIDEBAR_COLLAPSED_W = 56;

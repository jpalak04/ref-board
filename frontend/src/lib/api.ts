const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export interface OGResult {
  title: string; description: string; image: string | null;
  type: 'reel' | 'image' | 'link' | 'note'; error?: string;
}
export interface AIAutofillResult {
  content_type: string; cat_id: string | null; subcat: string | null;
  tags: string[]; action_tag: 'inspiration' | 'to_execute'; error?: string;
}
export interface SimilarResult { similar: string[]; error?: string; }
export interface DigestResult {
  summary: string; by_category: any[]; total: number; error?: string;
}

export async function fetchOG(url: string): Promise<OGResult> {
  const res = await fetch(`${BASE}/api/fetch-og`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return res.json();
}

export async function aiAutofill(
  url: string, title: string, description: string,
  categories: { id: string; name: string; subs: string[] }[]
): Promise<AIAutofillResult> {
  const res = await fetch(`${BASE}/api/ai-autofill`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, title, description, categories }),
  });
  return res.json();
}

export async function fetchSimilarIdeas(
  refId: string, title: string, description: string,
  tags: string[], catId: string | null,
  candidates: { id: string; title: string; description: string; tags: string[]; cat_id: string }[]
): Promise<SimilarResult> {
  const res = await fetch(`${BASE}/api/similar-ideas`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref_id: refId, title, description, tags, cat_id: catId, candidates }),
  });
  return res.json();
}

export async function fetchWeeklyDigest(
  refs: any[], categories: any[]
): Promise<DigestResult> {
  const res = await fetch(`${BASE}/api/weekly-digest`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refs, categories }),
  });
  return res.json();
}

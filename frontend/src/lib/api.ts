const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export interface OGResult {
  title: string;
  description: string;
  image: string | null;
  type: 'reel' | 'image' | 'link' | 'note';
  error?: string;
}

export interface AIAutofillResult {
  content_type: 'reel' | 'image' | 'link' | 'note';
  cat_id: string | null;
  subcat: string | null;
  error?: string;
}

export async function fetchOG(url: string): Promise<OGResult> {
  const res = await fetch(`${BACKEND_URL}/api/fetch-og`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return res.json();
}

export async function aiAutofill(
  url: string,
  title: string,
  description: string,
  categories: { id: string; name: string; subs: string[] }[]
): Promise<AIAutofillResult> {
  const res = await fetch(`${BACKEND_URL}/api/ai-autofill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, title, description, categories }),
  });
  return res.json();
}

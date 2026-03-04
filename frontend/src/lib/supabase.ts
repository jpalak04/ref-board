import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface Category {
  id: string;
  name: string;
  color: string;
  subs: string[];
  created_at: string;
}

export interface Ref {
  id: string;
  type: 'reel' | 'image' | 'link' | 'note';
  title: string;
  url: string;
  description: string;
  cat_id: string;
  subcat: string;
  author: string;
  created_at: string;
}

export function parseDescription(raw: string): { text: string; image: string | null } {
  if (!raw) return { text: '', image: null };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return { text: parsed.t || '', image: parsed.i || null };
    }
  } catch {}
  return { text: raw, image: null };
}

export function buildDescription(text: string, imageUrl?: string | null): string {
  return JSON.stringify({ t: text || '', i: imageUrl || null });
}

// Fetch all categories
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Fetch all refs
export async function fetchRefs(): Promise<Ref[]> {
  const { data, error } = await supabase
    .from('refs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Insert a new ref
export async function insertRef(ref: Omit<Ref, 'created_at'>): Promise<Ref> {
  const { data, error } = await supabase
    .from('refs')
    .insert([{ ...ref, created_at: new Date().toISOString() }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Delete a ref
export async function deleteRef(id: string): Promise<void> {
  const { error } = await supabase.from('refs').delete().eq('id', id);
  if (error) throw error;
}

// Insert a category
export async function insertCategory(cat: Omit<Category, 'created_at'>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ ...cat, created_at: new Date().toISOString() }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Update a category
export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Delete a category
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

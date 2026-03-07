import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Category {
  id: string; name: string; color: string; subs: string[]; created_at: string;
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
  board_id: string | null;
  tags: string[];
  action_tag: 'inspiration' | 'to_execute';
}

export interface Board {
  id: string; name: string; pin: string; color: string; created_at: string;
}

export interface BoardMember {
  id: string; board_id: string; member_name: string;
  role: 'founder' | 'member'; created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function parseDescription(raw: string): { text: string; image: string | null } {
  if (!raw) return { text: '', image: null };
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === 'object') return { text: p.t || '', image: p.i || null };
  } catch {}
  return { text: raw, image: null };
}

export function buildDescription(text: string, imageUrl?: string | null): string {
  return JSON.stringify({ t: text || '', i: imageUrl || null });
}

function normaliseRef(r: any): Ref {
  return {
    ...r,
    tags: Array.isArray(r.tags) ? r.tags : [],
    action_tag: r.action_tag || 'inspiration',
    board_id: r.board_id || null,
  };
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('created_at');
  if (error) throw error;
  return data || [];
}

export async function insertCategory(cat: Omit<Category, 'created_at'>): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert([{ ...cat, created_at: new Date().toISOString() }]).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ─── Refs ────────────────────────────────────────────────────────────────────

export async function fetchRefs(boardId?: string | null): Promise<Ref[]> {
  let q = supabase.from('refs').select('*').order('created_at', { ascending: false });
  if (boardId) q = q.eq('board_id', boardId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(normaliseRef);
}

export async function insertRef(ref: Omit<Ref, 'created_at'>): Promise<Ref> {
  const { data, error } = await supabase
    .from('refs')
    .insert([{ ...ref, created_at: new Date().toISOString() }])
    .select().single();
  if (error) throw error;
  return normaliseRef(data);
}

export async function updateRef(id: string, updates: Partial<Ref>): Promise<void> {
  const { error } = await supabase.from('refs').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteRef(id: string): Promise<void> {
  const { error } = await supabase.from('refs').delete().eq('id', id);
  if (error) throw error;
}

// ─── Boards ──────────────────────────────────────────────────────────────────

export async function fetchBoards(): Promise<Board[]> {
  const { data, error } = await supabase.from('boards').select('*').order('created_at');
  if (error) throw error;
  return data || [];
}

export async function insertBoard(board: Omit<Board, 'created_at'>): Promise<Board> {
  const { data, error } = await supabase.from('boards').insert([{ ...board, created_at: new Date().toISOString() }]).select().single();
  if (error) throw error;
  return data;
}

export async function updateBoard(id: string, updates: Partial<Board>): Promise<void> {
  const { error } = await supabase.from('boards').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteBoard(id: string): Promise<void> {
  const { error } = await supabase.from('boards').delete().eq('id', id);
  if (error) throw error;
}

// ─── Board Members ────────────────────────────────────────────────────────────

export async function fetchBoardMembers(): Promise<BoardMember[]> {
  const { data, error } = await supabase.from('board_members').select('*').order('created_at');
  if (error) throw error;
  return data || [];
}

export async function insertBoardMember(member: Omit<BoardMember, 'created_at'>): Promise<BoardMember> {
  const { data, error } = await supabase.from('board_members').insert([{ ...member, created_at: new Date().toISOString() }]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBoardMember(id: string): Promise<void> {
  const { error } = await supabase.from('board_members').delete().eq('id', id);
  if (error) throw error;
}

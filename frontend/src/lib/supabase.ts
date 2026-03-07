import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

// ─── Types (matching actual DB schema) ──────────────────────────────────────

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
  action_tag: 'inspiration' | 'to_execute' | null;
}

export interface Tag {
  id: string; name: string; created_at: string;
}

export interface RefTag {
  id: string; ref_id: string; tag_id: string; created_at: string;
}

export interface TeamMember {
  id: string; name: string; pin: string; role: 'founder' | 'member'; created_at: string;
}

export interface Board {
  id: string; name: string; founder_id: string; created_at: string;
}

export interface BoardMember {
  id: string; board_id: string; member_id: string; created_at: string;
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
    action_tag: r.action_tag || null,
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

export async function fetchRefs(): Promise<Ref[]> {
  const { data, error } = await supabase.from('refs').select('*').order('created_at', { ascending: false });
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

// ─── Tags ────────────────────────────────────────────────────────────────────

export async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function insertTag(name: string): Promise<Tag> {
  const { data, error } = await supabase
    .from('tags')
    .insert([{ id: crypto.randomUUID(), name, created_at: new Date().toISOString() }])
    .select().single();
  if (error) throw error;
  return data;
}

export async function upsertTag(name: string): Promise<Tag> {
  // Try to find existing tag first
  const { data: existing } = await supabase.from('tags').select('*').eq('name', name).single();
  if (existing) return existing;
  return insertTag(name);
}

// ─── Ref Tags (join table) ───────────────────────────────────────────────────

export async function fetchRefTags(): Promise<RefTag[]> {
  const { data, error } = await supabase.from('refs_tags').select('*');
  if (error) throw error;
  return data || [];
}

export async function setRefTags(refId: string, tagNames: string[]): Promise<void> {
  // Delete existing tags for this ref
  await supabase.from('refs_tags').delete().eq('ref_id', refId);
  if (!tagNames.length) return;
  // Upsert tags and create links
  for (const name of tagNames) {
    const tag = await upsertTag(name);
    await supabase.from('refs_tags').insert([{
      id: crypto.randomUUID(), ref_id: refId, tag_id: tag.id, created_at: new Date().toISOString()
    }]);
  }
}

export async function getTagsForRef(refId: string, allTags: Tag[], refTags: RefTag[]): string[] {
  const tagIds = refTags.filter(rt => rt.ref_id === refId).map(rt => rt.tag_id);
  return allTags.filter(t => tagIds.includes(t.id)).map(t => t.name);
}

// ─── Team Members ────────────────────────────────────────────────────────────

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase.from('team_members').select('*').order('created_at');
  if (error) throw error;
  return data || [];
}

export async function insertTeamMember(member: Omit<TeamMember, 'created_at'>): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert([{ ...member, created_at: new Date().toISOString() }])
    .select().single();
  if (error) throw error;
  return data;
}

export async function updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<void> {
  const { error } = await supabase.from('team_members').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from('team_members').delete().eq('id', id);
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

// ─── Board Members (join table) ──────────────────────────────────────────────

export async function fetchBoardMembers(): Promise<BoardMember[]> {
  const { data, error } = await supabase.from('board_members').select('*').order('created_at');
  if (error) throw error;
  return data || [];
}

export async function insertBoardMember(boardId: string, memberId: string): Promise<BoardMember> {
  const { data, error } = await supabase
    .from('board_members')
    .insert([{ id: crypto.randomUUID(), board_id: boardId, member_id: memberId, created_at: new Date().toISOString() }])
    .select().single();
  if (error) throw error;
  return data;
}

export async function deleteBoardMember(id: string): Promise<void> {
  const { error } = await supabase.from('board_members').delete().eq('id', id);
  if (error) throw error;
}

export async function removeMemberFromBoard(boardId: string, memberId: string): Promise<void> {
  const { error } = await supabase.from('board_members').delete().eq('board_id', boardId).eq('member_id', memberId);
  if (error) throw error;
}

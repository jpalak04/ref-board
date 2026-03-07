import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  supabase, fetchCategories, fetchRefs, fetchBoards, fetchBoardMembers,
  fetchTeamMembers, fetchTags, fetchRefTags, setRefTags, getTagsForRef,
  Category, Ref, Board, BoardMember, TeamMember, Tag, RefTag,
} from '../lib/supabase';

const SESSION_KEY = 'refboard_session_v2';

export interface UserSession {
  memberId: string;
  name: string;
  pin: string;
  role: 'founder' | 'member';
}

// Extended ref with tags
export interface RefWithTags extends Ref {
  tags: string[];
}

interface AppContextType {
  // Auth
  session: UserSession | null;
  sessionLoaded: boolean;
  login: (name: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  // Data
  refs: RefWithTags[];
  allRefs: RefWithTags[];
  categories: Category[];
  boards: Board[];
  boardMembers: BoardMember[];
  teamMembers: TeamMember[];
  tags: Tag[];
  refTags: RefTag[];
  loading: boolean;
  // Current board (for members) or all boards (for founders)
  currentBoard: Board | null;
  assignedBoards: Board[];
  // Actions
  refreshRefs: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshBoards: () => Promise<void>;
  refreshTeamMembers: () => Promise<void>;
  refreshTags: () => Promise<void>;
  refreshAll: () => Promise<void>;
  setTagsForRef: (refId: string, tagNames: string[]) => Promise<void>;
}

const Ctx = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [rawRefs, setRawRefs] = useState<Ref[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [refTags, setRefTagsState] = useState<RefTag[]>([]);
  const [loading, setLoading] = useState(true);

  // Enrich refs with tags
  const allRefs = useMemo<RefWithTags[]>(() => {
    return rawRefs.map(r => ({
      ...r,
      tags: getTagsForRef(r.id, tags, refTags),
    }));
  }, [rawRefs, tags, refTags]);

  // Get boards assigned to current user
  const assignedBoards = useMemo(() => {
    if (!session) return [];
    if (session.role === 'founder') return boards;
    const memberBoardIds = boardMembers
      .filter(bm => bm.member_id === session.memberId)
      .map(bm => bm.board_id);
    return boards.filter(b => memberBoardIds.includes(b.id));
  }, [session, boards, boardMembers]);

  // Current board (first assigned, or null)
  const currentBoard = useMemo(() => {
    return assignedBoards[0] || null;
  }, [assignedBoards]);

  // Filtered refs based on role
  const refs = useMemo<RefWithTags[]>(() => {
    if (!session) return [];
    if (session.role === 'founder') return allRefs;
    const boardIds = assignedBoards.map(b => b.id);
    return allRefs.filter(r => r.board_id && boardIds.includes(r.board_id));
  }, [session, allRefs, assignedBoards]);

  const refreshCategories = useCallback(async () => {
    try { setCategories(await fetchCategories()); } catch (e) { console.error('fetchCategories', e); }
  }, []);

  const refreshBoards = useCallback(async () => {
    try {
      const [b, m] = await Promise.all([fetchBoards(), fetchBoardMembers()]);
      setBoards(b); setBoardMembers(m);
    } catch (e) { console.error('fetchBoards', e); }
  }, []);

  const refreshTeamMembers = useCallback(async () => {
    try { setTeamMembers(await fetchTeamMembers()); } catch (e) { console.error('fetchTeamMembers', e); }
  }, []);

  const refreshRefs = useCallback(async () => {
    try { setRawRefs(await fetchRefs()); } catch (e) { console.error('fetchRefs', e); }
  }, []);

  const refreshTags = useCallback(async () => {
    try {
      const [t, rt] = await Promise.all([fetchTags(), fetchRefTags()]);
      setTags(t); setRefTagsState(rt);
    } catch (e) { console.error('fetchTags', e); }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      refreshCategories(), refreshBoards(), refreshTeamMembers(), refreshRefs(), refreshTags()
    ]);
    setLoading(false);
  }, [refreshCategories, refreshBoards, refreshTeamMembers, refreshRefs, refreshTags]);

  // Bootstrap
  useEffect(() => {
    const init = async () => {
      const stored = await AsyncStorage.getItem(SESSION_KEY);
      if (stored) {
        try { setSession(JSON.parse(stored)); } catch {}
      }
      setSessionLoaded(true);
      await refreshAll();
    };
    init();
  }, []);

  // Login: find team member by name, verify PIN
  const login = useCallback(async (name: string, pin: string) => {
    const member = teamMembers.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (!member) return { success: false, error: 'Name not found. Ask your Founder to add you.' };
    if (member.pin !== pin) return { success: false, error: 'Incorrect PIN. Try again.' };

    const sess: UserSession = {
      memberId: member.id,
      name: member.name,
      pin: member.pin,
      role: member.role,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    setSession(sess);
    return { success: true };
  }, [teamMembers]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  // Set tags for a ref
  const setTagsForRefFn = useCallback(async (refId: string, tagNames: string[]) => {
    await setRefTags(refId, tagNames);
    await refreshTags();
  }, [refreshTags]);

  // Realtime — refs
  useEffect(() => {
    const ch = supabase.channel('rt-refs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refs' }, payload => {
        if (payload.eventType === 'INSERT') setRawRefs(p => [payload.new as Ref, ...p]);
        else if (payload.eventType === 'DELETE') setRawRefs(p => p.filter(r => r.id !== payload.old.id));
        else if (payload.eventType === 'UPDATE') setRawRefs(p => p.map(r => r.id === payload.new.id ? payload.new as Ref : r));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Realtime — categories / boards / team_members / tags
  useEffect(() => {
    const ch = supabase.channel('rt-meta')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => refreshCategories())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, () => refreshBoards())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_members' }, () => refreshBoards())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => refreshTeamMembers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tags' }, () => refreshTags())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refs_tags' }, () => refreshTags())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refreshCategories, refreshBoards, refreshTeamMembers, refreshTags]);

  return (
    <Ctx.Provider value={{
      session, sessionLoaded, login, logout,
      refs, allRefs, categories, boards, boardMembers, teamMembers, tags, refTags,
      loading, currentBoard, assignedBoards,
      refreshRefs, refreshCategories, refreshBoards, refreshTeamMembers, refreshTags, refreshAll,
      setTagsForRef: setTagsForRefFn,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  supabase, fetchCategories, fetchRefs, fetchBoards, fetchBoardMembers,
  Category, Ref, Board, BoardMember,
} from '../lib/supabase';

const SESSION_KEY = 'refboard_session_v2';

export interface UserSession {
  name: string;
  role: 'founder' | 'member';
  boardId: string;
  boardName: string;
}

interface AppContextType {
  // Auth
  session: UserSession | null;
  sessionLoaded: boolean;
  login: (memberName: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  // Data
  refs: Ref[];                  // visible refs (filtered by role)
  allRefs: Ref[];               // all refs (founder use / similar ideas)
  categories: Category[];
  boards: Board[];
  boardMembers: BoardMember[];
  loading: boolean;
  // Actions
  refreshRefs: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshBoards: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const Ctx = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [allRefs, setAllRefs] = useState<Ref[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtered refs based on role
  const refs = useMemo(() => {
    if (!session) return [];
    if (session.role === 'founder') return allRefs;
    return allRefs.filter(r => r.board_id === session.boardId);
  }, [session, allRefs]);

  const refreshCategories = useCallback(async () => {
    try { setCategories(await fetchCategories()); } catch {}
  }, []);

  const refreshBoards = useCallback(async () => {
    try {
      const [b, m] = await Promise.all([fetchBoards(), fetchBoardMembers()]);
      setBoards(b); setBoardMembers(m);
    } catch {}
  }, []);

  const refreshRefs = useCallback(async () => {
    try { setAllRefs(await fetchRefs()); } catch {}
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([refreshCategories(), refreshBoards(), refreshRefs()]);
    setLoading(false);
  }, [refreshCategories, refreshBoards, refreshRefs]);

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

  // Login
  const login = useCallback(async (memberName: string, pin: string) => {
    const member = boardMembers.find(m => m.member_name === memberName);
    if (!member) return { success: false, error: 'Name not found. Ask your Founder to add you.' };
    const board = boards.find(b => b.id === member.board_id);
    if (!board) return { success: false, error: 'Board not found. Contact your Founder.' };
    if (board.pin !== pin) return { success: false, error: 'Incorrect PIN. Try again.' };

    const sess: UserSession = {
      name: memberName, role: member.role as 'founder' | 'member',
      boardId: member.board_id, boardName: board.name,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    setSession(sess);
    return { success: true };
  }, [boardMembers, boards]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  // Realtime — refs
  useEffect(() => {
    const ch = supabase.channel('rt-refs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refs' }, payload => {
        if (payload.eventType === 'INSERT') setAllRefs(p => [payload.new as Ref, ...p]);
        else if (payload.eventType === 'DELETE') setAllRefs(p => p.filter(r => r.id !== payload.old.id));
        else if (payload.eventType === 'UPDATE') setAllRefs(p => p.map(r => r.id === payload.new.id ? payload.new as Ref : r));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Realtime — categories / boards
  useEffect(() => {
    const ch = supabase.channel('rt-meta')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => refreshCategories())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, () => refreshBoards())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_members' }, () => refreshBoards())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refreshCategories, refreshBoards]);

  return (
    <Ctx.Provider value={{
      session, sessionLoaded, login, logout,
      refs, allRefs, categories, boards, boardMembers,
      loading, refreshRefs, refreshCategories, refreshBoards, refreshAll,
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

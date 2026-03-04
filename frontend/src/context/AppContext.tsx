import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, fetchCategories, fetchRefs, Category, Ref } from '../lib/supabase';

const TEAM_STORAGE_KEY = 'refboard_team_members';
const SELECTED_MEMBER_KEY = 'refboard_selected_member';

interface AppContextType {
  refs: Ref[];
  categories: Category[];
  teamMembers: string[];
  selectedMember: string;
  loading: boolean;
  refreshRefs: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  setTeamMembers: (members: string[]) => Promise<void>;
  setSelectedMember: (name: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [refs, setRefs] = useState<Ref[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teamMembers, setTeamMembersState] = useState<string[]>(['Palak']);
  const [selectedMember, setSelectedMemberState] = useState<string>('Palak');
  const [loading, setLoading] = useState(true);

  const refreshCategories = useCallback(async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (e) {
      console.error('Failed to fetch categories', e);
    }
  }, []);

  const refreshRefs = useCallback(async () => {
    try {
      const data = await fetchRefs();
      setRefs(data);
    } catch (e) {
      console.error('Failed to fetch refs', e);
    }
  }, []);

  const setTeamMembers = useCallback(async (members: string[]) => {
    setTeamMembersState(members);
    await AsyncStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(members));
  }, []);

  const setSelectedMember = useCallback(async (name: string) => {
    setSelectedMemberState(name);
    await AsyncStorage.setItem(SELECTED_MEMBER_KEY, name);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      // Load saved team members
      const stored = await AsyncStorage.getItem(TEAM_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTeamMembersState(parsed);
      } else {
        await AsyncStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(['Palak']));
      }
      const storedMember = await AsyncStorage.getItem(SELECTED_MEMBER_KEY);
      if (storedMember) setSelectedMemberState(storedMember);

      await Promise.all([refreshCategories(), refreshRefs()]);
      setLoading(false);
    };
    init();
  }, []);

  // Supabase Realtime subscription for refs
  useEffect(() => {
    const channel = supabase
      .channel('refs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refs' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRefs((prev) => [payload.new as Ref, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setRefs((prev) => prev.filter((r) => r.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setRefs((prev) => prev.map((r) => (r.id === payload.new.id ? (payload.new as Ref) : r)));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Supabase Realtime for categories
  useEffect(() => {
    const channel = supabase
      .channel('categories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        refreshCategories();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshCategories]);

  return (
    <AppContext.Provider
      value={{
        refs,
        categories,
        teamMembers,
        selectedMember,
        loading,
        refreshRefs,
        refreshCategories,
        setTeamMembers,
        setSelectedMember,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

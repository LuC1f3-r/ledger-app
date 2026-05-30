import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Entry, Budget } from '../lib/types';
import { supabase } from '../lib/supabase';

interface StoreState {
  entries:     Entry[];
  budgets:     Budget[];
  userId:      string | null;
  loading:     boolean;
  currency:    string;
  userEmail:   string | null;
  themeMode:    'light' | 'dark' | 'system';
  setUserId:     (id: string | null) => void;
  setUserEmail:  (email: string | null) => void;
  loadLocal:     () => Promise<void>;
  syncFromCloud: () => Promise<void>;
  addEntry:      (e: Omit<Entry, 'id' | 'created_at'>) => Promise<void>;
  deleteEntry:   (id: string) => Promise<void>;
  updateEntry:   (id: string, changes: Partial<Omit<Entry, 'id' | 'created_at' | 'user_id'>>) => Promise<void>;
  setBudget:     (category: string, limit: number) => Promise<void>;
  setCurrency:   (c: string) => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  convertCurrency: (newCurrency: string, rate: number) => Promise<void>;
}

const LOCAL_KEY    = 'ledger_entries_v2';
const BUDGET_KEY   = 'ledger_budgets_v1';
const CURRENCY_KEY = 'ledger_currency_v1';
const THEME_KEY    = 'ledger_theme_v1';

export const useStore = create<StoreState>((set, get) => ({
  entries:  [],
  budgets:  [],
  userId:   null,
  loading:  false,
  currency:  '₹',
  userEmail: null,
  themeMode: 'system' as 'light' | 'dark' | 'system',

  setUserId:    (id)    => set({ userId: id }),
  setUserEmail: (email) => set({ userEmail: email }),

  loadLocal: async () => {
    const raw   = await AsyncStorage.getItem(LOCAL_KEY);
    const braw  = await AsyncStorage.getItem(BUDGET_KEY);
    const curr  = await AsyncStorage.getItem(CURRENCY_KEY);
    const theme = await AsyncStorage.getItem(THEME_KEY);
    set({
      entries:   raw  ? JSON.parse(raw)  : [],
      budgets:   braw ? JSON.parse(braw) : [],
      currency:  curr ?? '₹',
      themeMode: (theme as 'light' | 'dark' | 'system' | null) ?? 'system',
    });
  },

  setCurrency: (c) => {
    set({ currency: c });
    AsyncStorage.setItem(CURRENCY_KEY, c);
  },

  setThemeMode: (mode) => {
    set({ themeMode: mode });
    AsyncStorage.setItem(THEME_KEY, mode);
  },

  convertCurrency: async (newCurrency, rate) => {
    const { entries, budgets, userId } = get();
    set({ loading: true });

    try {
      const newEntries = entries.map(e => ({ ...e, amount: parseFloat((e.amount * rate).toFixed(2)) }));
      const newBudgets = budgets.map(b => ({ ...b, limit: parseFloat((b.limit * rate).toFixed(2)) }));

      if (userId) {
        await Promise.all([
          newEntries.length > 0 ? supabase.from('entries').upsert(newEntries) : Promise.resolve(),
          newBudgets.length > 0 ? supabase.from('budgets').upsert(newBudgets) : Promise.resolve(),
        ]);
      }

      set({ entries: newEntries, budgets: newBudgets, currency: newCurrency, loading: false });
      await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(newEntries));
      await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(newBudgets));
      await AsyncStorage.setItem(CURRENCY_KEY, newCurrency);
    } catch (e) {
      set({ loading: false });
      console.error('Failed to convert currency records:', e);
    }
  },

  syncFromCloud: async () => {
    const { userId } = get();
    if (!userId) return;
    set({ loading: true });
    const [{ data: entries }, { data: budgets }] = await Promise.all([
      supabase.from('entries').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('budgets').select('*').eq('user_id', userId),
    ]);
    if (entries) { set({ entries }); await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(entries)); }
    if (budgets) { set({ budgets }); await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(budgets)); }
    set({ loading: false });
  },

  addEntry: async (entry) => {
    const { userId } = get();
    const newEntry: Entry = { ...entry, id: Date.now().toString() };
    if (userId) {
      const { data, error } = await supabase
        .from('entries')
        .insert({ ...entry, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      if (data) newEntry.id = data.id;
    }
    const entries = [newEntry, ...get().entries];
    set({ entries });
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
  },

  deleteEntry: async (id) => {
    const { userId } = get();
    if (userId) await supabase.from('entries').delete().eq('id', id).eq('user_id', userId);
    const entries = get().entries.filter(e => e.id !== id);
    set({ entries });
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
  },

  updateEntry: async (id, changes) => {
    const { userId, entries } = get();
    if (userId) {
      const { error } = await supabase.from('entries').update(changes).eq('id', id).eq('user_id', userId);
      if (error) throw error;
    }
    const updated = entries.map(e => e.id === id ? { ...e, ...changes } : e);
    const sorted = updated.sort((a, b) => b.date.localeCompare(a.date));
    set({ entries: sorted });
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(sorted));
  },

  setBudget: async (category, limit) => {
    const { userId } = get();
    if (userId) await supabase.from('budgets').upsert({ category, limit, user_id: userId });
    const budgets = [...get().budgets.filter(b => b.category !== category), { category, limit }];
    set({ budgets });
    await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(budgets));
  },
}));

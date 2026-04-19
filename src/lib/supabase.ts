import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// ── SETUP ──────────────────────────────────────────────────────
// Credentials are loaded from .env (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY)
const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase env vars. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.',
  );
}

const ExpoSecureStoreAdapter = {
  getItem:    (key: string) => SecureStore.getItemAsync(key),
  setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Google OAuth ───────────────────────────────────────────────
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle() {
  const redirectTo = makeRedirectUri({ scheme: 'ledger', path: 'auth' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw error ?? new Error('No OAuth URL returned');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return null; // user cancelled

  // Tokens arrive in the URL hash fragment
  const url = new URL(result.url);
  const params = new URLSearchParams(url.hash.slice(1));
  const access_token  = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  if (access_token && refresh_token) {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({ access_token, refresh_token });
    if (sessionError) throw sessionError;
    return sessionData.session;
  }
  return null;
}

/*
  ── Run this SQL once in your Supabase SQL Editor ────────────────

  create table entries (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid references auth.users not null,
    desc        text not null,
    amount      numeric not null,
    date        date not null,
    category    text not null,
    type        text check (type in ('expense','income')) not null,
    created_at  timestamptz default now()
  );

  create table budgets (
    id        uuid primary key default gen_random_uuid(),
    user_id   uuid references auth.users not null,
    category  text not null,
    "limit"   numeric not null,
    unique(user_id, category)
  );

  alter table entries enable row level security;
  alter table budgets enable row level security;

  create policy "own entries" on entries for all using (auth.uid() = user_id);
  create policy "own budgets" on budgets for all using (auth.uid() = user_id);
*/

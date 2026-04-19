import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

export default function RootLayout() {
  const { setUserId, setUserEmail, loadLocal, syncFromCloud } = useStore();

  useEffect(() => {
    loadLocal();
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      setUserEmail(session?.user.email ?? null);
      if (uid) syncFromCloud();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      setUserEmail(session?.user.email ?? null);
      if (uid) syncFromCloud();
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { configurePurchases, getCustomerInfo, onCustomerInfoUpdate } from '@/lib/purchases';
import { hasProEntitlement } from '@/lib/entitlements';
import ErrorBoundary from '@/lib/ErrorBoundary';

export default function RootLayout() {
  const { setUserId, setUserEmail, loadLocal, syncFromCloud } = useStore();
  const themeMode = useStore(s => s.themeMode);
  const systemScheme = useColorScheme();
  const activeScheme = themeMode === 'system' ? systemScheme : themeMode;
  const statusBarStyle = activeScheme === 'dark' ? 'light' : 'dark';

  useEffect(() => {
    loadLocal();
    configurePurchases();
    getCustomerInfo()
      .then(info => useStore.getState().setIsPro(hasProEntitlement(info)))
      .catch(() => {});
    const unsubPro = onCustomerInfoUpdate(info =>
      useStore.getState().setIsPro(hasProEntitlement(info)),
    );
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
    return () => { subscription.unsubscribe(); unsubPro(); };
  }, []);

  return (
    <ErrorBoundary>
      <StatusBar style={statusBarStyle} />
      <Stack screenOptions={{ headerShown: false }} />
    </ErrorBoundary>
  );
}

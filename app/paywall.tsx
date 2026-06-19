import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { PurchasesPackage } from 'react-native-purchases';
import { useTheme, Theme } from '@/theme/useTheme';
import { useStore } from '@/store/useStore';
import { getCurrentOffering, purchase, restore } from '@/lib/purchases';
import { hasProEntitlement } from '@/lib/entitlements';

// Replace with the real hosted URLs from the landing page (plan Op B1).
const TERMS_URL = 'https://paisopulse.app/terms';
const PRIVACY_URL = 'https://paisopulse.app/privacy';

const PRO_FEATURES = [
  'Remove all ads',
  'Unlock every currency + live conversion',
  'Advanced analytics: trends, ranges & year view',
  'Unlimited budgets & custom categories',
];

export default function Paywall() {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const setIsPro = useStore(st => st.setIsPro);

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCurrentOffering()
      .then(o => setPackages(o?.availablePackages ?? []))
      .catch(() => Alert.alert('Store unavailable', 'Could not load plans. Try again later.'))
      .finally(() => setLoading(false));
  }, []);

  const buy = async (pkg: PurchasesPackage) => {
    setBusy(true);
    try {
      const info = await purchase(pkg);
      if (hasProEntitlement(info)) {
        setIsPro(true);
        Alert.alert('Welcome to Pro 🎉', 'All Pro features are unlocked.');
        router.back();
      } else {
        Alert.alert(
          'Purchase received',
          "Thanks! Your purchase went through but Pro isn't active yet. Tap “Restore purchases”, or contact support if it persists.",
        );
      }
    } catch (e: any) {
      if (!e?.userCancelled) Alert.alert('Purchase failed', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    setBusy(true);
    try {
      const info = await restore();
      if (hasProEntitlement(info)) {
        setIsPro(true);
        Alert.alert('Restored', 'Your Pro purchase has been restored.');
        router.back();
      } else {
        Alert.alert('Nothing to restore', 'No previous Pro purchase was found.');
      }
    } catch (e: any) {
      Alert.alert('Restore failed', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity
          style={s.close}
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        >
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={s.title}>PaisoPulse Pro</Text>
        <Text style={s.subtitle}>Everything you need to master your money.</Text>

        <View style={s.features}>
          {PRO_FEATURES.map(f => (
            <View key={f} style={s.featureRow}>
              <Text style={s.check}>✓</Text>
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : packages.length === 0 ? (
          <Text style={s.empty}>Plans are unavailable right now.</Text>
        ) : (
          packages.map(pkg => (
            <TouchableOpacity
              key={pkg.identifier}
              style={s.planBtn}
              disabled={busy}
              onPress={() => buy(pkg)}
            >
              <Text style={s.planTitle}>{pkg.product.title}</Text>
              <Text style={s.planPrice}>{pkg.product.priceString}</Text>
              {pkg.product.introPrice ? (
                <Text style={s.trialBadge}>7-day free trial</Text>
              ) : null}
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={s.restore} disabled={busy} onPress={doRestore}>
          <Text style={s.restoreText}>Restore purchases</Text>
        </TouchableOpacity>

        <Text style={s.legal}>
          Subscriptions auto-renew until cancelled. Manage or cancel anytime in Google Play.
        </Text>
        <View style={s.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL).catch(() => {})}>
            <Text style={s.legalLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={s.legalDot}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}>
            <Text style={s.legalLink}>Privacy</Text>
          </TouchableOpacity>
        </View>

        {busy && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Theme) => StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.bg },
  scroll:      { padding: 24, paddingBottom: 48 },
  close:       { alignSelf: 'flex-end', padding: 4 },
  closeText:   { fontSize: 22, color: colors.muted },
  title:       { fontSize: 30, fontWeight: '800', color: colors.text, marginTop: 8 },
  subtitle:    { fontSize: 15, color: colors.muted, marginTop: 6, marginBottom: 24 },
  features:    { gap: 12, marginBottom: 28 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  check:       { color: colors.green, fontSize: 16, fontWeight: '800' },
  featureText: { color: colors.text, fontSize: 15, flex: 1 },
  planBtn:     { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary, borderRadius: 14, padding: 18, marginBottom: 12 },
  planTitle:   { fontSize: 16, fontWeight: '700', color: colors.text },
  planPrice:   { fontSize: 20, fontWeight: '800', color: colors.primary, marginTop: 4 },
  trialBadge:  { fontSize: 12, fontWeight: '700', color: colors.green, marginTop: 6 },
  empty:       { color: colors.muted, textAlign: 'center', marginTop: 32 },
  restore:     { alignItems: 'center', marginTop: 20 },
  restoreText: { color: colors.muted, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  legal:      { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 24, lineHeight: 16 },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8 },
  legalLink:  { color: colors.muted, fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
  legalDot:   { color: colors.muted, fontSize: 12 },
});

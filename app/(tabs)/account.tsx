import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, Alert, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase, signInWithGoogle } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { useTheme, Theme } from '@/theme/useTheme';
import AntDesign from '@expo/vector-icons/AntDesign';

type AuthMode = 'signin' | 'signup' | 'reset';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CURRENCIES = [
  { symbol: '₹', code: 'INR', name: 'Indian Rupee'  },
  { symbol: '$', code: 'USD', name: 'US Dollar'      },
  { symbol: '€', code: 'EUR', name: 'Euro'           },
  { symbol: '£', code: 'GBP', name: 'British Pound'  },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen'   },
];

export default function AccountScreen() {
  const { userId, userEmail, syncFromCloud, currency, setCurrency } = useStore();
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  // Form state
  const [email,    setEmailVal]  = useState('');
  const [password, setPassword]  = useState('');
  const [mode,     setMode]      = useState<AuthMode>('signin');
  const [loading,  setLoading]   = useState(false);
  const [formError, setFormError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  // Currency modal
  const [currModal, setCurrModal] = useState(false);
  const selectedCurrency = CURRENCIES.find(c => c.symbol === currency) ?? CURRENCIES[0];

  // ── Validation ──────────────────────────────────────────────────
  const validate = (): boolean => {
    if (!EMAIL_RE.test(email)) { setFormError('Enter a valid email address'); return false; }
    if (mode !== 'reset' && password.length < 6) { setFormError('Password must be at least 6 characters'); return false; }
    setFormError('');
    return true;
  };

  const clearError = () => { if (formError) setFormError(''); };

  // ── Auth handlers ───────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Sign in failed', error.message);
    else syncFromCloud();
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { Alert.alert('Sign up failed', error.message); return; }
    setPendingVerification(true);
  };

  const handleReset = async () => {
    if (!EMAIL_RE.test(email)) { setFormError('Enter a valid email address'); return; }
    setFormError('');
    setLoading(true);
    const redirectTo = makeRedirectUri({ scheme: 'ledger', path: 'auth' });
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setPendingVerification(true); // reuse the same "check inbox" screen
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      const session = await signInWithGoogle();
      if (session) syncFromCloud();
    } catch (e: any) {
      Alert.alert('Google sign-in failed', e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setPendingVerification(false);
    setEmailVal('');
    setPassword('');
    setMode('signin');
  };

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setFormError('');
    setPendingVerification(false);
  };

  // ── Signed-in view ──────────────────────────────────────────────
  if (userId) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>Account</Text>

          <View style={s.card}>
            <View style={s.profileRow}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>◎</Text>
              </View>
              <View style={s.profileInfo}>
                <Text style={s.profileEmail} numberOfLines={1}>
                  {userEmail || 'Your account'}
                </Text>
                <View style={s.syncBadge}>
                  <View style={s.syncDot} />
                  <Text style={s.syncText}>Cloud sync active</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
              <Text style={s.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <PreferencesSection
            currency={currency}
            selectedCurrency={selectedCurrency}
            onCurrencyPress={() => setCurrModal(true)}
          />
        </ScrollView>

        <CurrencyModal
          visible={currModal}
          currency={currency}
          onSelect={(sym) => { setCurrency(sym); setCurrModal(false); }}
          onClose={() => setCurrModal(false)}
        />
      </SafeAreaView>
    );
  }

  // ── Signed-out view ─────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Account</Text>

        <View style={s.card}>

          {/* ── Pending verification (sign-up / reset) ── */}
          {pendingVerification ? (
            <View style={s.pendingBox}>
              <Text style={s.pendingIcon}>✉</Text>
              <Text style={s.pendingTitle}>Check your inbox</Text>
              <Text style={s.pendingBody}>
                We sent a {mode === 'reset' ? 'password reset link' : 'confirmation link'} to{' '}
                <Text style={s.pendingEmail}>{email}</Text>.
                {mode !== 'reset' && '\n\nClick it to activate your account, then sign in.'}
              </Text>
              <TouchableOpacity
                style={s.backBtn}
                onPress={() => { setPendingVerification(false); setMode('signin'); }}
              >
                <Text style={s.backBtnText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ── Google button ── */}
              <TouchableOpacity
                style={[s.googleBtn, loading && { opacity: 0.6 }]}
                onPress={handleGoogle}
                disabled={loading}
                activeOpacity={0.8}
              >
                <AntDesign name="google" size={20} color="#4285F4" />
                <Text style={s.googleText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* ── Divider ── */}
              <View style={s.divider}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>or</Text>
                <View style={s.dividerLine} />
              </View>

              {/* ── Mode tabs (hidden during reset) ── */}
              {mode !== 'reset' && (
                <View style={s.authTabs}>
                  <TouchableOpacity
                    style={[s.authTab, mode === 'signin' && s.authTabActive]}
                    onPress={() => switchMode('signin')}
                  >
                    <Text style={[s.authTabText, mode === 'signin' && s.authTabTextActive]}>Sign In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.authTab, mode === 'signup' && s.authTabActive]}
                    onPress={() => switchMode('signup')}
                  >
                    <Text style={[s.authTabText, mode === 'signup' && s.authTabTextActive]}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── Reset header ── */}
              {mode === 'reset' && (
                <View style={s.resetHeader}>
                  <TouchableOpacity onPress={() => switchMode('signin')}>
                    <Text style={s.backLink}>← Back to sign in</Text>
                  </TouchableOpacity>
                  <Text style={s.resetTitle}>Reset password</Text>
                  <Text style={s.resetSub}>Enter your email and we'll send you a reset link.</Text>
                </View>
              )}

              {/* ── Email ── */}
              <View style={s.formGroup}>
                <Text style={s.inputLabel}>Email</Text>
                <TextInput
                  style={[s.input, formError && formError.includes('email') && s.inputError]}
                  value={email}
                  onChangeText={t => { setEmailVal(t); clearError(); }}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>

              {/* ── Password (hidden in reset mode) ── */}
              {mode !== 'reset' && (
                <View style={s.formGroup}>
                  <Text style={s.inputLabel}>Password</Text>
                  <TextInput
                    style={[s.input, formError && formError.includes('6') && s.inputError]}
                    value={password}
                    onChangeText={t => { setPassword(t); clearError(); }}
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                  />
                  {mode === 'signin' && (
                    <TouchableOpacity
                      style={s.forgotLink}
                      onPress={() => switchMode('reset')}
                    >
                      <Text style={s.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* ── Inline error ── */}
              {!!formError && (
                <Text style={s.errorText}>{formError}</Text>
              )}

              {/* ── Primary action button ── */}
              <TouchableOpacity
                style={[s.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handleReset}
                disabled={loading}
              >
                <Text style={s.primaryBtnText}>
                  {loading
                    ? 'Please wait…'
                    : mode === 'signin'
                      ? 'Sign In'
                      : mode === 'signup'
                        ? 'Create Account'
                        : 'Send Reset Link'}
                </Text>
              </TouchableOpacity>

              {/* ── Offline note (only on signin/signup) ── */}
              {mode !== 'reset' && (
                <View style={s.offlineNote}>
                  <Text style={s.offlineIcon}>○</Text>
                  <Text style={s.offlineText}>
                    The app works fully offline. Sign in is optional — only needed for cloud backup and sync.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Preferences always visible ── */}
        <PreferencesSection
          currency={currency}
          selectedCurrency={selectedCurrency}
          onCurrencyPress={() => setCurrModal(true)}
        />
      </ScrollView>

      <CurrencyModal
        visible={currModal}
        currency={currency}
        onSelect={(sym) => { setCurrency(sym); setCurrModal(false); }}
        onClose={() => setCurrModal(false)}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function PreferencesSection({
  currency, selectedCurrency, onCurrencyPress,
}: {
  currency: string;
  selectedCurrency: typeof CURRENCIES[0];
  onCurrencyPress: () => void;
}) {
  const colors       = useTheme();
  const s            = useMemo(() => makeStyles(colors), [colors]);
  const themeMode    = useStore(state => state.themeMode);
  const setThemeMode = useStore(state => state.setThemeMode);

  return (
    <>
      <Text style={s.sectionTitle}>Preferences</Text>
      <View style={s.settingsCard}>

        {/* Currency row */}
        <TouchableOpacity style={s.settingRow} onPress={onCurrencyPress} activeOpacity={0.7}>
          <View style={s.settingLeft}>
            <View style={s.iconBox}>
              <Text style={s.iconBoxText}>{currency}</Text>
            </View>
            <Text style={s.settingLabel}>Currency</Text>
          </View>
          <View style={s.settingRight}>
            <Text style={s.settingValue}>{selectedCurrency.symbol} {selectedCurrency.code}</Text>
            <Text style={s.chevron}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Theme row */}
        <View style={[s.settingRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <View style={s.settingLeft}>
            <View style={s.iconBox}>
              <Text style={s.iconBoxText}>◐</Text>
            </View>
            <Text style={s.settingLabel}>Theme</Text>
          </View>
          <View style={s.themeToggle}>
            {(['light', 'system', 'dark'] as const).map(m => (
              <TouchableOpacity
                key={m}
                style={[s.themeSegment, themeMode === m && s.themeSegmentActive]}
                onPress={() => setThemeMode(m)}
                activeOpacity={0.7}
              >
                <Text style={[s.themeSegmentText, themeMode === m && { color: colors.primaryFg }]}>
                  {m === 'system' ? 'Auto' : m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </View>
    </>
  );
}

function CurrencyModal({
  visible, currency, onSelect, onClose,
}: {
  visible: boolean;
  currency: string;
  onSelect: (symbol: string) => void;
  onClose: () => void;
}) {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={s.currModal}>
          <View style={s.currHandle} />
          <Text style={s.currTitle}>Select Currency</Text>
          {CURRENCIES.map(c => {
            const active = c.symbol === currency;
            return (
              <TouchableOpacity
                key={c.code}
                style={s.currRow}
                onPress={() => onSelect(c.symbol)}
              >
                <View style={s.currLeft}>
                  <View style={[
                    s.currSymbolBox,
                    active && { backgroundColor: colors.primary + '18', borderColor: colors.primary },
                  ]}>
                    <Text style={[s.currSymbol, active && { color: colors.primary }]}>{c.symbol}</Text>
                  </View>
                  <View>
                    <Text style={[s.currName, active && { color: colors.primary }]}>{c.name}</Text>
                    <Text style={s.currCode}>{c.code}</Text>
                  </View>
                </View>
                {active && <Text style={s.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const makeStyles = (colors: Theme) => StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 110 },
  title: { fontSize: 34, fontWeight: '700', color: colors.text, letterSpacing: -0.5, marginBottom: 20 },

  // Main card
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 14, marginBottom: 24 },

  // ── Signed-in ──
  profileRow:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar:       { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 22, color: colors.muted },
  profileInfo:  { flex: 1, gap: 6 },
  profileEmail: { fontSize: 15, fontWeight: '600', color: colors.text },
  syncBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start' },
  syncDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  syncText:     { fontSize: 12, fontWeight: '500', color: colors.muted },
  signOutBtn:   { backgroundColor: colors.secondary, borderRadius: 10, padding: 13, alignItems: 'center' },
  signOutText:  { fontSize: 15, fontWeight: '600', color: colors.text },

  // ── Pending verification ──
  pendingBox:   { alignItems: 'center', paddingVertical: 12, gap: 10 },
  pendingIcon:  { fontSize: 40 },
  pendingTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  pendingBody:  { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  pendingEmail: { fontWeight: '600', color: colors.text },
  backBtn:      { backgroundColor: colors.secondary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
  backBtnText:  { fontSize: 14, fontWeight: '600', color: colors.text },

  // ── Google button ──
  googleBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 10, padding: 13, borderWidth: 1, borderColor: colors.border },
  googleText:  { fontSize: 15, fontWeight: '600', color: colors.text },

  // ── Divider ──
  divider:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 13, color: colors.muted, fontWeight: '500' },

  // ── Auth tabs ──
  authTabs:         { flexDirection: 'row', backgroundColor: colors.secondary, borderRadius: 10, padding: 4 },
  authTab:          { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  authTabActive:    { backgroundColor: colors.card, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 2 },
  authTabText:      { fontSize: 14, fontWeight: '600', color: colors.muted },
  authTabTextActive:{ color: colors.text },

  // ── Reset mode header ──
  resetHeader: { gap: 6 },
  backLink:    { fontSize: 14, color: colors.primary, fontWeight: '500' },
  resetTitle:  { fontSize: 17, fontWeight: '700', color: colors.text },
  resetSub:    { fontSize: 13, color: colors.muted, lineHeight: 20 },

  // ── Form ──
  formGroup:   { gap: 6 },
  inputLabel:  { fontSize: 14, fontWeight: '500', color: colors.text },
  input:       { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border, borderRadius: 10, color: colors.text, fontSize: 15, padding: 14 },
  inputError:  { borderColor: colors.red },
  forgotLink:  { alignSelf: 'flex-end', marginTop: 6 },
  forgotText:  { fontSize: 13, color: colors.primary, fontWeight: '500' },
  errorText:   { fontSize: 13, color: colors.red, fontWeight: '500' },

  // ── Primary button ──
  primaryBtn:     { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center' },
  primaryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },

  // ── Offline note ──
  offlineNote: { flexDirection: 'row', gap: 10, backgroundColor: colors.secondary, borderRadius: 10, padding: 14 },
  offlineIcon: { fontSize: 15, color: colors.muted, marginTop: 1 },
  offlineText: { flex: 1, fontSize: 13, color: colors.muted, lineHeight: 20 },

  // ── Preferences ──
  sectionTitle:  { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, paddingLeft: 4, marginBottom: 8 },
  settingsCard:  { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  settingRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  settingLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox:       { width: 34, height: 34, borderRadius: 8, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  iconBoxText:   { fontSize: 15, fontWeight: '700', color: colors.text },
  settingLabel:  { fontSize: 16, fontWeight: '500', color: colors.text },
  settingRight:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue:  { fontSize: 15, fontWeight: '500', color: colors.muted },
  chevron:       { fontSize: 20, color: colors.muted },

  // ── Currency modal ──
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  currModal:    { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 44 },
  currHandle:   { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  currTitle:    { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 16 },
  currRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.secondary },
  currLeft:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  currSymbolBox:{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  currSymbol:   { fontSize: 18, fontWeight: '700', color: colors.text },
  currName:     { fontSize: 15, fontWeight: '600', color: colors.text },
  currCode:     { fontSize: 12, color: colors.muted, marginTop: 2 },
  checkmark:    { fontSize: 18, color: colors.primary, fontWeight: '700' },

  themeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 3,
  },
  themeSegment: {
    paddingHorizontal: 10,
    paddingVertical:   6,
    borderRadius:      6,
  },
  themeSegmentActive: {
    backgroundColor: colors.primary,
  },
  themeSegmentText: {
    fontSize:   12,
    fontWeight: '600',
    color:      colors.muted,
  },
});

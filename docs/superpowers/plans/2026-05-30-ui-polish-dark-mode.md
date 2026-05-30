# UI Polish, Dark Mode & Category Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a FAB button, 3-way dark mode, category emoji grid, and a real Google icon to the PaisoPulse app.

**Architecture:** Theme state lives in the Zustand store (persisted via AsyncStorage), resolved by a `useTheme()` hook that returns the active color object. All tab files migrate from a static `LightColors` import to a `makeStyles(colors)` pattern called inside each component via `useMemo`. FAB and category grid changes are isolated to `app/(tabs)/index.tsx`.

**Tech Stack:** React Native / Expo SDK 54, Zustand, AsyncStorage, `@expo/vector-icons` (AntDesign + Feather already installed), `useSafeAreaInsets` (already in use)

---

## File Structure

| Action | File | What changes |
|---|---|---|
| Modify | `src/theme/index.ts` | Add 5 missing keys to `Colors` (dark) |
| Modify | `src/store/useStore.ts` | Add `themeMode` state + `setThemeMode` action |
| **Create** | `src/theme/useTheme.ts` | New hook that resolves active theme |
| Modify | `app/(tabs)/_layout.tsx` | Swap `LightColors` for `useTheme()` |
| Modify | `app/(tabs)/account.tsx` | Theme toggle row, AntDesign Google icon, full theme migration |
| Modify | `app/(tabs)/index.tsx` | FAB, category emoji grid, full theme migration |
| Modify | `app/(tabs)/charts.tsx` | Full theme migration |
| Modify | `app/(tabs)/budgets.tsx` | Full theme migration |

---

### Task 1: Add missing dark color keys

`Colors` (dark) is missing 5 keys that `LightColors` has. The `useTheme` hook (Task 3) casts both objects to `typeof LightColors`, so these keys must exist.

**Files:**
- Modify: `src/theme/index.ts`

- [ ] **Step 1: Update `Colors` to add the 5 missing keys**

Replace the entire `Colors` export with:

```ts
export const Colors = {
  bg:        '#0e0e0f',
  surface:   '#16161a',
  surface2:  '#1e1e24',
  border:    'rgba(255,255,255,0.07)',
  border2:   'rgba(255,255,255,0.12)',
  text:      '#f0efe8',
  muted:     '#7a7a8a',
  accent:    '#c8a96e',
  accent2:   '#e85d26',
  green:     '#3ecf8e',
  red:       '#f06060',
  blue:      '#6ca0e8',
  purple:    '#a88be0',
  card:      '#1e1e24',
  secondary: '#16161a',
  primary:   '#3b82f6',
  primaryFg: '#ffffff',
  input:     '#2a2a32',
};
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/theme/index.ts
git commit -m "feat: add missing dark color keys to Colors theme"
```

---

### Task 2: Add themeMode to Zustand store

**Files:**
- Modify: `src/store/useStore.ts`

- [ ] **Step 1: Add the `THEME_KEY` constant** after the existing `CURRENCY_KEY` line (line 27):

```ts
const THEME_KEY    = 'ledger_theme_v1';
```

- [ ] **Step 2: Add `themeMode` and `setThemeMode` to the `StoreState` interface** (after the `setCurrency` line):

```ts
themeMode:    'light' | 'dark' | 'system';
setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
```

- [ ] **Step 3: Add default `themeMode: 'system'` to the initial store state** (after the `userEmail: null` line):

```ts
themeMode: 'system' as 'light' | 'dark' | 'system',
```

- [ ] **Step 4: Add the `setThemeMode` action** (after the `setCurrency` action):

```ts
setThemeMode: (mode) => {
  set({ themeMode: mode });
  AsyncStorage.setItem(THEME_KEY, mode);
},
```

- [ ] **Step 5: Load persisted `themeMode` in `loadLocal`**

Replace the current `loadLocal` body with:

```ts
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
```

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/store/useStore.ts
git commit -m "feat: add themeMode to store with AsyncStorage persistence"
```

---

### Task 3: Create useTheme hook

**Files:**
- Create: `src/theme/useTheme.ts`

- [ ] **Step 1: Create the hook file**

```ts
import { useColorScheme } from 'react-native';
import { Colors, LightColors } from './index';
import { useStore } from '../store/useStore';

export type Theme = typeof LightColors;

export function useTheme(): Theme {
  const themeMode = useStore(s => s.themeMode);
  const system    = useColorScheme();
  const active    = themeMode === 'system' ? system : themeMode;
  return (active === 'dark' ? Colors : LightColors) as Theme;
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/theme/useTheme.ts
git commit -m "feat: add useTheme hook for dynamic light/dark/system theme"
```

---

### Task 4: Migrate _layout.tsx

Smallest migration — no StyleSheet, just inline object references.

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Swap the import**

Replace:
```ts
import { LightColors } from '@/theme';
```
With:
```ts
import { useTheme } from '@/theme/useTheme';
```

- [ ] **Step 2: Call the hook at the top of `TabLayout`** (after the `const { bottom }` line):

```ts
const colors = useTheme();
```

- [ ] **Step 3: Replace all `LightColors.xxx` references in `screenOptions`**

The full updated `screenOptions` block:
```ts
screenOptions={{
  headerShown: false,
  tabBarStyle: {
    backgroundColor: colors.card,
    borderTopColor:  colors.border,
    borderTopWidth:  1,
    paddingTop:      8,
    paddingBottom,
    height:          tabBarHeight,
  },
  tabBarActiveTintColor:   colors.primary,
  tabBarInactiveTintColor: colors.muted,
  tabBarLabelStyle: {
    fontSize:   11,
    fontWeight: '600',
    marginTop:  2,
  },
  tabBarIconStyle: {
    marginBottom: 0,
  },
}}
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/_layout.tsx
git commit -m "feat: migrate tab layout to dynamic useTheme"
```

---

### Task 5: account.tsx — theme toggle, Google icon, migration

This is the largest account.tsx task. The file has a module-level `StyleSheet` shared by three components (`AccountScreen`, `PreferencesSection`, `CurrencyModal`). Pattern: convert to `makeStyles(colors)`, call `useMemo` in each component.

**Files:**
- Modify: `app/(tabs)/account.tsx`

- [ ] **Step 1: Update imports at the top of the file**

Replace:
```ts
import React, { useState } from 'react';
```
With:
```ts
import React, { useState, useMemo } from 'react';
```

Replace:
```ts
import { LightColors } from '@/theme';
```
With:
```ts
import { useTheme, Theme } from '@/theme/useTheme';
import AntDesign from '@expo/vector-icons/AntDesign';
```

Also add `useStore` to its import (it's already imported — just verify it includes it):
```ts
import { useStore } from '@/store/useStore';
```

- [ ] **Step 2: Add `useTheme` + `useMemo` calls to `AccountScreen`** (after the `useStore` destructure line):

```ts
const colors = useTheme();
const s = useMemo(() => makeStyles(colors), [colors]);
```

- [ ] **Step 3: Replace the Google "G" text with AntDesign icon** (around line 187)

Replace:
```tsx
<Text style={s.googleIcon}>G</Text>
```
With:
```tsx
<AntDesign name="google" size={20} color="#4285F4" />
```

- [ ] **Step 4: Update `PreferencesSection` to use `useTheme`, `makeStyles`, `useStore` for theme toggle**

Replace the entire `PreferencesSection` function with:

```tsx
function PreferencesSection({
  currency, selectedCurrency, onCurrencyPress,
}: {
  currency: string;
  selectedCurrency: typeof CURRENCIES[0];
  onCurrencyPress: () => void;
}) {
  const colors      = useTheme();
  const s           = useMemo(() => makeStyles(colors), [colors]);
  const themeMode   = useStore(state => state.themeMode);
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
```

- [ ] **Step 5: Update `CurrencyModal` to use `useTheme` + `makeStyles`**

Add these two lines at the top of the `CurrencyModal` function body:
```ts
const colors = useTheme();
const s = useMemo(() => makeStyles(colors), [colors]);
```

(The rest of `CurrencyModal`'s JSX is unchanged — it already uses `s.xxx` styles.)

- [ ] **Step 6: Convert the module-level StyleSheet to `makeStyles`**

Replace the line:
```ts
const s = StyleSheet.create({
```
With:
```ts
const makeStyles = (colors: Theme) => StyleSheet.create({
```

And close the function after the closing `});`:
```ts
}); // end StyleSheet.create
```
becomes just:
```ts
});
```
(The function is already closed by the existing `});` at the end of the file — just rename the const.)

Then replace every `LightColors.xxx` inside the StyleSheet with `colors.xxx`. The complete mapping:
- `LightColors.bg` → `colors.bg`
- `LightColors.card` → `colors.card`
- `LightColors.text` → `colors.text`
- `LightColors.muted` → `colors.muted`
- `LightColors.secondary` → `colors.secondary`
- `LightColors.border` → `colors.border`
- `LightColors.primary` → `colors.primary`
- `LightColors.green` → `colors.green`
- `LightColors.red` → `colors.red`
- `LightColors.input` → `colors.input`

- [ ] **Step 7: Add theme toggle styles** inside `makeStyles`, after the `checkmark` entry:

```ts
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
```

- [ ] **Step 8: Remove the now-unused `googleIcon` style** from `makeStyles`:

Delete the line:
```ts
googleIcon:  { fontSize: 16, fontWeight: '700', color: '#4285F4', fontFamily: 'serif' },
```

- [ ] **Step 9: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add app/(tabs)/account.tsx
git commit -m "feat: add theme toggle, Google icon, and dark mode to account screen"
```

---

### Task 6: index.tsx — FAB, category emoji grid, theme migration

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Update imports**

Replace:
```ts
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, Pressable, Platform
} from 'react-native';
```
With:
```ts
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, Pressable, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```

Replace:
```ts
import { LightColors, CAT_COLORS, CATEGORIES } from '@/theme';
```
With:
```ts
import { CAT_COLORS, CATEGORIES } from '@/theme';
import { useTheme, Theme } from '@/theme/useTheme';
```

- [ ] **Step 2: Add `CAT_EMOJIS` constant** directly after the imports, before `export default function HomeScreen()`:

```ts
const CAT_EMOJIS: Record<string, string> = {
  Food:          '🍕',
  Transport:     '🚗',
  Shopping:      '🛍️',
  Bills:         '💡',
  Health:        '💊',
  Entertainment: '🎬',
  Salary:        '💰',
  Freelance:     '💻',
  Other:         '📦',
};
```

- [ ] **Step 3: Add `useTheme`, `useSafeAreaInsets`, and `useMemo` calls inside `HomeScreen`** (after the existing `useStore` destructure, before `const [filter, ...]`):

```ts
const colors   = useTheme();
const s        = useMemo(() => makeStyles(colors), [colors]);
const { bottom } = useSafeAreaInsets();
const tabBarHeight = Platform.OS === 'ios' ? Math.max(bottom + 56, 82) : Math.max(bottom + 64, 76);
```

- [ ] **Step 4: Remove the header "+ Add" button**

Replace:
```tsx
<View style={s.header}>
  <View>
    <Text style={s.title}>PaisoPulse</Text>
    <Text style={s.subtitle}>{format(new Date(), 'MMMM yyyy')}</Text>
  </View>
  <TouchableOpacity onPress={openAdd}>
    <Text style={s.addBtnText}>+ Add</Text>
  </TouchableOpacity>
</View>
```
With:
```tsx
<View style={s.header}>
  <View>
    <Text style={s.title}>PaisoPulse</Text>
    <Text style={s.subtitle}>{format(new Date(), 'MMMM yyyy')}</Text>
  </View>
</View>
```

- [ ] **Step 5: Fix inline `LightColors` references in JSX**

In the `miniRow` section, replace:
```tsx
<View style={[s.iconCircle, { backgroundColor: LightColors.green + '22' }]}>
  <Text style={[s.iconArrow, { color: LightColors.green }]}>↙</Text>
```
With:
```tsx
<View style={[s.iconCircle, { backgroundColor: colors.green + '22' }]}>
  <Text style={[s.iconArrow, { color: colors.green }]}>↙</Text>
```

And:
```tsx
<View style={[s.iconCircle, { backgroundColor: LightColors.red + '18' }]}>
  <Text style={[s.iconArrow, { color: LightColors.red }]}>↗</Text>
```
With:
```tsx
<View style={[s.iconCircle, { backgroundColor: colors.red + '18' }]}>
  <Text style={[s.iconArrow, { color: colors.red }]}>↗</Text>
```

In the entry row, replace:
```tsx
<View style={[s.dot, { backgroundColor: CAT_COLORS[e.category] || LightColors.muted }]} />
```
With:
```tsx
<View style={[s.dot, { backgroundColor: CAT_COLORS[e.category] || colors.muted }]} />
```

Replace:
```tsx
<Text style={[s.itemAmt, { color: e.type === 'expense' ? LightColors.red : LightColors.green }]}>
```
With:
```tsx
<Text style={[s.itemAmt, { color: e.type === 'expense' ? colors.red : colors.green }]}>
```

In the modal, replace:
```tsx
style={[s.amountInput, { color: type === 'expense' ? LightColors.red : LightColors.green }]}
```
With:
```tsx
style={[s.amountInput, { color: type === 'expense' ? colors.red : colors.green }]}
```

Replace both `placeholderTextColor={LightColors.muted}` with `placeholderTextColor={colors.muted}`.

Replace (in catChip):
```tsx
<View style={[s.catDot, { backgroundColor: CAT_COLORS[c] || LightColors.muted }]} />
```
(This line goes away with the new grid — see Step 6.)

Replace (in date "Done" text):
```tsx
<Text style={{ fontSize: 12, color: LightColors.primary, marginLeft: 'auto' }}>Done</Text>
```
With:
```tsx
<Text style={{ fontSize: 12, color: colors.primary, marginLeft: 'auto' }}>Done</Text>
```

- [ ] **Step 6: Replace the category pill scroll with the emoji grid**

Replace the entire category section in the modal (from `<Text style={s.fieldLabel}>Category</Text>` through `</ScrollView>`):

```tsx
{/* Category grid */}
<Text style={s.fieldLabel}>Category</Text>
<View style={s.catGrid}>
  {CATEGORIES.map(c => (
    <TouchableOpacity
      key={c}
      style={[
        s.catCell,
        category === c && {
          backgroundColor: colors.primary + '18',
          borderColor:     colors.primary,
        },
      ]}
      onPress={() => setCategory(c)}
      activeOpacity={0.7}
    >
      <Text style={s.catEmoji}>{CAT_EMOJIS[c]}</Text>
      <Text style={[s.catCellLabel, category === c && { color: colors.primary }]}>{c}</Text>
    </TouchableOpacity>
  ))}
</View>
```

- [ ] **Step 7: Add the FAB** between `</ScrollView>` and `<Modal`:

```tsx
{/* FAB */}
<TouchableOpacity
  style={[s.fab, { bottom: tabBarHeight + 16 }]}
  onPress={openAdd}
  activeOpacity={0.85}
>
  <Text style={s.fabText}>+</Text>
</TouchableOpacity>
```

- [ ] **Step 8: Convert the StyleSheet to `makeStyles`**

Replace:
```ts
const s = StyleSheet.create({
```
With:
```ts
const makeStyles = (colors: Theme) => StyleSheet.create({
```

The closing `});` stays as-is.

Then replace all `LightColors.xxx` inside the styles with `colors.xxx` (same mapping as Task 5 Step 6).

- [ ] **Step 9: Update the styles object for the new/removed components**

Remove these style entries (they belong to the old pill scroll):
```ts
addBtnText: { ... },     // header add button — gone
catScroll:  { ... },     // ScrollView wrapper — gone
catChip:    { ... },     // pill button — gone
catDot:     { ... },     // dot in pill — gone
catChipText:{ ... },     // pill label — gone
```

Add these new style entries (after `fieldLabel`):

```ts
catGrid: {
  flexDirection: 'row',
  flexWrap:      'wrap',
  gap:            8,
  marginBottom:  16,
},
catCell: {
  width:           '30%',
  alignItems:      'center',
  justifyContent:  'center',
  paddingVertical:  12,
  borderRadius:    12,
  borderWidth:      1.5,
  borderColor:     'transparent',
  backgroundColor:  colors.secondary,
  minHeight:        72,
},
catEmoji: {
  fontSize:     22,
  marginBottom:  4,
},
catCellLabel: {
  fontSize:    10,
  fontWeight:  '600',
  color:        colors.muted,
  textAlign:   'center',
},
fab: {
  position:        'absolute',
  right:            20,
  width:            56,
  height:           56,
  borderRadius:     28,
  backgroundColor:  colors.primary,
  alignItems:      'center',
  justifyContent:  'center',
  elevation:        6,
  shadowColor:     '#000',
  shadowOffset:    { width: 0, height: 3 },
  shadowOpacity:    0.2,
  shadowRadius:     6,
},
fabText: {
  fontSize:    28,
  color:       '#fff',
  lineHeight:   30,
  marginTop:   -2,
},
```

- [ ] **Step 10: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: add FAB button, category emoji grid, and dark mode to home screen"
```

---

### Task 7: Migrate charts.tsx

**Files:**
- Modify: `app/(tabs)/charts.tsx`

- [ ] **Step 1: Update imports**

Replace:
```ts
import React, { useMemo } from 'react';
```
With:
```ts
import React, { useMemo, useCallback } from 'react';
```
(No change needed — `useMemo` is already imported. Just add `useTheme`.)

Replace:
```ts
import { LightColors, CAT_COLORS } from '@/theme';
```
With:
```ts
import { CAT_COLORS } from '@/theme';
import { useTheme, Theme } from '@/theme/useTheme';
```

- [ ] **Step 2: Add `useTheme` + `useMemo` calls to `ChartsScreen`** (after the `useStore` destructure):

```ts
const colors = useTheme();
const s      = useMemo(() => makeStyles(colors), [colors]);
```

- [ ] **Step 3: Convert the module-level StyleSheet to `makeStyles`**

Replace:
```ts
const s = StyleSheet.create({
```
With:
```ts
const makeStyles = (colors: Theme) => StyleSheet.create({
```

Replace all `LightColors.xxx` with `colors.xxx` throughout the styles. The file uses `LightColors.bg`, `LightColors.card`, `LightColors.text`, `LightColors.muted`, `LightColors.secondary`, `LightColors.border`, `LightColors.primary`, `LightColors.green`, `LightColors.red`. Apply the same substitution as previous tasks.

- [ ] **Step 4: Fix any inline `LightColors` references in JSX**

Search the JSX for any remaining `LightColors.xxx` and replace with `colors.xxx`. The `TrendChart` sub-component also needs `useTheme` + `makeStyles` calls at its top:

```ts
function TrendChart({ entries }: { entries: Entry[] }) {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  // ... rest unchanged
```

And any inline `LightColors.green`/`LightColors.red` in TrendChart's bar views replace with `colors.green`/`colors.red`.

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/charts.tsx
git commit -m "feat: migrate charts screen to dynamic useTheme"
```

---

### Task 8: Migrate budgets.tsx

**Files:**
- Modify: `app/(tabs)/budgets.tsx`

- [ ] **Step 1: Update imports**

Replace:
```ts
import React, { useState } from 'react';
```
With:
```ts
import React, { useState, useMemo } from 'react';
```

Replace:
```ts
import { LightColors, CAT_COLORS, CATEGORIES } from '@/theme';
```
With:
```ts
import { CAT_COLORS, CATEGORIES } from '@/theme';
import { useTheme, Theme } from '@/theme/useTheme';
```

- [ ] **Step 2: Add `useTheme` + `useMemo` calls to `BudgetsScreen`** (after the `useStore` destructure):

```ts
const colors = useTheme();
const s      = useMemo(() => makeStyles(colors), [colors]);
```

- [ ] **Step 3: Convert the module-level StyleSheet to `makeStyles`**

Replace:
```ts
const s = StyleSheet.create({
```
With:
```ts
const makeStyles = (colors: Theme) => StyleSheet.create({
```

Replace all `LightColors.xxx` with `colors.xxx` throughout the styles.

- [ ] **Step 4: Fix inline `LightColors` references in JSX**

Search the file for any remaining `LightColors.xxx` in JSX (inline style props) and replace with `colors.xxx`.

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/budgets.tsx
git commit -m "feat: migrate budgets screen to dynamic useTheme"
```

---

## Self-Review Notes

- All 4 spec areas covered: FAB (Task 6), dark mode (Tasks 1–5), category grid (Task 6), Google icon (Task 5).
- `Colors` after Task 1 is a superset of `LightColors` — the `as Theme` cast in `useTheme` is safe.
- FAB `bottom` is computed dynamically via `useSafeAreaInsets` — same formula as `_layout.tsx`, no magic numbers.
- `makeStyles` called with `useMemo` in each component — StyleSheet objects are recreated only when theme changes, not every render.
- `PreferencesSection` reads `themeMode`/`setThemeMode` directly from the store — no prop drilling needed.
- The old `addBtnText` and `catScroll`/`catChip`/`catDot`/`catChipText` styles are explicitly removed in Task 6 Step 9 to avoid dead code.

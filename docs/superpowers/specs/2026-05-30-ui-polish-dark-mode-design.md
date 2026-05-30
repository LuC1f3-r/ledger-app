# PaisoPulse — UI Polish, Dark Mode & Category Grid

**Date:** 2026-05-30
**Scope:** FAB button, dark mode (3-way toggle), category picker grid, Google logo in auth button

---

## 1. FAB Button

### Current state
The "+ Add" button lives as a `TouchableOpacity` in the header top-right of `app/(tabs)/index.tsx` (lines 99–101).

### Design
Remove the header button entirely. Add an absolutely-positioned circular FAB:

- **Size:** 56×56px circle
- **Position:** `position: 'absolute'`, `right: 20`, `bottom: tabBarHeight + 16`
- **`tabBarHeight`:** computed from `useSafeAreaInsets()` — same dynamic value the tab bar already uses (`Platform.OS === 'ios' ? Math.max(bottom + 56, 82) : Math.max(bottom + 64, 76)`)
- **Appearance:** `backgroundColor: colors.primary`, white "+" label at 28px font size, drop shadow matching existing card elevation
- **Scope:** `app/(tabs)/index.tsx` only — no other tabs affected

**Files changed:** `app/(tabs)/index.tsx`

---

## 2. Dark Mode

### Current state
`src/theme/index.ts` defines both `Colors` (dark, unused) and `LightColors` (light, hardcoded everywhere). No theme switching exists.

### Design

**Store (`src/store/useStore.ts`):**
- Add `themeMode: 'light' | 'dark' | 'system'` (default `'system'`) to `StoreState`
- Add `setThemeMode: (mode: 'light' | 'dark' | 'system') => void` action
- Persist `themeMode` to AsyncStorage key `'@theme_mode'`
- Load from AsyncStorage on `loadData()` (alongside existing entries/budgets load)

**Fill missing dark color keys (`src/theme/index.ts`):**

`Colors` is currently missing keys that `LightColors` has. Add:
```ts
card: '#1e1e24',
primary: '#3b82f6',
input: '#2a2a32',
secondary: '#94a3b8',
```

**New hook (`src/theme/useTheme.ts`):**
```ts
import { useColorScheme } from 'react-native';
import { Colors, LightColors } from './index';
import { useStore } from '../store/useStore';

export function useTheme() {
  const themeMode = useStore(s => s.themeMode);
  const system = useColorScheme();
  const active = themeMode === 'system' ? system : themeMode;
  return active === 'dark' ? Colors : LightColors;
}
```

**Toggle UI (`app/(tabs)/account.tsx`):**
3-segment pill control in the Preferences section, below the currency picker:
- Segments: `Light`, `System`, `Dark`
- Active segment: `colors.primary` background, white text
- Inactive: `colors.input` background, `colors.subtext` text
- Tapping calls `setThemeMode(mode)`

**Migration — all direct `LightColors` imports replaced:**
- `app/(tabs)/index.tsx`
- `app/(tabs)/charts.tsx`
- `app/(tabs)/budgets.tsx`
- `app/(tabs)/account.tsx`
- `app/(tabs)/_layout.tsx`

Each file: `import { LightColors } from '...'` → `const colors = useTheme()`, all `LightColors.x` → `colors.x`.

**Files changed:** `src/store/useStore.ts`, `src/theme/index.ts`, `src/theme/useTheme.ts` (new), `app/(tabs)/account.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/charts.tsx`, `app/(tabs)/budgets.tsx`, `app/(tabs)/_layout.tsx`

---

## 3. Category Picker Grid

### Current state
The add/edit modal in `app/(tabs)/index.tsx` shows a horizontal `ScrollView` of pill buttons for category selection.

### Design
Replace the horizontal pill scroll with a 3-column wrapped grid:

- **Layout:** `View` with `flexDirection: 'row'`, `flexWrap: 'wrap'` — no FlatList needed (category count is fixed and small)
- **Cell size:** 72×72px rounded square (border-radius 12)
- **Cell contents:** emoji centred (24px) above a short label (11px)
- **Unselected state:** `colors.input` background, `colors.subtext` label
- **Selected state:** `colors.primary` at 15% opacity background, 2px `colors.primary` border, `colors.primary` label
- **Spacing:** `gap: 8` between cells, cells sized to fill row (`width: '30%'` with margin or computed from container)

No changes to category data, the store, or any other screen.

**Files changed:** `app/(tabs)/index.tsx`

---

## 4. Google Logo in Auth Button

### Current state
The Google sign-in button in `app/(tabs)/account.tsx` renders a styled `<Text>G</Text>` as the logo.

### Design
Replace with the real Google logo PNG:

- Add `assets/google-logo.png` (48×48px, from Google's official brand assets)
- Swap `<Text>G</Text>` for `<Image source={require('../../assets/google-logo.png')} style={{ width: 20, height: 20 }} />`
- No layout changes to the button

**Files changed:** `app/(tabs)/account.tsx`, `assets/google-logo.png` (new)

---

## Summary

| Area | Files | Complexity |
|---|---|---|
| FAB button | `app/(tabs)/index.tsx` | Small |
| Dark mode store + hook | `src/store/useStore.ts`, `src/theme/index.ts`, `src/theme/useTheme.ts` | Small |
| Dark mode migration | `app/(tabs)/*.tsx` (5 files), `app/(tabs)/_layout.tsx` | Medium |
| Category picker grid | `app/(tabs)/index.tsx` | Medium |
| Google logo | `app/(tabs)/account.tsx`, `assets/` | Small |

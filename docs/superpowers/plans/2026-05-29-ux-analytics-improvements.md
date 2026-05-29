# UX & Analytics Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Google OAuth sign-in (PKCE bug), add edit-entry + date-picker to the home modal, and add a 6-month income/expense trend chart to the Analytics screen.

**Architecture:** Four isolated changes across four files. OAuth fix is a one-liner swap. Edit/date-picker extends the existing add-entry modal with new state and a native date picker. The trend chart is a new sub-component dropped into charts.tsx using the same View-based bar approach already used in the breakdown chart.

**Tech Stack:** React Native / Expo, TypeScript, Zustand + AsyncStorage, Supabase JS v2, `@react-native-community/datetimepicker`, `date-fns`

---

## File Map

| File | Change |
|---|---|
| `src/lib/supabase.ts` | Replace hash-fragment token parsing with `exchangeCodeForSession` |
| `src/store/useStore.ts` | Add `updateEntry` action + type |
| `app/(tabs)/index.tsx` | Edit mode, date picker, tap-to-edit on rows |
| `app/(tabs)/charts.tsx` | New `TrendChart` sub-component + 6-month `useMemo` |

---

## Task 1: Fix Google OAuth (PKCE)

**Files:**
- Modify: `src/lib/supabase.ts`

- [ ] **Step 1: Open the file and locate the token-parsing block**

  The block to replace is at the bottom of `signInWithGoogle()`, starting after `if (result.type !== 'success') return null;`:

  ```ts
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
  ```

- [ ] **Step 2: Replace the block**

  Delete everything from the comment `// Tokens arrive in the URL hash fragment` to the end of the function. Replace with:

  ```ts
  const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
  if (sessionError) throw sessionError;
  return sessionData.session;
  ```

  The complete updated `signInWithGoogle` function should look like this:

  ```ts
  export async function signInWithGoogle() {
    const redirectTo = makeRedirectUri({ scheme: 'ledger', path: 'auth' });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) throw error ?? new Error('No OAuth URL returned');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return null;

    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
    if (sessionError) throw sessionError;
    return sessionData.session;
  }
  ```

- [ ] **Step 3: Add `.superpowers/` to `.gitignore`**

  Open `.gitignore` (or create it if absent) and append:

  ```
  .superpowers/
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/lib/supabase.ts .gitignore
  git commit -m "fix: replace implicit-flow token parsing with PKCE exchangeCodeForSession"
  ```

- [ ] **Step 5: Manual verification**

  Run `npx expo start` and open the app on a device or emulator. Navigate to the Account tab, tap "Continue with Google", complete the Google sign-in flow, and confirm:
  - The browser closes and returns to the app.
  - The Account tab shows the signed-in view with the user's email and "Cloud sync active".
  - No "Google sign-in failed" alert appears.

---

## Task 2: Install Date Picker Dependency

**Files:** `package.json`, `package-lock.json` (auto-updated)

- [ ] **Step 1: Install the package**

  ```bash
  npx expo install @react-native-community/datetimepicker
  ```

  Expected output ends with something like:
  ```
  ✔ Updated package.json
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add package.json package-lock.json
  git commit -m "chore: add @react-native-community/datetimepicker"
  ```

---

## Task 3: Add `updateEntry` to the Store

**Files:**
- Modify: `src/store/useStore.ts`

- [ ] **Step 1: Add the type to `StoreState`**

  In `src/store/useStore.ts`, add `updateEntry` to the `StoreState` interface after `deleteEntry`:

  ```ts
  deleteEntry:   (id: string) => Promise<void>;
  updateEntry:   (id: string, changes: Partial<Omit<Entry, 'id' | 'created_at'>>) => Promise<void>;
  ```

- [ ] **Step 2: Add the implementation**

  Inside the `create<StoreState>` call, add `updateEntry` after the `deleteEntry` implementation:

  ```ts
  updateEntry: async (id, changes) => {
    const { userId, entries } = get();
    if (userId) {
      await supabase.from('entries').update(changes).eq('id', id);
    }
    const updated = entries.map(e => e.id === id ? { ...e, ...changes } : e);
    set({ entries: updated });
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
  },
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/store/useStore.ts
  git commit -m "feat: add updateEntry action to store"
  ```

---

## Task 4: Edit Entry + Date Picker

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Update imports**

  At the top of `app/(tabs)/index.tsx`, add `Platform` to the React Native import and add the DateTimePicker import:

  ```ts
  import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Modal, Alert, Pressable, Platform
  } from 'react-native';
  import DateTimePicker from '@react-native-community/datetimepicker';
  ```

- [ ] **Step 2: Update the store destructure and add new state**

  Replace the existing destructure and state declarations at the top of `HomeScreen`:

  ```ts
  const { entries, addEntry, deleteEntry, updateEntry, currency } = useStore();
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [modal, setModal] = useState(false);
  const [type, setType] = useState<EntryType>('expense');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  ```

- [ ] **Step 3: Add `openAdd` and `openEdit` helpers**

  Add these two functions after the state declarations (replace the current inline `onPress={() => setModal(true)}` usage — that's updated in Step 6):

  ```ts
  const openAdd = () => {
    setEditingEntry(null);
    setType('expense');
    setDesc('');
    setAmount('');
    setCategory('Food');
    setDate(new Date());
    setShowDatePicker(false);
    setModal(true);
  };

  const openEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setType(entry.type);
    setDesc(entry.desc);
    setAmount(String(entry.amount));
    setCategory(entry.category);
    setDate(new Date(entry.date + 'T00:00:00'));
    setShowDatePicker(false);
    setModal(true);
  };
  ```

  > The `+ 'T00:00:00'` prevents a timezone offset from shifting the date backwards by one day when the ISO string is parsed.

- [ ] **Step 4: Update `save()`**

  Replace the existing `save` function:

  ```ts
  const save = async () => {
    if (!desc.trim() || !amount || isNaN(+amount) || +amount <= 0) {
      Alert.alert('Missing info', 'Please fill in description and a valid amount.');
      return;
    }
    const dateStr = date.toISOString().split('T')[0];
    if (editingEntry) {
      await updateEntry(editingEntry.id, { desc: desc.trim(), amount: +amount, date: dateStr, category, type });
    } else {
      await addEntry({ desc: desc.trim(), amount: +amount, date: dateStr, category, type });
    }
    setModal(false);
    setDesc('');
    setAmount('');
    setEditingEntry(null);
  };
  ```

- [ ] **Step 5: Update the header "+ Add" button**

  Find:
  ```tsx
  <TouchableOpacity onPress={() => setModal(true)}>
    <Text style={s.addBtnText}>+ Add</Text>
  </TouchableOpacity>
  ```

  Replace with:
  ```tsx
  <TouchableOpacity onPress={openAdd}>
    <Text style={s.addBtnText}>+ Add</Text>
  </TouchableOpacity>
  ```

- [ ] **Step 6: Add tap-to-edit on entry rows**

  Find the entry row `Pressable`:
  ```tsx
  <Pressable key={e.id} style={s.item} onLongPress={() => confirmDelete(e)}>
  ```

  Replace with:
  ```tsx
  <Pressable key={e.id} style={s.item} onPress={() => openEdit(e)} onLongPress={() => confirmDelete(e)}>
  ```

- [ ] **Step 7: Update the modal — header, title, cancel, date field, save button**

  **Modal cancel button** — find:
  ```tsx
  <TouchableOpacity onPress={() => setModal(false)}>
    <Text style={s.modalCancel}>Cancel</Text>
  </TouchableOpacity>
  ```
  Replace with:
  ```tsx
  <TouchableOpacity onPress={() => { setModal(false); setEditingEntry(null); setShowDatePicker(false); }}>
    <Text style={s.modalCancel}>Cancel</Text>
  </TouchableOpacity>
  ```

  **Modal title** — find:
  ```tsx
  <Text style={s.modalTitle}>Add Entry</Text>
  ```
  Replace with:
  ```tsx
  <Text style={s.modalTitle}>{editingEntry ? 'Edit Entry' : 'Add Entry'}</Text>
  ```

  **Date field** — find the static date row:
  ```tsx
  {/* Date */}
  <View style={s.fieldRow}>
    <Text style={s.fieldIcon}>📅</Text>
    <Text style={s.fieldStatic}>
      {format(new Date(), 'EEEE, MMM d')}
    </Text>
  </View>
  ```
  Replace with:
  ```tsx
  {/* Date */}
  <TouchableOpacity style={s.fieldRow} onPress={() => setShowDatePicker(v => !v)}>
    <Text style={s.fieldIcon}>📅</Text>
    <Text style={s.fieldStatic}>{format(date, 'EEEE, MMM d')}</Text>
  </TouchableOpacity>
  {showDatePicker && (
    <DateTimePicker
      value={date}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      maximumDate={new Date()}
      onChange={(_, selected) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selected) setDate(selected);
      }}
    />
  )}
  ```

  **Save button text** — find:
  ```tsx
  <Text style={s.saveBtnText}>Save Entry</Text>
  ```
  Replace with:
  ```tsx
  <Text style={s.saveBtnText}>{editingEntry ? 'Save Changes' : 'Save Entry'}</Text>
  ```

- [ ] **Step 8: Commit**

  ```bash
  git add app/(tabs)/index.tsx
  git commit -m "feat: add edit entry and date picker to home screen modal"
  ```

- [ ] **Step 9: Manual verification**

  Run `npx expo start`. On the home screen:
  - Tap "+ Add", verify the date field shows today and is tappable (opens date picker). Pick a past date and confirm it shows correctly in the field. Save — the entry should appear with the chosen date, not today's.
  - Tap an existing entry. Confirm the modal opens pre-filled with that entry's values and title reads "Edit Entry". Change the description and tap "Save Changes". Confirm the list reflects the update.
  - Long-press an entry. Confirm the delete alert still appears.

---

## Task 5: 6-Month Trend Chart

**Files:**
- Modify: `app/(tabs)/charts.tsx`

- [ ] **Step 1: Add `format` to the date-fns import**

  At the top of `app/(tabs)/charts.tsx`, find:
  ```ts
  import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
  ```
  Replace with:
  ```ts
  import { startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';
  ```

- [ ] **Step 2: Add the `trendData` useMemo**

  In `ChartsScreen`, add the following `useMemo` after the existing `catData` memo:

  ```ts
  const trendData = useMemo(() => {
    const months: { key: string; label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ key, label: format(d, 'MMM'), income: 0, expense: 0 });
    }
    entries.forEach(e => {
      const month = months.find(m => m.key === e.date.slice(0, 7));
      if (!month) return;
      if (e.type === 'income') month.income += e.amount;
      else month.expense += e.amount;
    });
    return months;
  }, [entries]);
  ```

- [ ] **Step 3: Render `TrendChart` above the breakdown card**

  In the `ScrollView` inside `ChartsScreen`, find:
  ```tsx
  {/* Spending Breakdown */}
  <View style={s.card}>
  ```

  Insert before it:
  ```tsx
  {/* 6-Month Trend */}
  <View style={s.card}>
    <Text style={s.cardTitle}>6-Month Trend</Text>
    <TrendChart data={trendData} />
  </View>
  ```

- [ ] **Step 4: Add the `TrendChart` sub-component**

  Add this component after the `ChartsScreen` function and before the `StatTile` component:

  ```tsx
  function TrendChart({ data }: {
    data: { key: string; label: string; income: number; expense: number }[]
  }) {
    const maxVal = Math.max(...data.flatMap(m => [m.income, m.expense]), 1);
    const BAR_HEIGHT = 80;

    return (
      <View>
        <View style={tc.legend}>
          <View style={tc.legendItem}>
            <View style={[tc.legendDot, { backgroundColor: LightColors.green }]} />
            <Text style={tc.legendLabel}>Income</Text>
          </View>
          <View style={tc.legendItem}>
            <View style={[tc.legendDot, { backgroundColor: LightColors.red }]} />
            <Text style={tc.legendLabel}>Expenses</Text>
          </View>
        </View>
        <View style={tc.barsRow}>
          {data.map(month => (
            <View key={month.key} style={tc.column}>
              <View style={[tc.barPair, { height: BAR_HEIGHT }]}>
                <View style={[tc.bar, { height: Math.max(2, (month.income / maxVal) * BAR_HEIGHT), backgroundColor: LightColors.green }]} />
                <View style={[tc.bar, { height: Math.max(2, (month.expense / maxVal) * BAR_HEIGHT), backgroundColor: LightColors.red }]} />
              </View>
              <Text style={tc.monthLabel}>{month.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  const tc = StyleSheet.create({
    legend:     { flexDirection: 'row', gap: 16, marginBottom: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot:  { width: 8, height: 8, borderRadius: 4 },
    legendLabel:{ fontSize: 12, color: LightColors.muted, fontWeight: '500' },
    barsRow:    { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    column:     { flex: 1, alignItems: 'center' },
    barPair:    { flexDirection: 'row', gap: 3, alignItems: 'flex-end' },
    bar:        { width: 10, borderRadius: 3 },
    monthLabel: { fontSize: 11, color: LightColors.muted, marginTop: 6, fontWeight: '500' },
  });
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add app/(tabs)/charts.tsx
  git commit -m "feat: add 6-month income/expense trend chart to Analytics screen"
  ```

- [ ] **Step 6: Manual verification**

  Run `npx expo start` and navigate to the Analytics tab. Confirm:
  - A "6-Month Trend" card appears above the Spending Breakdown card.
  - The chart shows 6 month columns with green (income) and red (expense) bars.
  - Months with no data show minimal 2px baseline bars.
  - The legend is visible and correctly labelled.
  - Adding a new entry from the home screen and returning to Analytics reflects the change in the chart.

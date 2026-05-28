# PaisoPulse — UX & Analytics Improvements

**Date:** 2026-05-28  
**Scope:** Google OAuth fix, edit entry + date picker, 6-month trend chart

---

## 1. Google OAuth Fix

### Problem
`signInWithGoogle()` in `src/lib/supabase.ts` manually parses `access_token` and `refresh_token` from the URL hash fragment (implicit flow). Supabase JS v2 defaults to PKCE flow, which returns an authorization `code` in the query string instead. The tokens are always `null`, so the session is never set.

### Solution
Replace the manual URL parsing block with `supabase.auth.exchangeCodeForSession(result.url)`. The existing `onAuthStateChange` listener in `app/_layout.tsx` handles the rest.

**File:** `src/lib/supabase.ts`

**Before (lines 49–58):**
```ts
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

**After:**
```ts
const { data, error } = await supabase.auth.exchangeCodeForSession(result.url);
if (error) throw error;
return data.session;
```

---

## 2. Edit Entry + Date Picker

### Current state
- Entries can only be added (modal) or deleted (long-press).
- The date is always set to today — no way to backdate.
- The modal date field is a static `<Text>` component.

### Design

**Interaction model:**
- Tap an entry row → opens the modal pre-filled with that entry's data (edit mode).
- Long-press an entry row → existing delete confirmation alert (unchanged).

**Modal behaviour:**
- Same modal component used for both add and edit.
- Title shows "Add Entry" or "Edit Entry" depending on mode.
- In edit mode, all fields are pre-filled: amount, category, description, date, type.
- Save button calls `addEntry` (add mode) or `updateEntry` (edit mode).
- No delete button inside the modal — delete stays on long-press.

**Date picker:**
- Date field changes from a static `<Text>` to a `<TouchableOpacity>`.
- Tapping it toggles a `showDatePicker` boolean.
- Renders `@react-native-community/datetimepicker` (not currently installed — requires `expo install @react-native-community/datetimepicker` before building).
  - Android: system date dialog (`display="default"`).
  - iOS: inline spinner inside the modal (`display="spinner"`).
- Selected date formats to `YYYY-MM-DD` for storage (matches existing `Entry.date` type).
- Default date: today (add mode) or the entry's existing date (edit mode).

### Store change

Add `updateEntry` to `src/store/useStore.ts`:

```ts
updateEntry: async (id, changes) => {
  const { userId, entries } = get();
  if (userId) {
    await supabase.from('entries').update(changes).eq('id', id);
  }
  const updated = entries.map(e => e.id === id ? { ...e, ...changes } : e);
  set({ entries: updated });
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
}
```

Add to `StoreState` interface:
```ts
updateEntry: (id: string, changes: Partial<Omit<Entry, 'id' | 'created_at'>>) => Promise<void>;
```

### Files changed
- `src/store/useStore.ts` — add `updateEntry`
- `app/(tabs)/index.tsx` — add `editingEntry` state, `date` state, `showDatePicker` state, DateTimePicker render, tap handler on entry rows, updated `save()` logic

---

## 3. 6-Month Trend Chart

### Current state
The Analytics screen shows an all-time category breakdown and a "This Month" stats grid. There is no view of how spending/income has changed over time.

### Design

Add a new card **above** the existing "Spending Breakdown" card in `app/(tabs)/charts.tsx`.

**Card title:** "6-Month Trend"

**Layout:**
- A row of 6 month columns, evenly spaced.
- Each column contains two vertical bars side by side: income (green, `LightColors.green`) and expense (red, `LightColors.red`).
- Bar heights are proportional to the value, scaled relative to the maximum single bar value across all 6 months. Minimum rendered height: 2px so zero-value bars are still visible as a baseline.
- Month label (3-letter abbreviation, e.g. "Dec") centred below each column.
- Legend row above the bars: `● Income  ● Expenses`

**Data computation (inside `useMemo`):**
1. Generate the last 6 calendar months as `YYYY-MM` keys (including current month).
2. For each entry, derive its `YYYY-MM` key from `entry.date`.
3. Accumulate `income` and `expense` totals per month key.
4. Return an array of `{ month: string, income: number, expense: number }` in chronological order.

**Empty state:** If a month has no entries, both bars render at zero height. No special empty state needed — the zero bars are self-explanatory.

**File:** `app/(tabs)/charts.tsx` — new `TrendChart` sub-component, rendered above the existing breakdown card.

---

## Summary

| Area | Files | Complexity |
|---|---|---|
| Google OAuth fix | `src/lib/supabase.ts` | Small |
| `updateEntry` store action | `src/store/useStore.ts` | Small |
| Edit entry + date picker | `app/(tabs)/index.tsx` | Medium |
| 6-month trend chart | `app/(tabs)/charts.tsx` | Medium |

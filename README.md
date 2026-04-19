# Ledger — React Native Expense Tracker

## Stack
- Expo (SDK 52) + Expo Router
- Supabase (auth + PostgreSQL)
- Zustand (state management)
- react-native-gifted-charts
- date-fns

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase (free)
1. Go to https://supabase.com → New Project
2. Settings → API → copy Project URL and anon key
3. Open `src/lib/supabase.ts` and replace:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. In Supabase → SQL Editor → run the SQL in the comment block inside `supabase.ts`

### 3. Run the app
```bash
npx expo start
```
Scan the QR code with the **Expo Go** app (Android/iOS).

## Build for production (no paid plan needed)
```bash
# Android APK (local build - free)
npx expo run:android

# iOS (needs a Mac + Xcode)
npx expo run:ios
```

## Features
- Add income/expense entries with categories
- Real-time balance, income, spent stats
- Monthly & category analytics charts
- Budget limits per category with progress bars
- Offline-first (AsyncStorage) with optional Supabase cloud sync
- Email auth (sign in / sign up)

## Screens
| Screen | Description |
|--------|-------------|
| Ledger | Transaction list + add modal |
| Analytics | Bar charts, category breakdown, monthly summary |
| Budgets | Set & track category spending limits |
| Account | Sign in/out, cloud sync status |

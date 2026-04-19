import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useStore } from '@/store/useStore';
import { LightColors, CAT_COLORS } from '@/theme';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function ChartsScreen() {
  const { entries, currency } = useStore();

  const fmt = (n: number) => currency + Math.abs(n).toLocaleString('en-IN');

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);

  // This month's stats
  const thisMonth  = entries.filter(e => isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd }));
  const monthExp   = thisMonth.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const monthInc   = thisMonth.filter(e => e.type === 'income' ).reduce((s, e) => s + e.amount, 0);
  const monthSav   = monthInc - monthExp;
  const txCount    = thisMonth.length;

  // Category spending breakdown (all time)
  const catData = useMemo(() => {
    const map: Record<string, number> = {};
    entries.filter(e => e.type === 'expense').forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [entries]);

  const maxCat = catData[0]?.[1] || 1;

  const shortFmt = (n: number) => {
    if (n >= 1000) return currency + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return currency + n.toLocaleString('en-IN');
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Analytics</Text>

        {/* Spending Breakdown */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Spending Breakdown</Text>
          {catData.length === 0
            ? <Text style={s.empty}>Add expense entries to see a breakdown</Text>
            : catData.map(([cat, amt]) => (
              <View key={cat} style={s.breakdownRow}>
                <Text style={s.breakdownLabel}>{cat}</Text>
                <View style={s.barTrack}>
                  <View style={[
                    s.barFill,
                    { width: `${(amt / maxCat) * 100}%` as any, backgroundColor: CAT_COLORS[cat] || LightColors.primary }
                  ]} />
                </View>
                <Text style={s.breakdownAmt}>{shortFmt(amt)}</Text>
              </View>
            ))
          }
        </View>

        {/* This Month */}
        <View style={s.card}>
          <Text style={s.cardTitle}>This Month</Text>
          <View style={s.grid}>
            <StatTile
              icon="↗"
              iconBg={LightColors.red + '18'}
              iconColor={LightColors.red}
              label="Expenses"
              value={fmt(monthExp)}
            />
            <StatTile
              icon="↙"
              iconBg={LightColors.green + '22'}
              iconColor={LightColors.green}
              label="Income"
              value={fmt(monthInc)}
            />
            <StatTile
              icon="◎"
              iconBg={'#3b82f620'}
              iconColor={'#3b82f6'}
              label="Savings"
              value={fmt(monthSav)}
            />
            <StatTile
              icon="#"
              iconBg={LightColors.secondary}
              iconColor={LightColors.muted}
              label="Transactions"
              value={String(txCount)}
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({
  icon, iconBg, iconColor, label, value,
}: { icon: string; iconBg: string; iconColor: string; label: string; value: string }) {
  return (
    <View style={t.tile}>
      <View style={[t.iconBox, { backgroundColor: iconBg }]}>
        <Text style={[t.iconText, { color: iconColor }]}>{icon}</Text>
      </View>
      <Text style={t.tileLabel}>{label}</Text>
      <Text style={t.tileValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: LightColors.bg },
  scroll:         { padding: 20, paddingBottom: 110 },
  title:          { fontSize: 34, fontWeight: '700', color: LightColors.text, letterSpacing: -0.5, marginBottom: 20 },

  card:           { backgroundColor: LightColors.card, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: LightColors.border },
  cardTitle:      { fontSize: 15, fontWeight: '700', color: LightColors.text, marginBottom: 16 },
  empty:          { color: LightColors.muted, fontSize: 13, textAlign: 'center', paddingVertical: 20 },

  // Breakdown
  breakdownRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  breakdownLabel: { fontSize: 14, color: LightColors.text, fontWeight: '500', width: 88 },
  barTrack:       { flex: 1, height: 7, backgroundColor: LightColors.secondary, borderRadius: 4, overflow: 'hidden' },
  barFill:        { height: 7, borderRadius: 4 },
  breakdownAmt:   { fontSize: 13, fontWeight: '600', color: LightColors.text, width: 52, textAlign: 'right' },

  // Grid
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});

const t = StyleSheet.create({
  tile:      { flex: 1, minWidth: '44%', backgroundColor: LightColors.secondary, borderRadius: 14, padding: 16 },
  iconBox:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  iconText:  { fontSize: 16, fontWeight: '700' },
  tileLabel: { fontSize: 12, color: LightColors.muted, fontWeight: '500', marginBottom: 4 },
  tileValue: { fontSize: 18, fontWeight: '700', color: LightColors.text, letterSpacing: -0.3 },
});

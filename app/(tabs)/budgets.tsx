import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, TextInput, Modal, Alert
} from 'react-native';
import { useStore } from '@/store/useStore';
import { LightColors, CAT_COLORS, CATEGORIES } from '@/theme';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const CAT_ICONS: Record<string, string> = {
  Food:          '🛒',
  Transport:     '🚗',
  Shopping:      '🛍️',
  Bills:         '⚡',
  Health:        '💊',
  Entertainment: '🎬',
  Other:         '📌',
};

const expenseCategories = CATEGORIES.filter(c => !['Salary', 'Freelance'].includes(c));

export default function BudgetsScreen() {
  const { entries, budgets, setBudget, currency } = useStore();
  const [modal, setModal] = useState(false);
  const [selCat, setSelCat] = useState('Food');
  const [limitInput, setLimitInput] = useState('');

  const now        = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);

  const thisMonthExp = entries.filter(e =>
    e.type === 'expense' && isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd })
  );

  const categorySpend: Record<string, number> = {};
  thisMonthExp.forEach(e => {
    categorySpend[e.category] = (categorySpend[e.category] || 0) + e.amount;
  });

  const shortFmt = (n: number) => {
    if (n >= 1000) return currency + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return currency + n.toLocaleString('en-IN');
  };

  const save = async () => {
    if (!limitInput || isNaN(+limitInput) || +limitInput <= 0) {
      Alert.alert('Invalid', 'Enter a valid budget amount.'); return;
    }
    await setBudget(selCat, +limitInput);
    setModal(false); setLimitInput('');
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Budgets</Text>

        {/* Set Budget button */}
        <TouchableOpacity style={s.setBtn} onPress={() => setModal(true)}>
          <Text style={s.setBtnText}>+ Set Budget</Text>
        </TouchableOpacity>

        {/* Budget cards */}
        {expenseCategories.map(cat => {
          const spent  = categorySpend[cat] || 0;
          const budget = budgets.find(b => b.category === cat);
          const limit  = budget?.limit ?? 0;
          const pct    = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
          const over   = limit > 0 && spent > limit;
          const barColor = over
            ? LightColors.red
            : pct > 75
              ? '#f59e0b'
              : LightColors.primary;

          return (
            <View key={cat} style={s.card}>
              {/* Card header */}
              <View style={s.cardHeader}>
                <View style={s.cardLeft}>
                  <View style={s.iconBox}>
                    <Text style={s.iconText}>{CAT_ICONS[cat] ?? '📌'}</Text>
                  </View>
                  <Text style={s.catName}>{cat}</Text>
                </View>
                {limit > 0
                  ? <Text style={[s.amtText, over && { color: LightColors.red }]}>
                      {shortFmt(spent)} / {shortFmt(limit)}
                    </Text>
                  : <Text style={s.noLimit}>No limit set</Text>
                }
              </View>

              {/* Progress bar */}
              <View style={s.track}>
                <View style={[s.fill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
              </View>

              {/* Over budget warning */}
              {over && (
                <Text style={s.overText}>Over by {shortFmt(spent - limit)}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Set Budget Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Set Budget Limit</Text>

            {/* Category picker */}
            <Text style={s.modalLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
              {expenseCategories.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    s.chip,
                    selCat === c && { borderColor: CAT_COLORS[c] ?? LightColors.primary, backgroundColor: (CAT_COLORS[c] ?? LightColors.primary) + '18' }
                  ]}
                  onPress={() => setSelCat(c)}
                >
                  <Text style={s.chipIcon}>{CAT_ICONS[c] ?? '📌'}</Text>
                  <Text style={[s.chipText, selCat === c && { color: CAT_COLORS[c] ?? LightColors.primary }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Amount input */}
            <Text style={s.modalLabel}>Monthly limit ({currency})</Text>
            <TextInput
              style={s.input}
              value={limitInput}
              onChangeText={setLimitInput}
              placeholder={`e.g. ${currency}5000`}
              placeholderTextColor={LightColors.muted}
              keyboardType="numeric"
            />

            {/* Actions */}
            <View style={s.actions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={save}>
                <Text style={s.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: LightColors.bg },
  scroll:      { padding: 20, paddingBottom: 110 },
  title:       { fontSize: 34, fontWeight: '700', color: LightColors.text, letterSpacing: -0.5, marginBottom: 16 },

  setBtn:      { backgroundColor: LightColors.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 20 },
  setBtnText:  { color: '#ffffff', fontWeight: '700', fontSize: 16 },

  card:        { backgroundColor: LightColors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: LightColors.border },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox:     { width: 36, height: 36, borderRadius: 8, backgroundColor: LightColors.secondary, alignItems: 'center', justifyContent: 'center' },
  iconText:    { fontSize: 18 },
  catName:     { fontSize: 16, fontWeight: '600', color: LightColors.text },
  amtText:     { fontSize: 14, fontWeight: '600', color: LightColors.muted },
  noLimit:     { fontSize: 13, color: LightColors.muted },

  track:       { height: 6, backgroundColor: LightColors.secondary, borderRadius: 3, overflow: 'hidden' },
  fill:        { height: 6, borderRadius: 3 },
  overText:    { fontSize: 12, color: LightColors.red, marginTop: 8, fontWeight: '500' },

  // Modal
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard:   { backgroundColor: LightColors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44 },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: LightColors.text, marginBottom: 20 },
  modalLabel:  { fontSize: 12, color: LightColors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  chipScroll:  { marginBottom: 20 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: LightColors.border, marginRight: 8, backgroundColor: LightColors.secondary },
  chipIcon:    { fontSize: 14 },
  chipText:    { fontSize: 13, color: LightColors.muted, fontWeight: '600' },
  input:       { backgroundColor: LightColors.secondary, borderWidth: 1, borderColor: LightColors.border, borderRadius: 10, color: LightColors.text, fontSize: 16, padding: 14, marginBottom: 8 },
  actions:     { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn:   { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: LightColors.border, alignItems: 'center' },
  cancelText:  { color: LightColors.muted, fontWeight: '600' },
  saveBtn:     { flex: 2, padding: 14, borderRadius: 12, backgroundColor: LightColors.primary, alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});

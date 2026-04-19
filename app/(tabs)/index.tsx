import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Modal, Alert, Pressable
} from 'react-native';
import { useStore } from '@/store/useStore';
import { LightColors, CAT_COLORS, CATEGORIES } from '@/theme';
import { Entry, EntryType } from '@/lib/types';
import { format } from 'date-fns';

export default function HomeScreen() {
  const { entries, addEntry, deleteEntry, currency } = useStore();
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [modal, setModal] = useState(false);
  const [type, setType] = useState<EntryType>('expense');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');

  const fmt = (n: number) => currency + Math.abs(n).toLocaleString('en-IN');

  const totalIncome  = entries.filter(e => e.type === 'income' ).reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;
  const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter);

  const save = async () => {
    if (!desc.trim() || !amount || isNaN(+amount) || +amount <= 0) {
      Alert.alert('Missing info', 'Please fill in description and a valid amount.');
      return;
    }
    await addEntry({ desc: desc.trim(), amount: +amount, date: new Date().toISOString().split('T')[0], category, type });
    setModal(false); setDesc(''); setAmount('');
  };

  const confirmDelete = (e: Entry) => {
    Alert.alert('Delete entry', `Remove "${e.desc}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(e.id) },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Ledger</Text>
            <Text style={s.subtitle}>{format(new Date(), 'MMMM yyyy')}</Text>
          </View>
          <TouchableOpacity onPress={() => setModal(true)}>
            <Text style={s.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Balance card */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>Total Balance</Text>
          <Text style={s.balanceValue}>{fmt(balance)}</Text>
        </View>

        {/* Income + Spent row */}
        <View style={s.miniRow}>
          <View style={s.miniCard}>
            <View style={[s.iconCircle, { backgroundColor: LightColors.green + '22' }]}>
              <Text style={[s.iconArrow, { color: LightColors.green }]}>↙</Text>
            </View>
            <Text style={s.miniLabel}>Income</Text>
            <Text style={s.miniValue}>{fmt(totalIncome)}</Text>
          </View>
          <View style={s.miniCard}>
            <View style={[s.iconCircle, { backgroundColor: LightColors.red + '18' }]}>
              <Text style={[s.iconArrow, { color: LightColors.red }]}>↗</Text>
            </View>
            <Text style={s.miniLabel}>Spent</Text>
            <Text style={s.miniValue}>{fmt(totalExpense)}</Text>
          </View>
        </View>

        {/* Filter tabs — segmented control */}
        <View style={s.filterContainer}>
          {(['all', 'expense', 'income'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterTab, filter === f && s.filterTabActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[s.filterTabText, filter === f && s.filterTabTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction list */}
        {filtered.length === 0
          ? <Text style={s.empty}>No entries yet. Tap "+ Add" to start.</Text>
          : filtered.map(e => (
            <Pressable key={e.id} style={s.item} onLongPress={() => confirmDelete(e)}>
              <View style={[s.dot, { backgroundColor: CAT_COLORS[e.category] || LightColors.muted }]} />
              <View style={s.itemInfo}>
                <Text style={s.itemName} numberOfLines={1}>{e.desc}</Text>
                <Text style={s.itemMeta}>{e.category} · {e.date}</Text>
              </View>
              <Text style={[s.itemAmt, { color: e.type === 'expense' ? LightColors.red : LightColors.green }]}>
                {e.type === 'expense' ? '-' : '+'}{fmt(e.amount)}
              </Text>
            </Pressable>
          ))
        }
        {filtered.length > 0 && <Text style={s.hint}>Long-press an entry to delete</Text>}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            {/* Modal header */}
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Text style={s.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>Add Entry</Text>
              <View style={{ width: 50 }} />
            </View>

            {/* Expense / Income toggle */}
            <View style={s.typeContainer}>
              <TouchableOpacity
                style={[s.typeBtn, type === 'expense' && s.typeBtnActive]}
                onPress={() => { setType('expense'); setCategory('Food'); }}
              >
                <Text style={[s.typeBtnText, type === 'expense' && s.typeBtnTextActive]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.typeBtn, type === 'income' && s.typeBtnActive]}
                onPress={() => { setType('income'); setCategory('Salary'); }}
              >
                <Text style={[s.typeBtnText, type === 'income' && s.typeBtnTextActive]}>Income</Text>
              </TouchableOpacity>
            </View>

            {/* Large amount display */}
            <TextInput
              style={[s.amountInput, { color: type === 'expense' ? LightColors.red : LightColors.green }]}
              value={amount ? `${currency}${amount}` : ''}
              onChangeText={t => setAmount(t.replace(/[^0-9.]/g, ''))}
              placeholder={`${currency}0.00`}
              placeholderTextColor={LightColors.muted}
              keyboardType="numeric"
            />

            {/* Category pills */}
            <Text style={s.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[s.catChip, category === c && { borderColor: CAT_COLORS[c], backgroundColor: CAT_COLORS[c] + '20' }]}
                  onPress={() => setCategory(c)}
                >
                  <View style={[s.catDot, { backgroundColor: CAT_COLORS[c] || LightColors.muted }]} />
                  <Text style={[s.catChipText, category === c && { color: CAT_COLORS[c] }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Description */}
            <View style={s.fieldRow}>
              <Text style={s.fieldIcon}>≡</Text>
              <TextInput
                style={s.fieldInput}
                value={desc}
                onChangeText={setDesc}
                placeholder="Description"
                placeholderTextColor={LightColors.muted}
              />
            </View>

            {/* Date */}
            <View style={s.fieldRow}>
              <Text style={s.fieldIcon}>📅</Text>
              <Text style={s.fieldStatic}>
                {format(new Date(), 'EEEE, MMM d')}
              </Text>
            </View>

            {/* Save button */}
            <TouchableOpacity style={s.saveBtn} onPress={save}>
              <Text style={s.saveBtnText}>Save Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:                { flex: 1, backgroundColor: LightColors.bg },
  scroll:              { padding: 20, paddingBottom: 110 },

  // Header
  header:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:               { fontSize: 34, fontWeight: '700', color: LightColors.text, letterSpacing: -0.5 },
  subtitle:            { fontSize: 12, color: LightColors.muted, marginTop: 2 },
  addBtnText:          { fontSize: 17, fontWeight: '600', color: LightColors.primary, marginTop: 10 },

  // Balance card
  balanceCard:         { backgroundColor: LightColors.primary, borderRadius: 16, paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center', marginBottom: 12 },
  balanceLabel:        { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 6 },
  balanceValue:        { fontSize: 36, fontWeight: '700', color: '#ffffff', letterSpacing: -1 },

  // Mini cards row
  miniRow:             { flexDirection: 'row', gap: 12, marginBottom: 20 },
  miniCard:            { flex: 1, backgroundColor: LightColors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: LightColors.border },
  iconCircle:          { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  iconArrow:           { fontSize: 16, fontWeight: '700' },
  miniLabel:           { fontSize: 13, color: LightColors.muted, fontWeight: '500', marginBottom: 4 },
  miniValue:           { fontSize: 17, fontWeight: '700', color: LightColors.text },

  // Filter
  filterContainer:     { flexDirection: 'row', backgroundColor: LightColors.secondary, borderRadius: 12, padding: 4, marginBottom: 20 },
  filterTab:           { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  filterTabActive:     { backgroundColor: LightColors.card, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  filterTabText:       { fontSize: 14, fontWeight: '600', color: LightColors.muted },
  filterTabTextActive: { color: LightColors.text },

  // Transactions
  item:                { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: LightColors.secondary },
  dot:                 { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  itemInfo:            { flex: 1 },
  itemName:            { fontSize: 15, fontWeight: '600', color: LightColors.text },
  itemMeta:            { fontSize: 12, color: LightColors.muted, marginTop: 3 },
  itemAmt:             { fontSize: 15, fontWeight: '600' },
  empty:               { textAlign: 'center', color: LightColors.muted, fontSize: 13, marginTop: 48 },
  hint:                { textAlign: 'center', color: LightColors.border, fontSize: 11, marginTop: 20 },

  // Modal
  overlay:             { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard:           { backgroundColor: LightColors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalCancel:         { fontSize: 16, color: LightColors.muted, fontWeight: '500' },
  modalTitle:          { fontSize: 17, fontWeight: '700', color: LightColors.text },

  typeContainer:       { flexDirection: 'row', backgroundColor: LightColors.secondary, borderRadius: 10, padding: 4, marginBottom: 16 },
  typeBtn:             { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  typeBtnActive:       { backgroundColor: LightColors.card, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2 },
  typeBtnText:         { fontSize: 14, fontWeight: '600', color: LightColors.muted },
  typeBtnTextActive:   { color: LightColors.text },

  amountInput:         { fontSize: 42, fontWeight: '700', textAlign: 'center', marginVertical: 12, letterSpacing: -1 },

  fieldLabel:          { fontSize: 13, fontWeight: '600', color: LightColors.text, marginBottom: 8 },
  catScroll:           { marginBottom: 16 },
  catChip:             { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: LightColors.border, marginRight: 8, backgroundColor: LightColors.secondary },
  catDot:              { width: 8, height: 8, borderRadius: 4 },
  catChipText:         { fontSize: 13, color: LightColors.muted, fontWeight: '600' },

  fieldRow:            { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: LightColors.secondary, borderRadius: 10, padding: 14, marginBottom: 10 },
  fieldIcon:           { fontSize: 16, color: LightColors.muted },
  fieldInput:          { flex: 1, fontSize: 15, color: LightColors.text },
  fieldStatic:         { flex: 1, fontSize: 15, color: LightColors.muted },

  saveBtn:             { backgroundColor: LightColors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText:         { color: '#ffffff', fontWeight: '700', fontSize: 16 },
});

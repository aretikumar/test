import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, StyleSheet, Alert } from 'react-native';
import { C } from '../theme';
import { getSettings, saveSettings } from '../storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCS = ['Coventry', 'Rugby', 'Daventry', 'Banbury', 'Birmingham', 'Northampton', 'Leicester'];
const JOB_TYPES = [
  { value: 'part-time', label: '🕐 Part-Time Only', desc: 'Safe for student visa — 20hrs/week' },
  { value: 'full-time', label: '🕐 Full-Time Only', desc: 'Standard 35-40hrs/week roles' },
  { value: 'both', label: '🕐 Both (All Types)', desc: 'Shows all warehouse jobs' },
];

export default function SettingsScreen() {
  const [s2, setS2] = useState({});

  useEffect(() => { getSettings().then(setS2); }, []);

  const save = async () => {
    await saveSettings(s2);
    Alert.alert('Saved', 'Settings updated ✓');
  };

  const set = (k, v) => setS2(p => ({ ...p, [k]: v }));
  const toggleLoc = (loc) => setS2(p => ({ ...p, locations: { ...p.locations, [loc]: !p.locations?.[loc] } }));

  const clearAll = () => {
    Alert.alert('Clear All Data', 'Delete all jobs, applications, logs, profile, and settings?', [
      { text: 'Cancel' },
      { text: 'Delete Everything', style: 'destructive', onPress: async () => {
        await AsyncStorage.clear();
        setS2(await getSettings());
        Alert.alert('Done', 'All data cleared');
      }},
    ]);
  };

  const currentType = s2.job_type_filter || 'part-time';

  return (
    <ScrollView style={st.wrap} contentContainerStyle={{ padding: 16 }}>

      {/* Job Type Selector */}
      <View style={st.card}>
        <Text style={st.heading}>💼 Job Type</Text>
        {JOB_TYPES.map(jt => (
          <TouchableOpacity key={jt.value}
            style={[st.typeOption, currentType === jt.value && st.typeOptionActive]}
            onPress={() => set('job_type_filter', jt.value)}>
            <View style={[st.radio, currentType === jt.value && st.radioActive]}>
              {currentType === jt.value && <View style={st.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.typeLabel, currentType === jt.value && { color: C.accent }]}>{jt.label}</Text>
              <Text style={st.typeDesc}>{jt.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {currentType !== 'part-time' && (
          <View style={st.warning}>
            <Text style={st.warningText}>⚠️ If your friend is on a student visa, only Part-Time is safe (max 20hrs/week during term).</Text>
          </View>
        )}
      </View>

      {/* Auto-Apply */}
      <View style={[st.card, { borderColor: s2.auto_apply_enabled ? C.success : C.border }]}>
        <Text style={st.heading}>⚡ Auto-Apply</Text>
        <View style={st.row}>
          <Text style={st.rowLabel}>Open job links instantly when found</Text>
          <Switch value={!!s2.auto_apply_enabled} onValueChange={v => set('auto_apply_enabled', v)}
            trackColor={{ true: C.success, false: C.border }} thumbColor="#fff" />
        </View>
        <Text style={st.hint}>Opens matching jobs in your browser immediately so you can apply fast.</Text>
      </View>

      {/* Monitoring */}
      <View style={st.card}>
        <Text style={st.heading}>🔍 Monitoring</Text>
        <View style={st.row}>
          <Text style={st.rowLabel}>Enable monitoring</Text>
          <Switch value={!!s2.monitoring_enabled} onValueChange={v => set('monitoring_enabled', v)}
            trackColor={{ true: C.accent, false: C.border }} thumbColor="#fff" />
        </View>
        <Text style={st.label}>Check interval (minutes)</Text>
        <TextInput style={st.input} value={String(s2.check_interval_minutes || 5)}
          onChangeText={v => set('check_interval_minutes', Math.max(5, Number(v) || 5))}
          keyboardType="number-pad" />
        <Text style={st.hint}>Minimum 5 minutes. Lower = faster detection.</Text>
      </View>

      {/* Locations */}
      <View style={st.card}>
        <Text style={st.heading}>📍 Locations</Text>
        {LOCS.map(loc => (
          <View key={loc} style={st.row}>
            <Text style={st.rowLabel}>{loc}</Text>
            <Switch value={!!s2.locations?.[loc]} onValueChange={() => toggleLoc(loc)}
              trackColor={{ true: C.accent, false: C.border }} thumbColor="#fff" />
          </View>
        ))}
      </View>

      {/* Notifications */}
      <View style={st.card}>
        <Text style={st.heading}>🔔 Notifications</Text>
        <View style={st.row}>
          <Text style={st.rowLabel}>Push notifications</Text>
          <Switch value={!!s2.notify_enabled} onValueChange={v => set('notify_enabled', v)}
            trackColor={{ true: C.accent, false: C.border }} thumbColor="#fff" />
        </View>
      </View>

      <TouchableOpacity style={st.saveBtn} onPress={save}>
        <Text style={st.saveTxt}>💾 Save Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={st.dangerBtn} onPress={clearAll}>
        <Text style={st.dangerTxt}>🗑 Clear All App Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  card: { backgroundColor: C.card, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  heading: { color: C.text, fontSize: 16, fontWeight: '600', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel: { color: C.text, fontSize: 14, flex: 1 },
  label: { color: C.dim, fontSize: 12, marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 8, color: C.text, padding: 10, fontSize: 14, width: 80 },
  hint: { color: C.dim, fontSize: 11, marginTop: 6 },
  typeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    marginBottom: 8, backgroundColor: C.input,
  },
  typeOptionActive: { borderColor: C.accent, backgroundColor: '#1a1a35' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: C.accent },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.accent },
  typeLabel: { color: C.text, fontSize: 14, fontWeight: '600' },
  typeDesc: { color: C.dim, fontSize: 11, marginTop: 2 },
  warning: { backgroundColor: '#ff990020', borderRadius: 8, padding: 10, marginTop: 8 },
  warningText: { color: C.accent, fontSize: 12 },
  saveBtn: { backgroundColor: C.accent, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  saveTxt: { color: '#000', fontWeight: '600', fontSize: 15 },
  dangerBtn: { backgroundColor: C.card, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.danger, marginBottom: 30 },
  dangerTxt: { color: C.danger, fontSize: 13 },
});

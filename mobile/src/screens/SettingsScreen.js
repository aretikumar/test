import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, StyleSheet, Alert } from 'react-native';
import { C } from '../theme';
import { getSettings, saveSettings } from '../storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCS = ['Coventry', 'Rugby', 'Daventry', 'Banbury', 'Birmingham', 'Northampton'];

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
    Alert.alert('Clear All Data', 'This will delete all jobs, applications, logs, profile, and settings. Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete Everything', style: 'destructive', onPress: async () => {
        await AsyncStorage.clear();
        setS2(await getSettings());
        Alert.alert('Done', 'All data cleared');
      }},
    ]);
  };

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16 }}>
      {/* Auto-Apply */}
      <View style={[s.card, { borderColor: s2.auto_apply_enabled ? C.success : C.border }]}>
        <Text style={s.heading}>⚡ Auto-Apply</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Open job links instantly when found</Text>
          <Switch value={!!s2.auto_apply_enabled} onValueChange={v => set('auto_apply_enabled', v)}
            trackColor={{ true: C.success, false: C.border }} thumbColor="#fff" />
        </View>
        <Text style={s.hint}>When a matching part-time job is detected, it opens in your browser immediately so you can apply fast.</Text>
      </View>

      {/* Monitoring */}
      <View style={s.card}>
        <Text style={s.heading}>🔍 Monitoring</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Enable monitoring</Text>
          <Switch value={!!s2.monitoring_enabled} onValueChange={v => set('monitoring_enabled', v)}
            trackColor={{ true: C.accent, false: C.border }} thumbColor="#fff" />
        </View>
        <Text style={s.label}>Check interval (minutes)</Text>
        <TextInput style={s.input} value={String(s2.check_interval_minutes || 5)}
          onChangeText={v => set('check_interval_minutes', Math.max(5, Number(v) || 5))}
          keyboardType="number-pad" />
        <Text style={s.hint}>Minimum 5 minutes. Lower = faster detection.</Text>
      </View>

      {/* Locations */}
      <View style={s.card}>
        <Text style={s.heading}>📍 Locations</Text>
        {LOCS.map(loc => (
          <View key={loc} style={s.row}>
            <Text style={s.rowLabel}>{loc}</Text>
            <Switch value={!!s2.locations?.[loc]} onValueChange={() => toggleLoc(loc)}
              trackColor={{ true: C.accent, false: C.border }} thumbColor="#fff" />
          </View>
        ))}
      </View>

      {/* Notifications */}
      <View style={s.card}>
        <Text style={s.heading}>🔔 Notifications</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Push notifications</Text>
          <Switch value={!!s2.notify_enabled} onValueChange={v => set('notify_enabled', v)}
            trackColor={{ true: C.accent, false: C.border }} thumbColor="#fff" />
        </View>
      </View>

      <TouchableOpacity style={s.saveBtn} onPress={save}>
        <Text style={s.saveTxt}>Save Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.dangerBtn} onPress={clearAll}>
        <Text style={s.dangerTxt}>🗑 Clear All App Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  card: { backgroundColor: C.card, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  heading: { color: C.text, fontSize: 16, fontWeight: '600', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel: { color: C.text, fontSize: 14, flex: 1 },
  label: { color: C.dim, fontSize: 12, marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 8, color: C.text, padding: 10, fontSize: 14, width: 80 },
  hint: { color: C.dim, fontSize: 11, marginTop: 6 },
  saveBtn: { backgroundColor: C.accent, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  saveTxt: { color: '#000', fontWeight: '600', fontSize: 15 },
  dangerBtn: { backgroundColor: C.card, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.danger, marginBottom: 30 },
  dangerTxt: { color: C.danger, fontSize: 13 },
});

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, StyleSheet, Alert } from 'react-native';
import { colors } from '../theme';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const LOCATIONS = ['Coventry', 'Rugby', 'Daventry', 'Banbury', 'Birmingham', 'Northampton'];

export default function SettingsScreen() {
  const [settings, setSettings] = useState({});
  const [locations, setLocations] = useState([]);
  const { logout } = useAuth();

  useEffect(() => {
    Promise.all([api.get('/settings'), api.get('/settings/locations')]).then(([s, l]) => {
      setSettings(s);
      setLocations(LOCATIONS.map(loc => {
        const existing = l.find(x => x.location === loc);
        return { location: loc, enabled: existing ? !!existing.enabled : true };
      }));
    }).catch(() => {});
  }, []);

  const save = async () => {
    try {
      await api.put('/settings', settings);
      await api.put('/settings/locations', { locations });
      Alert.alert('Saved', 'Settings updated ✓');
    } catch (err) { Alert.alert('Error', err.message); }
  };

  const toggleLoc = (i) => setLocations(l => l.map((x, j) => j === i ? { ...x, enabled: !x.enabled } : x));
  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      {/* Auto-Apply */}
      <View style={[s.card, { borderColor: settings.auto_apply_enabled ? colors.success : colors.border }]}>
        <Text style={s.heading}>⚡ Auto-Apply</Text>
        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Instantly apply to matching jobs</Text>
          <Switch value={!!settings.auto_apply_enabled} onValueChange={v => set('auto_apply_enabled', v)}
            trackColor={{ true: colors.success, false: colors.border }} thumbColor="#fff" />
        </View>
      </View>

      {/* Monitoring */}
      <View style={s.card}>
        <Text style={s.heading}>Monitoring</Text>
        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Enable monitoring</Text>
          <Switch value={!!settings.monitoring_enabled} onValueChange={v => set('monitoring_enabled', v)}
            trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#fff" />
        </View>
        <Text style={s.label}>Check interval (min)</Text>
        <TextInput style={s.input} value={String(settings.check_interval_minutes || 5)}
          onChangeText={v => set('check_interval_minutes', Number(v) || 5)}
          keyboardType="number-pad" />
      </View>

      {/* Locations */}
      <View style={s.card}>
        <Text style={s.heading}>📍 Locations</Text>
        {locations.map((loc, i) => (
          <View key={loc.location} style={s.switchRow}>
            <Text style={s.switchLabel}>{loc.location}</Text>
            <Switch value={loc.enabled} onValueChange={() => toggleLoc(i)}
              trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#fff" />
          </View>
        ))}
      </View>

      {/* Notifications */}
      <View style={s.card}>
        <Text style={s.heading}>🔔 Notifications</Text>
        {[
          { key: 'notify_email', label: '📧 Email' },
          { key: 'notify_telegram', label: '📱 Telegram' },
          { key: 'notify_browser', label: '🌐 Browser Push' },
        ].map(n => (
          <View key={n.key} style={s.switchRow}>
            <Text style={s.switchLabel}>{n.label}</Text>
            <Switch value={!!settings[n.key]} onValueChange={v => set(n.key, v)}
              trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#fff" />
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.saveBtn} onPress={save}>
        <Text style={s.saveBtnText}>Save Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.card, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  heading: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 10 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  switchLabel: { color: colors.text, fontSize: 14 },
  label: { color: colors.dim, fontSize: 12, marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 8, color: colors.text, padding: 10, fontSize: 14, width: 80 },
  saveBtn: { backgroundColor: colors.accent, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { color: '#000', fontWeight: '600', fontSize: 15 },
  logoutBtn: { backgroundColor: colors.card, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.danger, marginBottom: 30 },
  logoutText: { color: colors.danger, fontSize: 14 },
});

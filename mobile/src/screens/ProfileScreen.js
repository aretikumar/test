import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { C } from '../theme';
import { getProfile, saveProfile } from '../storage';

const FIELDS = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'email', label: 'Email', kb: 'email-address' },
  { key: 'phone', label: 'Phone', kb: 'phone-pad' },
  { key: 'address', label: 'Address' },
  { key: 'work_eligibility', label: 'Work Eligibility', ph: 'e.g. Student visa – 20hrs/week' },
  { key: 'student_availability', label: 'Availability', ph: 'e.g. Evenings & weekends' },
  { key: 'preferred_shifts', label: 'Preferred Shifts', ph: 'e.g. Evening, Night, Weekend' },
  { key: 'amazon_email', label: 'Amazon Account Email', kb: 'email-address' },
];

export default function ProfileScreen() {
  const [form, setForm] = useState({});
  const [note, setNote] = useState('');

  useEffect(() => {
    getProfile().then(p => { setForm(p); setNote(p.cover_note || ''); });
  }, []);

  const save = async () => {
    await saveProfile({ ...form, cover_note: note });
    Alert.alert('Saved', 'Profile updated ✓');
  };

  const clear = () => {
    Alert.alert('Delete Profile', 'Clear all profile data?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await saveProfile({}); setForm({}); setNote(''); } },
    ]);
  };

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16 }}>
      <View style={s.card}>
        {FIELDS.map(f => (
          <View key={f.key} style={s.fw}>
            <Text style={s.label}>{f.label}</Text>
            <TextInput style={s.input} value={form[f.key] || ''} placeholder={f.ph || ''}
              placeholderTextColor={C.dim} keyboardType={f.kb || 'default'}
              autoCapitalize={f.kb ? 'none' : 'words'}
              onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))} />
          </View>
        ))}
        <View style={s.fw}>
          <Text style={s.label}>Cover Note</Text>
          <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={note}
            onChangeText={setNote} multiline placeholder="Optional" placeholderTextColor={C.dim} />
        </View>
      </View>
      <TouchableOpacity style={s.saveBtn} onPress={save}>
        <Text style={s.saveTxt}>Save Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.delBtn} onPress={clear}>
        <Text style={s.delTxt}>Delete Profile Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  card: { backgroundColor: C.card, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  fw: { marginBottom: 12 },
  label: { color: C.dim, fontSize: 12, marginBottom: 4 },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 8, color: C.text, padding: 10, fontSize: 14 },
  saveBtn: { backgroundColor: C.accent, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  saveTxt: { color: '#000', fontWeight: '600', fontSize: 15 },
  delBtn: { backgroundColor: C.card, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.danger, marginBottom: 30 },
  delTxt: { color: C.danger, fontSize: 13 },
});

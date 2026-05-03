import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors } from '../theme';
import { api } from '../api';

const FIELDS = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'email', label: 'Email', keyboard: 'email-address' },
  { key: 'phone', label: 'Phone', keyboard: 'phone-pad' },
  { key: 'address', label: 'Address' },
  { key: 'work_eligibility', label: 'Work Eligibility', placeholder: 'e.g. Student visa – 20hrs/week' },
  { key: 'student_availability', label: 'Availability', placeholder: 'e.g. Evenings & weekends' },
  { key: 'preferred_shifts', label: 'Preferred Shifts', placeholder: 'e.g. Evening, Night, Weekend' },
  { key: 'amazon_email', label: 'Amazon Account Email', keyboard: 'email-address' },
];

export default function ProfileScreen() {
  const [form, setForm] = useState({});
  const [coverNote, setCoverNote] = useState('');

  useEffect(() => {
    api.get('/profile').then(p => { if (p) { setForm(p); setCoverNote(p.cover_note || ''); } }).catch(() => {});
  }, []);

  const save = async () => {
    try {
      await api.put('/profile', { ...form, cover_note: coverNote });
      Alert.alert('Saved', 'Profile updated ✓');
    } catch (err) { Alert.alert('Error', err.message); }
  };

  const deleteProfile = () => {
    Alert.alert('Delete Profile', 'Delete all profile data?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete('/profile');
        setForm({}); setCoverNote('');
      }},
    ]);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      <View style={s.card}>
        {FIELDS.map(f => (
          <View key={f.key} style={s.fieldWrap}>
            <Text style={s.label}>{f.label}</Text>
            <TextInput style={s.input} value={form[f.key] || ''} placeholder={f.placeholder || ''}
              placeholderTextColor={colors.dim} keyboardType={f.keyboard || 'default'}
              autoCapitalize={f.keyboard ? 'none' : 'words'}
              onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))} />
          </View>
        ))}
        <View style={s.fieldWrap}>
          <Text style={s.label}>Cover Note</Text>
          <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={coverNote}
            onChangeText={setCoverNote} multiline placeholder="Optional cover note"
            placeholderTextColor={colors.dim} />
        </View>
      </View>

      <TouchableOpacity style={s.saveBtn} onPress={save}>
        <Text style={s.saveBtnText}>Save Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.deleteBtn} onPress={deleteProfile}>
        <Text style={s.deleteBtnText}>Delete Profile Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.card, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  fieldWrap: { marginBottom: 12 },
  label: { color: colors.dim, fontSize: 12, marginBottom: 4 },
  input: { backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 8, color: colors.text, padding: 10, fontSize: 14 },
  saveBtn: { backgroundColor: colors.accent, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { color: '#000', fontWeight: '600', fontSize: 15 },
  deleteBtn: { backgroundColor: colors.card, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.danger },
  deleteBtnText: { color: colors.danger, fontSize: 13 },
});

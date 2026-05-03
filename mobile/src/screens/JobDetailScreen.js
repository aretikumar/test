import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { colors } from '../theme';
import { api } from '../api';

export default function JobDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [job, setJob] = useState(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => { api.get(`/jobs/${id}`).then(setJob).catch(() => navigation.goBack()); }, [id]);

  if (!job) return <View style={s.container}><Text style={s.dim}>Loading...</Text></View>;

  const isFullTime = job.job_type?.toLowerCase().includes('full-time');
  const statusInfo = {
    applied: { color: colors.success, icon: '✅', text: 'Auto-applied successfully' },
    'auto-applying': { color: colors.accent, icon: '⚡', text: 'Auto-applying...' },
    apply_failed: { color: colors.danger, icon: '❌', text: 'Auto-apply failed — retry below' },
    dismissed: { color: colors.dim, icon: '🚫', text: 'Dismissed' },
    new: { color: colors.blue, icon: '🆕', text: 'Detected — pending auto-apply' },
  };
  const info = statusInfo[job.status] || statusInfo.new;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await api.post(`/jobs/${id}/retry`);
      setJob({ ...job, status: 'applied', already_applied: 1 });
      Alert.alert('Success', 'Applied successfully!');
    } catch (err) { Alert.alert('Failed', err.message); }
    finally { setRetrying(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      {/* Status */}
      <View style={[s.banner, { borderColor: info.color }]}>
        <Text style={[s.bannerText, { color: info.color }]}>{info.icon} {info.text}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.title}>{job.title}</Text>

        <View style={s.row}>
          <View style={s.field}><Text style={s.label}>📍 Location</Text><Text style={s.value}>{job.location}</Text></View>
          <View style={s.field}><Text style={s.label}>⏰ Type</Text><Text style={[s.value, { color: colors.blue }]}>{job.job_type || 'Part-Time'}</Text></View>
        </View>
        <View style={s.row}>
          <View style={s.field}><Text style={s.label}>🔄 Shift</Text><Text style={s.value}>{job.shift || 'Not specified'}</Text></View>
          <View style={s.field}><Text style={s.label}>📅 Detected</Text><Text style={s.value}>{new Date(job.detected_at).toLocaleString()}</Text></View>
        </View>

        {job.description ? <Text style={s.desc}>{job.description}</Text> : null}

        {job.job_url && (
          <TouchableOpacity onPress={() => Linking.openURL(job.job_url)} style={s.linkBtn}>
            <Text style={s.linkText}>🔗 View on Amazon Jobs</Text>
          </TouchableOpacity>
        )}
      </View>

      {isFullTime && (
        <View style={[s.card, { borderColor: colors.danger }]}>
          <Text style={{ color: colors.danger, fontWeight: '600' }}>⚠️ Full-time role — blocked for student visa safety.</Text>
        </View>
      )}

      {job.status === 'apply_failed' && !isFullTime && (
        <TouchableOpacity style={s.retryBtn} onPress={handleRetry} disabled={retrying}>
          <Text style={s.retryText}>{retrying ? 'Retrying...' : '🔄 Retry Auto-Apply'}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  dim: { color: colors.dim, padding: 20 },
  banner: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12, backgroundColor: colors.card },
  bannerText: { fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: colors.card, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  field: { flex: 1 },
  label: { color: colors.dim, fontSize: 12, marginBottom: 2 },
  value: { color: colors.text, fontSize: 14 },
  desc: { color: colors.dim, fontSize: 13, lineHeight: 20, marginTop: 10 },
  linkBtn: { marginTop: 12 },
  linkText: { color: colors.accent, fontSize: 14 },
  retryBtn: { backgroundColor: colors.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  retryText: { color: '#000', fontWeight: '600', fontSize: 15 },
});

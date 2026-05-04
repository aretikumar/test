import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { C } from '../theme';
import { getJobs, updateJob, addApplication, addLog } from '../storage';

export default function JobDetailScreen({ route, navigation }) {
  const { externalId } = route.params;
  const [job, setJob] = useState(null);

  useEffect(() => {
    getJobs().then(jobs => {
      const found = jobs.find(j => j.externalId === externalId);
      if (found) setJob(found); else navigation.goBack();
    });
  }, [externalId]);

  if (!job) return <View style={s.wrap}><Text style={s.dim}>Loading...</Text></View>;

  const openJob = async () => {
    try {
      await Linking.openURL(job.job_url);
      await updateJob(job.externalId, { status: 'opened', already_applied: true });
      await addApplication({ title: job.title, location: job.location, job_type: job.job_type, job_url: job.job_url, status: 'opened' });
      await addLog('manual_open', `${job.title} — ${job.location}`);
      setJob({ ...job, status: 'opened', already_applied: true });
    } catch (err) { Alert.alert('Error', err.message); }
  };

  const dismiss = async () => {
    await updateJob(job.externalId, { status: 'dismissed' });
    setJob({ ...job, status: 'dismissed' });
  };

  const info = {
    opened: { color: C.success, text: '✅ Opened for application' },
    failed: { color: C.danger, text: '❌ Failed to open — retry below' },
    dismissed: { color: C.dim, text: '🚫 Dismissed' },
    new: { color: C.blue, text: '🆕 New — not yet applied' },
  };
  const st = info[job.status] || info.new;

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 16 }}>
      {/* Match indicator */}
      {job.is_match ? (
        <View style={[s.matchBadge, { backgroundColor: '#ff990020', borderColor: C.accent }]}>
          <Text style={{ color: C.accent, fontWeight: '700', fontSize: 13 }}>⭐ Matches your filters — auto-apply enabled</Text>
        </View>
      ) : (
        <View style={[s.matchBadge, { backgroundColor: '#448aff15', borderColor: C.blue }]}>
          <Text style={{ color: C.blue, fontWeight: '600', fontSize: 13 }}>🌐 Browse only — doesn't match your current filters</Text>
        </View>
      )}

      {/* Status */}
      <View style={[s.banner, { borderColor: st.color }]}>
        <Text style={[s.bannerText, { color: st.color }]}>{st.text}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.title}>{job.title}</Text>
        <View style={s.row}>
          <View style={s.field}><Text style={s.label}>📍 Location</Text><Text style={s.value}>{job.location}</Text></View>
          <View style={s.field}><Text style={s.label}>⏰ Type</Text><Text style={[s.value, { color: C.blue }]}>{job.job_type || 'N/A'}</Text></View>
        </View>
        <View style={s.row}>
          <View style={s.field}><Text style={s.label}>🔄 Shift</Text><Text style={s.value}>{job.shift || 'Not specified'}</Text></View>
          <View style={s.field}><Text style={s.label}>📅 Detected</Text><Text style={s.value}>{new Date(job.detected_at).toLocaleString()}</Text></View>
        </View>
        {job.description ? <Text style={s.desc}>{job.description}</Text> : null}
      </View>

      {/* View on Amazon Jobs (read-only link) */}
      {job.view_url ? (
        <TouchableOpacity style={s.viewBtn} onPress={() => Linking.openURL(job.view_url)}>
          <Text style={s.viewBtnText}>👁 View Full Details on Amazon Jobs</Text>
        </TouchableOpacity>
      ) : null}

      {/* Apply button */}
      {!job.already_applied && job.status !== 'dismissed' && (
        <View style={{ gap: 10 }}>
          <TouchableOpacity style={s.applyBtn} onPress={openJob}>
            <Text style={s.applyText}>🔗 Open & Apply on jobsatamazon.co.uk</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.dismissBtn} onPress={dismiss}>
            <Text style={s.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {job.status === 'failed' && (
        <TouchableOpacity style={s.applyBtn} onPress={openJob}>
          <Text style={s.applyText}>🔄 Retry — Open in Browser</Text>
        </TouchableOpacity>
      )}

      {job.already_applied && job.job_url && (
        <TouchableOpacity style={[s.applyBtn, { backgroundColor: C.card, borderWidth: 1, borderColor: C.accent }]}
          onPress={() => Linking.openURL(job.job_url)}>
          <Text style={[s.applyText, { color: C.accent }]}>🔗 Open Job Page Again</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  dim: { color: C.dim, padding: 20 },
  matchBadge: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, alignItems: 'center' },
  banner: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12, backgroundColor: C.card },
  bannerText: { fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: C.card, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  title: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  field: { flex: 1 },
  label: { color: C.dim, fontSize: 12, marginBottom: 2 },
  value: { color: C.text, fontSize: 14 },
  desc: { color: C.dim, fontSize: 13, lineHeight: 20, marginTop: 10 },
  viewBtn: { backgroundColor: C.card, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.blue, marginBottom: 10 },
  viewBtnText: { color: C.blue, fontWeight: '600', fontSize: 14 },
  applyBtn: { backgroundColor: C.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  applyText: { color: '#000', fontWeight: '600', fontSize: 15 },
  dismissBtn: { backgroundColor: C.card, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  dismissText: { color: C.dim, fontSize: 14 },
});

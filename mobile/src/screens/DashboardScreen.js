import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors } from '../theme';
import { api } from '../api';

export default function DashboardScreen() {
  const [stats, setStats] = useState({ total: 0, applied: 0, failed: 0, today: 0 });
  const [settings, setSettings] = useState({});
  const [recentJobs, setRecentJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const nav = useNavigation();

  const load = async () => {
    try {
      const [st, se, j] = await Promise.all([api.get('/jobs/stats'), api.get('/settings'), api.get('/jobs?limit=6')]);
      setStats(st); setSettings(se); setRecentJobs(j.jobs || []);
    } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const toggleMonitoring = async () => {
    try {
      await api.put('/settings', { ...settings, monitoring_enabled: !settings.monitoring_enabled });
      await load();
    } catch (err) { Alert.alert('Error', err.message); }
  };

  const statCards = [
    { label: 'Total', value: stats.total, color: colors.blue },
    { label: 'Applied', value: stats.applied, color: colors.success },
    { label: 'Failed', value: stats.failed, color: colors.danger },
    { label: 'Today', value: stats.today, color: colors.purple },
  ];

  const statusColor = { applied: colors.success, 'auto-applying': colors.accent, apply_failed: colors.danger, new: colors.blue };

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
      {/* Status banner */}
      <View style={[s.banner, { borderColor: settings.monitoring_enabled ? colors.success : colors.danger }]}>
        <View style={[s.dot, { backgroundColor: settings.monitoring_enabled ? colors.success : colors.danger }]} />
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitle}>{settings.monitoring_enabled ? '⚡ AUTO-APPLY ACTIVE' : 'PAUSED'}</Text>
          {settings.monitoring_enabled && (
            <Text style={s.bannerSub}>Every {settings.check_interval_minutes || 5} min · Part-time only</Text>
          )}
        </View>
        <TouchableOpacity style={[s.toggleBtn, { backgroundColor: settings.monitoring_enabled ? colors.danger : colors.success }]} onPress={toggleMonitoring}>
          <Text style={s.toggleBtnText}>{settings.monitoring_enabled ? 'Stop' : 'Start'}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {statCards.map(c => (
          <View key={c.label} style={s.statCard}>
            <Text style={[s.statValue, { color: c.color }]}>{c.value}</Text>
            <Text style={s.statLabel}>{c.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent jobs */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Recent Jobs</Text>
          <TouchableOpacity onPress={() => nav.navigate('Jobs')}>
            <Text style={s.link}>View all →</Text>
          </TouchableOpacity>
        </View>
        {recentJobs.length === 0 ? (
          <Text style={s.empty}>No jobs yet. Start monitoring to auto-apply.</Text>
        ) : recentJobs.map(job => (
          <TouchableOpacity key={job.id} style={[s.jobCard, { borderLeftColor: statusColor[job.status] || colors.border }]}
            onPress={() => nav.navigate('JobDetail', { id: job.id })}>
            <View style={{ flex: 1 }}>
              <Text style={s.jobTitle} numberOfLines={1}>{job.title}</Text>
              <Text style={s.jobMeta}>📍 {job.location}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[s.badge, { color: statusColor[job.status] || colors.dim }]}>
                {job.already_applied ? '✅' : job.status === 'apply_failed' ? '❌' : '🆕'} {job.status}
              </Text>
              <Text style={s.jobDate}>{new Date(job.detected_at).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  banner: { backgroundColor: colors.card, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  bannerTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  bannerSub: { color: colors.dim, fontSize: 11, marginTop: 2 },
  toggleBtn: { borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 },
  toggleBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { color: colors.dim, fontSize: 11, marginTop: 2 },
  section: { backgroundColor: colors.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  link: { color: colors.accent, fontSize: 13 },
  empty: { color: colors.dim, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  jobCard: { backgroundColor: colors.input, borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3 },
  jobTitle: { color: colors.text, fontSize: 14, fontWeight: '500' },
  jobMeta: { color: colors.dim, fontSize: 12, marginTop: 2 },
  badge: { fontSize: 11, fontWeight: '600' },
  jobDate: { color: colors.dim, fontSize: 10, marginTop: 2 },
});

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors } from '../theme';
import { api } from '../api';

export default function JobsScreen() {
  const [jobs, setJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const nav = useNavigation();

  const load = async () => {
    try {
      const data = await api.get('/jobs?limit=100');
      setJobs(data.jobs || []);
    } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const statusColor = { applied: colors.success, 'auto-applying': colors.accent, apply_failed: colors.danger, new: colors.blue, dismissed: colors.dim };

  const renderJob = ({ item }) => (
    <TouchableOpacity style={[s.card, { borderLeftColor: statusColor[item.status] || colors.border }]}
      onPress={() => nav.navigate('JobDetail', { id: item.id })}>
      <View style={{ flex: 1 }}>
        <Text style={s.title} numberOfLines={1}>{item.title}</Text>
        <Text style={s.meta}>📍 {item.location} · ⏰ {item.job_type}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[s.status, { color: statusColor[item.status] || colors.dim }]}>
          {item.already_applied ? '✅ Applied' : item.status}
        </Text>
        <Text style={s.date}>{new Date(item.detected_at).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList data={jobs} keyExtractor={i => String(i.id)} renderItem={renderJob}
      style={s.container} contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      ListEmptyComponent={<Text style={s.empty}>No jobs detected yet.</Text>} />
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.card, borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderWidth: 1, borderColor: colors.border },
  title: { color: colors.text, fontSize: 14, fontWeight: '600' },
  meta: { color: colors.dim, fontSize: 12, marginTop: 3 },
  status: { fontSize: 11, fontWeight: '600' },
  date: { color: colors.dim, fontSize: 10, marginTop: 2 },
  empty: { color: colors.dim, fontSize: 14, textAlign: 'center', marginTop: 40 },
});

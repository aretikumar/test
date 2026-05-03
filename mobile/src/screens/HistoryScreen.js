import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors } from '../theme';
import { api } from '../api';

export default function HistoryScreen() {
  const [apps, setApps] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const nav = useNavigation();

  const load = async () => { try { setApps(await api.get('/settings/applications')); } catch {} };
  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const statusColor = { applied: colors.success, failed: colors.danger, pending: colors.accent, browser_opened: colors.blue };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={s.card} onPress={() => nav.navigate('JobDetail', { id: item.job_id })}>
      <View style={{ flex: 1 }}>
        <Text style={s.title} numberOfLines={1}>{item.title}</Text>
        <Text style={s.meta}>📍 {item.location} · {item.job_type}</Text>
        {item.notes ? <Text style={s.notes} numberOfLines={1}>⚠️ {item.notes}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[s.status, { color: statusColor[item.status] || colors.dim }]}>{item.status}</Text>
        <Text style={s.date}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList data={apps} keyExtractor={i => String(i.id)} renderItem={renderItem}
      style={s.container} contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      ListEmptyComponent={<Text style={s.empty}>No applications yet.</Text>} />
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.card, borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  title: { color: colors.text, fontSize: 14, fontWeight: '600' },
  meta: { color: colors.dim, fontSize: 12, marginTop: 2 },
  notes: { color: colors.danger, fontSize: 11, marginTop: 2 },
  status: { fontSize: 12, fontWeight: '600' },
  date: { color: colors.dim, fontSize: 10, marginTop: 2 },
  empty: { color: colors.dim, fontSize: 14, textAlign: 'center', marginTop: 40 },
});

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { C } from '../theme';
import { getJobs } from '../storage';

export default function JobsScreen() {
  const [jobs, setJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const nav = useNavigation();

  const load = async () => { setJobs(await getJobs()); };
  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const stColor = { opened: C.success, failed: C.danger, new: C.blue, dismissed: C.dim };

  return (
    <FlatList data={jobs} keyExtractor={(item, i) => item.externalId || String(i)}
      style={s.wrap} contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      ListEmptyComponent={<Text style={s.empty}>No jobs detected yet.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity style={[s.card, { borderLeftColor: stColor[item.status] || C.border }]}
          onPress={() => nav.navigate('JobDetail', { externalId: item.externalId })}>
          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={1}>{item.title}</Text>
            <Text style={s.meta}>📍 {item.location} · ⏰ {item.job_type}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.status, { color: stColor[item.status] || C.dim }]}>
              {item.already_applied ? '✅ Applied' : item.status}
            </Text>
            <Text style={s.date}>{new Date(item.detected_at).toLocaleDateString()}</Text>
          </View>
        </TouchableOpacity>
      )} />
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  card: { backgroundColor: C.card, borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderWidth: 1, borderColor: C.border },
  title: { color: C.text, fontSize: 14, fontWeight: '600' },
  meta: { color: C.dim, fontSize: 12, marginTop: 3 },
  status: { fontSize: 11, fontWeight: '600' },
  date: { color: C.dim, fontSize: 10, marginTop: 2 },
  empty: { color: C.dim, fontSize: 14, textAlign: 'center', marginTop: 40 },
});

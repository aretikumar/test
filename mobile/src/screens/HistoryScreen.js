import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../theme';
import { getApplications } from '../storage';

export default function HistoryScreen() {
  const [apps, setApps] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => { setApps(await getApplications()); };
  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const stColor = { opened: C.success, failed: C.danger, pending: C.accent };

  return (
    <FlatList data={apps} keyExtractor={(_, i) => String(i)}
      style={s.wrap} contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      ListEmptyComponent={<Text style={s.empty}>No applications yet.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity style={s.card} onPress={() => item.job_url && Linking.openURL(item.job_url)}>
          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={1}>{item.title}</Text>
            <Text style={s.meta}>📍 {item.location} · {item.job_type}</Text>
            {item.notes ? <Text style={s.notes}>⚠️ {item.notes}</Text> : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.status, { color: stColor[item.status] || C.dim }]}>{item.status}</Text>
            <Text style={s.date}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
        </TouchableOpacity>
      )} />
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  card: { backgroundColor: C.card, borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  title: { color: C.text, fontSize: 14, fontWeight: '600' },
  meta: { color: C.dim, fontSize: 12, marginTop: 2 },
  notes: { color: C.danger, fontSize: 11, marginTop: 2 },
  status: { fontSize: 12, fontWeight: '600' },
  date: { color: C.dim, fontSize: 10, marginTop: 2 },
  empty: { color: C.dim, fontSize: 14, textAlign: 'center', marginTop: 40 },
});

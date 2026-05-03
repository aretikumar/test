import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../theme';
import { getLogs } from '../storage';

export default function LogsScreen() {
  const [logs, setLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => { setLogs(await getLogs()); };
  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const actionColor = {
    auto_opened: C.success, auto_open_failed: C.danger, manual_open: C.blue,
    monitor_found: C.accent, settings_updated: C.dim,
  };

  return (
    <FlatList data={logs} keyExtractor={(_, i) => String(i)}
      style={s.wrap} contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      ListEmptyComponent={<Text style={s.empty}>No activity yet.</Text>}
      renderItem={({ item }) => (
        <View style={s.card}>
          <Text style={[s.action, { color: actionColor[item.action] || C.text }]}>{item.action}</Text>
          {item.details ? <Text style={s.details} numberOfLines={2}>{item.details}</Text> : null}
          <Text style={s.date}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>
      )} />
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  card: { backgroundColor: C.card, borderRadius: 8, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: C.border },
  action: { fontWeight: '600', fontSize: 13 },
  details: { color: C.dim, fontSize: 12, marginTop: 2 },
  date: { color: C.dim, fontSize: 10, marginTop: 4 },
  empty: { color: C.dim, fontSize: 14, textAlign: 'center', marginTop: 40 },
});

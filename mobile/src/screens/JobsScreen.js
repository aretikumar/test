import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Linking } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { C } from '../theme';
import { getJobs } from '../storage';

export default function JobsScreen() {
  const [allJobs, setAllJobs] = useState([]);
  const [tab, setTab] = useState('all'); // 'all' or 'matches'
  const [refreshing, setRefreshing] = useState(false);
  const nav = useNavigation();

  const load = async () => { setAllJobs(await getJobs()); };
  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const matches = allJobs.filter(j => j.is_match);
  const jobs = tab === 'matches' ? matches : allJobs;

  const stColor = { opened: C.success, failed: C.danger, new: C.blue, dismissed: C.dim };

  const renderJob = ({ item }) => (
    <TouchableOpacity style={[s.card, { borderLeftColor: item.is_match ? C.accent : C.border }]}
      onPress={() => nav.navigate('JobDetail', { externalId: item.externalId })}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          {item.is_match && <View style={s.matchDot} />}
          <Text style={s.title} numberOfLines={1}>{item.title}</Text>
        </View>
        <Text style={s.meta}>📍 {item.location} · ⏰ {item.job_type || 'N/A'}</Text>
        {item.shift ? <Text style={s.meta}>🔄 {item.shift}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {item.is_match ? (
          <Text style={[s.status, { color: item.already_applied ? C.success : C.accent }]}>
            {item.already_applied ? '✅ Applied' : '⭐ Match'}
          </Text>
        ) : (
          <Text style={[s.status, { color: C.dim }]}>Browse</Text>
        )}
        <Text style={s.date}>{new Date(item.detected_at).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.wrap}>
      {/* Tab bar */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'all' && s.tabActive]} onPress={() => setTab('all')}>
          <Text style={[s.tabText, tab === 'all' && s.tabTextActive]}>🌐 All Live Roles ({allJobs.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'matches' && s.tabActive]} onPress={() => setTab('matches')}>
          <Text style={[s.tabText, tab === 'matches' && s.tabTextActive]}>⭐ My Matches ({matches.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Info banner */}
      {tab === 'all' && (
        <View style={s.infoBanner}>
          <Text style={s.infoText}>
            Showing all warehouse roles. Jobs with ⭐ match your location & type filters and will be auto-applied.
          </Text>
        </View>
      )}
      {tab === 'matches' && (
        <View style={[s.infoBanner, { borderColor: C.accent }]}>
          <Text style={s.infoText}>
            Only jobs matching your selected locations and job type. These get auto-applied.
          </Text>
        </View>
      )}

      <FlatList data={jobs} keyExtractor={(item, i) => item.externalId || String(i)}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        ListEmptyComponent={
          <Text style={s.empty}>
            {tab === 'matches' ? 'No matching jobs yet. Check your location & job type settings.' : 'No jobs detected yet. Tap "Check Now" on Dashboard.'}
          </Text>
        }
        renderItem={renderJob}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  tabs: { flexDirection: 'row', padding: 12, paddingBottom: 0, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  tabActive: { borderColor: C.accent, backgroundColor: '#ff990015' },
  tabText: { color: C.dim, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: C.accent },
  infoBanner: { marginHorizontal: 12, marginTop: 8, marginBottom: 4, padding: 10, borderRadius: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  infoText: { color: C.dim, fontSize: 11, textAlign: 'center' },
  card: { backgroundColor: C.card, borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderWidth: 1, borderColor: C.border },
  matchDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  title: { color: C.text, fontSize: 14, fontWeight: '600', flex: 1 },
  meta: { color: C.dim, fontSize: 12, marginTop: 2 },
  status: { fontSize: 11, fontWeight: '600' },
  date: { color: C.dim, fontSize: 10, marginTop: 2 },
  empty: { color: C.dim, fontSize: 14, textAlign: 'center', marginTop: 40, paddingHorizontal: 20 },
});

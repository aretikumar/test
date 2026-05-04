import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { C } from '../theme';
import { getSettings, saveSettings, getJobs, getData, setData } from '../storage';
import { runMonitorCycle } from '../monitor';

export default function DashboardScreen() {
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState({ total: 0, applied: 0, failed: 0, today: 0 });
  const [recent, setRecent] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [amazonLogin, setAmazonLogin] = useState(null);
  const nav = useNavigation();

  const load = async () => {
    const [s, login, jobs] = await Promise.all([getSettings(), getData('amazon_login'), getJobs()]);
    setSettings(s);
    setAmazonLogin(login);
    const todayStr = new Date().toISOString().slice(0, 10);
    setStats({
      total: jobs.length,
      applied: jobs.filter(j => j.already_applied).length,
      failed: jobs.filter(j => j.status === 'failed').length,
      today: jobs.filter(j => (j.detected_at || '').startsWith(todayStr)).length,
    });
    setRecent(jobs.slice(0, 8));
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const toggle = async () => {
    const updated = { ...settings, monitoring_enabled: !settings.monitoring_enabled };
    await saveSettings(updated);
    setSettings(updated);
    if (updated.monitoring_enabled) {
      Alert.alert('Monitoring Started', 'Checking for jobs now...');
      checkNow();
    }
  };

  const checkNow = async () => {
    setChecking(true);
    try {
      const result = await runMonitorCycle();
      await load();
      Alert.alert('Check Complete', `Found ${result.found} new roles, ${result.matches || 0} match your filters`);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setChecking(false); }
  };

  const logoutAmazon = async () => {
    await setData('amazon_login', null);
    setAmazonLogin(null);
  };

  const isLoggedIn = amazonLogin?.loggedIn;
  const sc = [
    { label: 'Total', value: stats.total, color: C.blue },
    { label: 'Applied', value: stats.applied, color: C.success },
    { label: 'Failed', value: stats.failed, color: C.danger },
    { label: 'Today', value: stats.today, color: C.purple },
  ];
  const stColor = { opened: C.success, 'auto-applying': C.accent, failed: C.danger, new: C.blue };
  const typeLabel = { 'part-time': '🕐 Part-time', 'full-time': '🕐 Full-time', 'both': '🕐 All types' };

  return (
    <ScrollView style={s.wrap} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}>

      {/* Amazon Account Card */}
      <View style={[s.amazonCard, { borderColor: isLoggedIn ? C.success : C.danger }]}>
        <View style={s.amazonRow}>
          <View style={[s.amazonDot, { backgroundColor: isLoggedIn ? C.success : C.danger }]} />
          <Text style={s.amazonTitle}>Amazon Account</Text>
        </View>

        {isLoggedIn ? (
          <>
            <View style={s.amazonInfo}>
              <Text style={s.amazonLoggedIn}>✅ Logged In</Text>
              {amazonLogin.name ? <Text style={s.amazonDetail}>👤 {amazonLogin.name}</Text> : null}
              {amazonLogin.email ? <Text style={s.amazonDetail}>📧 {amazonLogin.email}</Text> : null}
              <Text style={s.amazonTime}>🕐 Since {new Date(amazonLogin.time).toLocaleString()}</Text>
            </View>
            <View style={s.amazonBtns}>
              <TouchableOpacity style={s.amazonRefreshBtn} onPress={() => nav.navigate('AmazonLogin')}>
                <Text style={s.amazonRefreshTxt}>🔄 Re-login</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.amazonLogoutBtn} onPress={logoutAmazon}>
                <Text style={s.amazonLogoutTxt}>Logout</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={s.amazonNotLogged}>❌ Not logged in</Text>
            <Text style={s.amazonHint}>Log in so job links open with your Amazon profile and you can apply quickly.</Text>
            <TouchableOpacity style={s.amazonLoginBtn} onPress={() => nav.navigate('AmazonLogin')}>
              <Text style={s.amazonLoginTxt}>🔑 Login to Amazon Account</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Monitoring Status */}
      <View style={[s.banner, { borderColor: settings.monitoring_enabled ? C.success : C.danger }]}>
        <View style={[s.dot, { backgroundColor: settings.monitoring_enabled ? C.success : C.danger }]} />
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitle}>{settings.monitoring_enabled ? '⚡ AUTO-APPLY ACTIVE' : '⏸ PAUSED'}</Text>
          {settings.monitoring_enabled && (
            <Text style={s.bannerSub}>Every {settings.check_interval_minutes || 5} min · {typeLabel[settings.job_type_filter] || '🕐 Part-time'}</Text>
          )}
        </View>
        <TouchableOpacity style={[s.toggleBtn, { backgroundColor: settings.monitoring_enabled ? C.danger : C.success }]} onPress={toggle}>
          <Text style={s.toggleText}>{settings.monitoring_enabled ? 'Stop' : 'Start'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.checkBtn} onPress={checkNow} disabled={checking}>
        <Text style={s.checkText}>{checking ? '🔄 Checking...' : '🔍 Check Now'}</Text>
      </TouchableOpacity>

      {/* Stats */}
      <View style={s.statsRow}>
        {sc.map(c => (
          <View key={c.label} style={s.stat}>
            <Text style={[s.statVal, { color: c.color }]}>{c.value}</Text>
            <Text style={s.statLbl}>{c.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent */}
      <View style={s.section}>
        <View style={s.secHead}>
          <Text style={s.secTitle}>Recent Jobs</Text>
          <TouchableOpacity onPress={() => nav.navigate('Jobs')}><Text style={s.link}>All →</Text></TouchableOpacity>
        </View>
        {recent.length === 0 ? (
          <Text style={s.empty}>No jobs yet. Tap "Check Now" or start monitoring.</Text>
        ) : recent.map((job, i) => (
          <TouchableOpacity key={job.externalId || i} style={[s.jobRow, { borderLeftColor: stColor[job.status] || C.border }]}
            onPress={() => nav.navigate('JobDetail', { externalId: job.externalId })}>
            <View style={{ flex: 1 }}>
              <Text style={s.jobTitle} numberOfLines={1}>{job.title}</Text>
              <Text style={s.jobMeta}>📍 {job.location}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[s.badge, { color: stColor[job.status] || C.dim }]}>
                {job.already_applied ? '✅' : job.status === 'failed' ? '❌' : '🆕'} {job.status}
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
  wrap: { flex: 1, backgroundColor: C.bg, padding: 16 },

  // Amazon card
  amazonCard: { backgroundColor: C.card, borderRadius: 12, padding: 16, borderWidth: 1.5, marginBottom: 12 },
  amazonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  amazonDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  amazonTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
  amazonInfo: { marginBottom: 10 },
  amazonLoggedIn: { color: C.success, fontSize: 16, fontWeight: '700' },
  amazonDetail: { color: C.text, fontSize: 14, marginTop: 4 },
  amazonTime: { color: C.dim, fontSize: 11, marginTop: 4 },
  amazonBtns: { flexDirection: 'row', gap: 8 },
  amazonRefreshBtn: { flex: 1, backgroundColor: C.input, borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  amazonRefreshTxt: { color: C.blue, fontWeight: '600', fontSize: 13 },
  amazonLogoutBtn: { backgroundColor: C.input, borderRadius: 8, padding: 10, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1, borderColor: C.danger },
  amazonLogoutTxt: { color: C.danger, fontSize: 13 },
  amazonNotLogged: { color: C.danger, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  amazonHint: { color: C.dim, fontSize: 12, marginBottom: 10, lineHeight: 18 },
  amazonLoginBtn: { backgroundColor: '#ff9900', borderRadius: 10, padding: 14, alignItems: 'center' },
  amazonLoginTxt: { color: '#000', fontWeight: '700', fontSize: 16 },

  // Rest
  banner: { backgroundColor: C.card, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  bannerTitle: { color: C.text, fontWeight: '700', fontSize: 15 },
  bannerSub: { color: C.dim, fontSize: 11, marginTop: 2 },
  toggleBtn: { borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8 },
  toggleText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  checkBtn: { backgroundColor: C.card, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.accent, marginBottom: 12 },
  checkText: { color: C.accent, fontWeight: '600', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: C.card, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statVal: { fontSize: 22, fontWeight: '700' },
  statLbl: { color: C.dim, fontSize: 11, marginTop: 2 },
  section: { backgroundColor: C.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 20 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  secTitle: { color: C.text, fontSize: 16, fontWeight: '600' },
  link: { color: C.accent, fontSize: 13 },
  empty: { color: C.dim, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  jobRow: { backgroundColor: C.input, borderRadius: 8, padding: 12, marginBottom: 6, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3 },
  jobTitle: { color: C.text, fontSize: 14, fontWeight: '500' },
  jobMeta: { color: C.dim, fontSize: 12, marginTop: 2 },
  badge: { fontSize: 11, fontWeight: '600' },
  jobDate: { color: C.dim, fontSize: 10, marginTop: 2 },
});

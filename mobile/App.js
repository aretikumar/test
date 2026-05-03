import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { C } from './src/theme';
import { requestPermissions } from './src/notify';
import { runMonitorCycle } from './src/monitor';
import { getSettings } from './src/storage';

import DashboardScreen from './src/screens/DashboardScreen';
import JobsScreen from './src/screens/JobsScreen';
import JobDetailScreen from './src/screens/JobDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import LogsScreen from './src/screens/LogsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TASK_NAME = 'JOB_MONITOR_TASK';

// Background task definition
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const settings = await getSettings();
    if (!settings.monitoring_enabled) return BackgroundFetch.BackgroundFetchResult.NoData;
    const result = await runMonitorCycle();
    return result.found > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

const darkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: { ...DefaultTheme.colors, background: C.bg, card: C.card, text: C.text, border: C.border, primary: C.accent },
};

const headerOpts = {
  headerStyle: { backgroundColor: C.card },
  headerTintColor: C.text,
  headerTitleStyle: { fontWeight: '600' },
};

function HomeTabs() {
  return (
    <Tab.Navigator screenOptions={{
      ...headerOpts,
      tabBarStyle: { backgroundColor: C.card, borderTopColor: C.border, height: 56, paddingBottom: 6 },
      tabBarActiveTintColor: C.accent,
      tabBarInactiveTintColor: C.dim,
      tabBarLabelStyle: { fontSize: 11 },
    }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: '📊 Home', title: 'Job Monitor' }} />
      <Tab.Screen name="Jobs" component={JobsScreen} options={{ tabBarLabel: '💼 Jobs' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: '📋 Applied', title: 'Applications' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: '👤 Profile' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: '⚙️ Settings' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const intervalRef = useRef(null);

  useEffect(() => {
    // Request notification permissions
    requestPermissions();

    // Register background fetch
    (async () => {
      try {
        await BackgroundFetch.registerTaskAsync(TASK_NAME, {
          minimumInterval: 5 * 60, // 5 minutes
          stopOnTerminate: false,
          startOnBoot: true,
        });
      } catch (err) {
        console.log('[bg] Background fetch registration failed:', err.message);
      }
    })();

    // Foreground timer: check every N minutes while app is open
    const startTimer = async () => {
      const settings = await getSettings();
      const ms = (settings.check_interval_minutes || 5) * 60 * 1000;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(async () => {
        const s = await getSettings();
        if (s.monitoring_enabled) {
          console.log('[timer] Running monitor cycle...');
          await runMonitorCycle();
        }
      }, ms);
    };

    startTimer();

    // Re-check when app comes to foreground
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') startTimer();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, []);

  return (
    <NavigationContainer theme={darkTheme}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={headerOpts}>
        <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ headerShown: false }} />
        <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Details' }} />
        <Stack.Screen name="Logs" component={LogsScreen} options={{ title: 'Activity Logs' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

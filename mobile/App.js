import React, { useEffect, useRef } from 'react';
import { AppState, View, Text } from 'react-native';
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
import AmazonLoginScreen from './src/screens/AmazonLoginScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TASK_NAME = 'JOB_MONITOR_TASK';

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
  headerStyle: { backgroundColor: C.card, elevation: 0, shadowOpacity: 0 },
  headerTintColor: C.text,
  headerTitleStyle: { fontWeight: '700' },
};

// Colourful tab icon component
function TabIcon({ emoji, color, focused }) {
  return (
    <View style={{
      alignItems: 'center', justifyContent: 'center',
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: focused ? `${color}25` : 'transparent',
    }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
    </View>
  );
}

// App logo header
function LogoTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: '#ff9900', alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 18 }}>🏭</Text>
      </View>
      <View>
        <Text style={{ color: '#ff9900', fontSize: 16, fontWeight: '800' }}>Job Monitor</Text>
        <Text style={{ color: C.dim, fontSize: 9 }}>Amazon UK Warehouse</Text>
      </View>
    </View>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator screenOptions={{
      ...headerOpts,
      tabBarStyle: {
        backgroundColor: C.card,
        borderTopColor: C.border,
        borderTopWidth: 1,
        height: 65,
        paddingBottom: 8,
        paddingTop: 4,
      },
      tabBarActiveTintColor: C.accent,
      tabBarInactiveTintColor: C.dim,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
    }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{
        headerTitle: () => <LogoTitle />,
        tabBarLabel: 'Home',
        tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" color="#ff9900" focused={focused} />,
      }} />
      <Tab.Screen name="Jobs" component={JobsScreen} options={{
        tabBarLabel: 'Jobs',
        tabBarIcon: ({ focused }) => <TabIcon emoji="💼" color="#448aff" focused={focused} />,
      }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{
        title: 'Applications',
        tabBarLabel: 'Applied',
        tabBarIcon: ({ focused }) => <TabIcon emoji="✅" color="#00e676" focused={focused} />,
      }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ focused }) => <TabIcon emoji="👤" color="#b388ff" focused={focused} />,
      }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{
        tabBarLabel: 'Settings',
        tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" color="#18ffff" focused={focused} />,
      }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const intervalRef = useRef(null);

  useEffect(() => {
    requestPermissions();

    (async () => {
      try {
        await BackgroundFetch.registerTaskAsync(TASK_NAME, {
          minimumInterval: 5 * 60,
          stopOnTerminate: false,
          startOnBoot: true,
        });
      } catch (err) {
        console.log('[bg] Background fetch registration failed:', err.message);
      }
    })();

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
        <Stack.Screen name="AmazonLogin" component={AmazonLoginScreen} options={{ title: 'Amazon Login', headerStyle: { backgroundColor: '#ff9900' }, headerTintColor: '#000' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/AuthContext';
import { colors } from './src/theme';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import JobsScreen from './src/screens/JobsScreen';
import JobDetailScreen from './src/screens/JobDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const darkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.card, text: colors.text, border: colors.border, primary: colors.accent },
};

const screenOpts = { headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text, headerTitleStyle: { fontWeight: '600' } };

function TabIcon({ label }) {
  const icons = { Dashboard: '📊', Jobs: '💼', Profile: '👤', History: '📋', Settings: '⚙️' };
  return <View><StatusBar style="light" /><ActivityIndicator size={0} /></View>;
}

function HomeTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      ...screenOpts,
      tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.dim,
      tabBarLabel: route.name,
      tabBarIcon: ({ color }) => {
        const icons = { Dashboard: '📊', Jobs: '💼', Profile: '👤', History: '📋', Settings: '⚙️' };
        return <View><StatusBar style="light" /></View>;
      },
    })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: '📊 Home' }} />
      <Tab.Screen name="Jobs" component={JobsScreen} options={{ tabBarLabel: '💼 Jobs' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Applications', tabBarLabel: '📋 Applied' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: '👤 Profile' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: '⚙️ Settings' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuth, loading } = useAuth();

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={colors.accent} size="large" /></View>;

  return (
    <NavigationContainer theme={darkTheme}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={screenOpts}>
        {isAuth ? (
          <>
            <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ headerShown: false }} />
            <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Details' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

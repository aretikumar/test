import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '../theme';
import { api, setServerUrl, getServerUrl } from '../api';
import { useAuth } from '../AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrlState] = useState(getServerUrl());
  const [isRegister, setIsRegister] = useState(false);
  const [showServer, setShowServer] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) return Alert.alert('Error', 'Email and password required');
    setLoading(true);
    try {
      setServerUrl(serverUrl);
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const data = await api.post(endpoint, { email, password });
      await login(data.token);
    } catch (err) {
      Alert.alert('Error', err.message === 'SESSION_EXPIRED' ? 'Invalid credentials' : err.message);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.card}>
        <Text style={s.title}>🏭 Amazon Job Monitor</Text>
        <Text style={s.subtitle}>UK Warehouse · Part-Time Auto-Apply</Text>

        <TouchableOpacity onPress={() => setShowServer(!showServer)}>
          <Text style={s.serverToggle}>⚙️ Server: {serverUrl}</Text>
        </TouchableOpacity>
        {showServer && (
          <TextInput style={s.input} value={serverUrl} onChangeText={setServerUrlState}
            placeholder="http://192.168.1.100:3001" placeholderTextColor={colors.dim}
            autoCapitalize="none" autoCorrect={false} />
        )}

        <TextInput style={s.input} value={email} onChangeText={setEmail}
          placeholder="Email" placeholderTextColor={colors.dim}
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        <TextInput style={s.input} value={password} onChangeText={setPassword}
          placeholder="Password" placeholderTextColor={colors.dim} secureTextEntry />

        <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading}>
          <Text style={s.btnText}>{loading ? '...' : isRegister ? 'Create Account' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
          <Text style={s.toggle}>{isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 24, borderWidth: 1, borderColor: colors.border },
  title: { color: colors.accent, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: colors.dim, fontSize: 13, textAlign: 'center', marginBottom: 20 },
  serverToggle: { color: colors.dim, fontSize: 11, textAlign: 'center', marginBottom: 8 },
  input: { backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 8, color: colors.text, padding: 12, fontSize: 15, marginBottom: 12 },
  btn: { backgroundColor: colors.accent, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#000', fontWeight: '600', fontSize: 16 },
  toggle: { color: colors.accent, fontSize: 13, textAlign: 'center', marginTop: 16 },
});

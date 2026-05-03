import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('token').then(t => {
      if (t) setToken(t);
      setLoading(false);
    });
  }, []);

  const login = async (t) => {
    await SecureStore.setItemAsync('token', t);
    setToken(t);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isAuth: !!token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

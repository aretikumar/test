import * as SecureStore from 'expo-secure-store';

// CHANGE THIS to your server's IP/URL
// When running locally, use your PC's local IP (e.g. 192.168.1.x:3001)
// When deployed, use your server URL
let BASE_URL = 'http://192.168.1.100:3001/api';

export function setServerUrl(url) {
  BASE_URL = url.replace(/\/+$/, '') + '/api';
}

export function getServerUrl() {
  return BASE_URL.replace('/api', '');
}

async function request(path, options = {}) {
  const token = await SecureStore.getItemAsync('token');
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    await SecureStore.deleteItemAsync('token');
    throw new Error('SESSION_EXPIRED');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

import { useState, useEffect } from 'react';
import { api } from '../api';

const DEFAULT_LOCATIONS = ['Coventry', 'Rugby', 'Daventry', 'Banbury', 'Birmingham', 'Northampton'];

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [locations, setLocations] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([api.get('/settings'), api.get('/settings/locations')]).then(([s, l]) => {
      setSettings(s);
      setLocations(DEFAULT_LOCATIONS.map(loc => {
        const existing = l.find(x => x.location === loc);
        return { location: loc, enabled: existing ? !!existing.enabled : true };
      }));
    }).catch(() => {});
  }, []);

  const save = async () => {
    try {
      await api.put('/settings', settings);
      await api.put('/settings/locations', { locations });
      setMsg('Settings saved ✓');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.message); }
  };

  const toggleLoc = (i) => setLocations(l => l.map((x, j) => j === i ? { ...x, enabled: !x.enabled } : x));

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Settings</h1>

      {/* Auto-Apply */}
      <div className="card" style={{ marginBottom: 16, borderColor: settings.auto_apply_enabled ? 'var(--success)' : 'var(--border)' }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>⚡ Auto-Apply</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
          <input type="checkbox" checked={!!settings.auto_apply_enabled}
            onChange={e => setSettings(s => ({ ...s, auto_apply_enabled: e.target.checked }))}
            style={{ width: 'auto' }} />
          <span>Instantly apply when a matching part-time job is found</span>
        </label>
        <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          When enabled, the system applies immediately without waiting. Part-time filter always active. Full-time roles always blocked.
        </p>
      </div>

      {/* Monitoring */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Monitoring</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
          <input type="checkbox" checked={!!settings.monitoring_enabled}
            onChange={e => setSettings(s => ({ ...s, monitoring_enabled: e.target.checked }))}
            style={{ width: 'auto' }} />
          Enable job monitoring
        </label>
        <div>
          <label>Check interval (minutes, 5–60)</label>
          <input type="number" min={5} max={60} value={settings.check_interval_minutes || 5}
            onChange={e => setSettings(s => ({ ...s, check_interval_minutes: Number(e.target.value) }))}
            style={{ width: 120 }} />
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Lower = faster detection. 5 min recommended for competitive roles.</p>
        </div>
      </div>

      {/* Locations */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Monitored Locations</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {locations.map((loc, i) => (
            <label key={loc.location} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              padding: '8px 12px', background: loc.enabled ? 'var(--bg-input)' : 'transparent',
              borderRadius: 'var(--radius)', border: `1px solid ${loc.enabled ? 'var(--accent)' : 'var(--border)'}` }}>
              <input type="checkbox" checked={loc.enabled} onChange={() => toggleLoc(i)} style={{ width: 'auto' }} />
              📍 {loc.location}
            </label>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Notifications</h3>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Get notified when jobs are auto-applied or if an application fails.</p>
        {[
          { key: 'notify_email', label: '📧 Email' },
          { key: 'notify_telegram', label: '📱 Telegram' },
          { key: 'notify_browser', label: '🔔 Browser push' },
        ].map(n => (
          <label key={n.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 6 }}>
            <input type="checkbox" checked={!!settings[n.key]}
              onChange={e => setSettings(s => ({ ...s, [n.key]: e.target.checked }))}
              style={{ width: 'auto' }} />
            {n.label}
          </label>
        ))}
      </div>

      <button className="btn-primary" onClick={save}>Save Settings</button>
      {msg && <div className="toast">{msg}</div>}
    </div>
  );
}

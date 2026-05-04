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

  const Section = ({ title, color, children }) => (
    <div className="card" style={{ marginBottom: 16, borderTop: `3px solid ${color}` }}>
      <h3 style={{ fontSize: 16, marginBottom: 12, color }}>{title}</h3>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, marginBottom: 20, background: 'linear-gradient(135deg, #18ffff, #448aff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Settings</h1>

      <Section title="⚡ Auto-Apply" color="#00e676">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12, color: '#eeeeff', fontSize: 14 }}>
          <input type="checkbox" checked={!!settings.auto_apply_enabled}
            onChange={e => setSettings(s => ({ ...s, auto_apply_enabled: e.target.checked }))} style={{ width: 'auto', accentColor: '#00e676' }} />
          Instantly apply when a matching part-time job is found
        </label>
        <p style={{ fontSize: 12, color: '#9999cc' }}>Opens job page in Chrome immediately. Full-time roles always blocked.</p>
      </Section>

      <Section title="🔍 Monitoring" color="#ff9900">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12, color: '#eeeeff', fontSize: 14 }}>
          <input type="checkbox" checked={!!settings.monitoring_enabled}
            onChange={e => setSettings(s => ({ ...s, monitoring_enabled: e.target.checked }))} style={{ width: 'auto', accentColor: '#ff9900' }} />
          Enable job monitoring
        </label>
        <div>
          <label>Check interval (minutes, 5–60)</label>
          <input type="number" min={5} max={60} value={settings.check_interval_minutes || 5}
            onChange={e => setSettings(s => ({ ...s, check_interval_minutes: Number(e.target.value) }))} style={{ width: 120 }} />
          <p style={{ fontSize: 12, color: '#9999cc', marginTop: 4 }}>Lower = faster. 5 min recommended.</p>
        </div>
      </Section>

      <Section title="📍 Locations" color="#b388ff">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {locations.map((loc, i) => (
            <label key={loc.location} style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              padding: '10px 14px', background: loc.enabled ? '#1a1a35' : 'transparent',
              borderRadius: 10, border: `1px solid ${loc.enabled ? '#b388ff' : '#2d2d5e'}`,
              color: loc.enabled ? '#eeeeff' : '#9999cc', transition: 'all 0.2s'
            }}>
              <input type="checkbox" checked={loc.enabled} onChange={() => toggleLoc(i)} style={{ width: 'auto', accentColor: '#b388ff' }} />
              📍 {loc.location}
            </label>
          ))}
        </div>
      </Section>

      <Section title="🔔 Notifications" color="#18ffff">
        {[
          { key: 'notify_email', label: '📧 Email notifications' },
          { key: 'notify_telegram', label: '📱 Telegram notifications' },
          { key: 'notify_browser', label: '🔔 Browser push notifications' },
        ].map(n => (
          <label key={n.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8, color: '#eeeeff', fontSize: 14 }}>
            <input type="checkbox" checked={!!settings[n.key]}
              onChange={e => setSettings(s => ({ ...s, [n.key]: e.target.checked }))} style={{ width: 'auto', accentColor: '#18ffff' }} />
            {n.label}
          </label>
        ))}
      </Section>

      <button className="btn-primary" onClick={save} style={{ fontSize: 15, padding: '12px 30px' }}>💾 Save Settings</button>
      {msg && <div className="toast">{msg}</div>}
    </div>
  );
}

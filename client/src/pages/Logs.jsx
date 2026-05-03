import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings/logs').then(setLogs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const actionColors = {
    register: 'var(--blue)', login: 'var(--blue)',
    profile_updated: 'var(--accent)', profile_deleted: 'var(--danger)',
    settings_updated: 'var(--accent)',
    monitor_found: 'var(--success)',
    apply_initiated: 'var(--accent)', browser_opened: 'var(--blue)',
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Activity Logs</h1>
      {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading...</p> : logs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-dim)' }}>No activity yet.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 500 }}>Time</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 500 }}>Action</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 500 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 14px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 14px' }}>
                    <span style={{ color: actionColors[log.action] || 'var(--text)', fontWeight: 500 }}>{log.action}</span>
                  </td>
                  <td style={{ padding: '8px 14px', color: 'var(--text-dim)' }}>{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

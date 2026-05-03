import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, new: 0, applied: 0, failed: 0, today: 0 });
  const [settings, setSettings] = useState({});
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const [s, st, j] = await Promise.all([api.get('/jobs/stats'), api.get('/settings'), api.get('/jobs?limit=8')]);
      setStats(s); setSettings(st); setRecentJobs(j.jobs || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleMonitoring = async () => {
    await api.put('/settings', { ...settings, monitoring_enabled: !settings.monitoring_enabled });
    load();
  };

  const openLoginSession = async () => {
    setMsg('Opening browser for Amazon login...');
    try {
      await api.post('/automation/login-session');
      setMsg('Browser opened — log in to Amazon, then close this message. Auto-apply will use that session.');
    } catch (err) { setMsg(`Error: ${err.message}`); }
  };

  if (loading) return <p style={{ color: 'var(--text-dim)' }}>Loading...</p>;

  const statCards = [
    { label: 'Total Jobs', value: stats.total, color: 'var(--blue)' },
    { label: 'Auto-Applied', value: stats.applied, color: 'var(--success)' },
    { label: 'Failed', value: stats.failed, color: 'var(--danger)' },
    { label: 'Today', value: stats.today, color: '#a78bfa' },
  ];

  const statusColor = { 'applied': 'var(--success)', 'auto-applying': 'var(--accent)', 'apply_failed': 'var(--danger)', 'new': 'var(--blue)', 'dismissed': 'var(--text-dim)' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary btn-sm" onClick={openLoginSession}>🔑 Setup Amazon Login</button>
          <button className={settings.monitoring_enabled ? 'btn-danger' : 'btn-primary'} onClick={toggleMonitoring}>
            {settings.monitoring_enabled ? '⏸ Stop' : '▶ Start Auto-Apply'}
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%',
          background: settings.monitoring_enabled ? 'var(--success)' : 'var(--danger)',
          animation: settings.monitoring_enabled ? 'pulse 2s infinite' : 'none'
        }} />
        <div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {settings.monitoring_enabled ? '⚡ AUTO-APPLY ACTIVE' : 'PAUSED'}
          </span>
          {settings.monitoring_enabled && (
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 8 }}>
              Checking every {settings.check_interval_minutes || 5} min · Part-time only · {settings.auto_apply_enabled ? 'Instant apply' : 'Notify only'}
            </span>
          )}
        </div>
        <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {statCards.map(s => (
          <div className="card" key={s.label} style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent jobs */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16 }}>Recent Jobs</h3>
          <Link to="/jobs" style={{ fontSize: 13 }}>View all →</Link>
        </div>
        {recentJobs.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>No jobs yet. Start monitoring to auto-apply to part-time roles.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentJobs.map(job => (
              <Link to={`/jobs/${job.id}`} key={job.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius)',
                  textDecoration: 'none', color: 'var(--text)', borderLeft: `3px solid ${statusColor[job.status] || 'var(--border)'}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{job.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>📍 {job.location}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge badge-${job.already_applied ? 'applied' : job.status === 'apply_failed' ? 'new' : job.status}`}>
                    {job.already_applied ? '✅ Applied' : job.status === 'apply_failed' ? '❌ Failed' : job.status}
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{new Date(job.detected_at).toLocaleString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {msg && <div className="toast" onClick={() => setMsg('')} style={{ cursor: 'pointer' }}>{msg} <span style={{ fontSize: 11 }}>✕</span></div>}
    </div>
  );
}

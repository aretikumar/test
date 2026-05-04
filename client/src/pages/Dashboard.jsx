import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, applied: 0, failed: 0, today: 0 });
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
    setMsg('Opening Chrome for Amazon login...');
    try {
      const res = await api.post('/automation/login-session');
      setMsg(res.message);
    } catch (err) { setMsg(`Error: ${err.message}`); }
  };

  if (loading) return <p style={{ color: '#9999cc' }}>Loading...</p>;

  const statCards = [
    { label: 'Total Jobs', value: stats.total, gradient: 'linear-gradient(135deg, #448aff, #7c4dff)', shadow: 'rgba(68,138,255,0.3)' },
    { label: 'Auto-Applied', value: stats.applied, gradient: 'linear-gradient(135deg, #00e676, #00bfa5)', shadow: 'rgba(0,230,118,0.3)' },
    { label: 'Failed', value: stats.failed, gradient: 'linear-gradient(135deg, #ff4466, #d32f2f)', shadow: 'rgba(255,68,102,0.3)' },
    { label: 'Today', value: stats.today, gradient: 'linear-gradient(135deg, #b388ff, #7c4dff)', shadow: 'rgba(179,136,255,0.3)' },
  ];

  const statusColor = { applied: '#00e676', opened: '#00e676', 'auto-applying': '#ff9900', apply_failed: '#ff4466', failed: '#ff4466', new: '#448aff', dismissed: '#666' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 24, background: 'linear-gradient(135deg, #ff9900, #ff5722)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary btn-sm" onClick={openLoginSession}>🔑 Amazon Login</button>
          <button className={settings.monitoring_enabled ? 'btn-danger' : 'btn-success'} onClick={toggleMonitoring}>
            {settings.monitoring_enabled ? '⏸ Stop' : '▶ Start Auto-Apply'}
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div style={{
        background: settings.monitoring_enabled ? 'linear-gradient(135deg, rgba(0,230,118,0.1), rgba(0,191,165,0.05))' : 'rgba(255,68,102,0.08)',
        border: `1px solid ${settings.monitoring_enabled ? '#00e67640' : '#ff446640'}`,
        borderRadius: 12, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12
      }}>
        <span style={{
          width: 12, height: 12, borderRadius: '50%',
          background: settings.monitoring_enabled ? '#00e676' : '#ff4466',
          boxShadow: settings.monitoring_enabled ? '0 0 12px #00e676' : '0 0 12px #ff4466',
          animation: settings.monitoring_enabled ? 'pulse 2s infinite' : 'none'
        }} />
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: settings.monitoring_enabled ? '#00e676' : '#ff4466' }}>
            {settings.monitoring_enabled ? '⚡ AUTO-APPLY ACTIVE' : '⏸ PAUSED'}
          </span>
          {settings.monitoring_enabled && (
            <span style={{ fontSize: 12, color: '#9999cc', marginLeft: 10 }}>
              Every {settings.check_interval_minutes || 5} min · Part-time only
            </span>
          )}
        </div>
        <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: '#121228', borderRadius: 14, padding: 18, textAlign: 'center',
            border: '1px solid #2d2d5e', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.gradient }} />
            <div style={{ fontSize: 32, fontWeight: 800, background: s.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#9999cc', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent jobs */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 17, color: '#eeeeff' }}>Recent Jobs</h3>
          <Link to="/jobs" style={{ fontSize: 13, color: '#18ffff' }}>View all →</Link>
        </div>
        {recentJobs.length === 0 ? (
          <p style={{ color: '#9999cc', fontSize: 14, textAlign: 'center', padding: 30 }}>No jobs yet. Start monitoring to auto-apply.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentJobs.map(job => (
              <Link to={`/jobs/${job.id}`} key={job.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', background: '#1a1a35', borderRadius: 10,
                  textDecoration: 'none', color: '#eeeeff',
                  borderLeft: `3px solid ${statusColor[job.status] || '#2d2d5e'}`,
                  transition: 'all 0.2s'
                }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{job.title}</div>
                  <div style={{ fontSize: 12, color: '#9999cc' }}>📍 {job.location}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge badge-${job.status}`}>
                    {job.already_applied ? '✅ Applied' : job.status === 'apply_failed' || job.status === 'failed' ? '❌ Failed' : job.status}
                  </span>
                  <div style={{ fontSize: 11, color: '#9999cc', marginTop: 3 }}>{new Date(job.detected_at).toLocaleString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {msg && <div className="toast" onClick={() => setMsg('')} style={{ cursor: 'pointer' }}>{msg} <span style={{ fontSize: 11, marginLeft: 8 }}>✕</span></div>}
    </div>
  );
}

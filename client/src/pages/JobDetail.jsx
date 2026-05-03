import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function JobDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [job, setJob] = useState(null);
  const [msg, setMsg] = useState('');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => { api.get(`/jobs/${id}`).then(setJob).catch(() => nav('/jobs')); }, [id]);

  if (!job) return <p style={{ color: 'var(--text-dim)' }}>Loading...</p>;

  const isFullTime = job.job_type?.toLowerCase().includes('full-time');

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await api.post(`/jobs/${id}/retry`);
      setJob({ ...job, status: 'applied', already_applied: 1 });
      setMsg('✅ Applied successfully!');
    } catch (err) { setMsg(`❌ ${err.message}`); }
    finally { setRetrying(false); }
  };

  const handleDismiss = async () => {
    await api.post(`/jobs/${id}/dismiss`);
    setJob({ ...job, status: 'dismissed' });
  };

  const statusBanner = {
    'applied': { bg: 'rgba(34,197,94,0.1)', border: 'var(--success)', icon: '✅', text: 'Auto-applied successfully' },
    'auto-applying': { bg: 'rgba(255,153,0,0.1)', border: 'var(--accent)', icon: '⚡', text: 'Auto-applying...' },
    'apply_failed': { bg: 'rgba(239,68,68,0.1)', border: 'var(--danger)', icon: '❌', text: 'Auto-apply failed — you can retry below' },
    'dismissed': { bg: 'rgba(100,100,100,0.1)', border: 'var(--border)', icon: '🚫', text: 'Dismissed' },
    'new': { bg: 'rgba(59,130,246,0.1)', border: 'var(--blue)', icon: '🆕', text: 'Detected — waiting for auto-apply' },
  };
  const banner = statusBanner[job.status] || statusBanner['new'];

  return (
    <div style={{ maxWidth: 700 }}>
      <button className="btn-secondary btn-sm" onClick={() => nav('/jobs')} style={{ marginBottom: 16 }}>← Back</button>

      {/* Status banner */}
      <div style={{ background: banner.bg, border: `1px solid ${banner.border}`, borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>
        {banner.icon} <strong>{banner.text}</strong>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>{job.title}</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, marginBottom: 16 }}>
          <div><span style={{ color: 'var(--text-dim)' }}>📍 Location:</span> {job.location}</div>
          <div><span style={{ color: 'var(--text-dim)' }}>⏰ Type:</span> <span className="badge badge-part-time">{job.job_type || 'Part-Time'}</span></div>
          <div><span style={{ color: 'var(--text-dim)' }}>🔄 Shift:</span> {job.shift || 'Not specified'}</div>
          <div><span style={{ color: 'var(--text-dim)' }}>📅 Detected:</span> {new Date(job.detected_at).toLocaleString()}</div>
        </div>
        {job.description && <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 16 }}>{job.description}</p>}
        {job.job_url && <a href={job.job_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>🔗 View on Amazon Jobs →</a>}
      </div>

      {/* Full-time block */}
      {isFullTime && (
        <div className="card" style={{ borderColor: 'var(--danger)', marginBottom: 16 }}>
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>⚠️ Full-time role — blocked to protect student work restrictions.</p>
        </div>
      )}

      {/* Retry for failed applications */}
      {job.status === 'apply_failed' && !isFullTime && (
        <div className="card" style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={handleRetry} disabled={retrying}>
            {retrying ? 'Retrying...' : '🔄 Retry Auto-Apply'}
          </button>
          <button className="btn-secondary" onClick={handleDismiss}>Dismiss</button>
        </div>
      )}

      {/* Dismiss new jobs that weren't auto-applied */}
      {job.status === 'new' && !isFullTime && (
        <div className="card">
          <button className="btn-secondary" onClick={handleDismiss}>Dismiss</button>
        </div>
      )}

      {msg && <div className="toast" onClick={() => setMsg('')} style={{ cursor: 'pointer' }}>{msg}</div>}
    </div>
  );
}

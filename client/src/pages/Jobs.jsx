import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [locFilter, setLocFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      if (locFilter) params.set('location', locFilter);
      const data = await api.get(`/jobs?${params}`);
      setJobs(data.jobs || []); setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter, locFilter]);

  const LOCS = ['Coventry', 'Rugby', 'Daventry', 'Banbury', 'Birmingham', 'Northampton'];
  const statusColor = { applied: '#00e676', opened: '#00e676', 'auto-applying': '#ff9900', apply_failed: '#ff4466', failed: '#ff4466', new: '#448aff', dismissed: '#666' };

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16, background: 'linear-gradient(135deg, #448aff, #7c4dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Detected Jobs <span style={{ fontSize: 14, color: '#9999cc' }}>({total})</span>
      </h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="applied">Applied</option>
          <option value="apply_failed">Failed</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select value={locFilter} onChange={e => setLocFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All locations</option>
          {LOCS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {loading ? <p style={{ color: '#9999cc' }}>Loading...</p> : jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: '#9999cc', fontSize: 16 }}>🔍 No jobs found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {jobs.map(job => (
            <Link to={`/jobs/${job.id}`} key={job.id} className="card"
              style={{
                textDecoration: 'none', color: '#eeeeff', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '14px 18px',
                borderLeft: `3px solid ${statusColor[job.status] || '#2d2d5e'}`
              }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{job.title}</div>
                <div style={{ fontSize: 13, color: '#9999cc' }}>📍 {job.location} · ⏰ {job.job_type} {job.shift && `· ${job.shift}`}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span className={`badge badge-${job.status}`}>{job.status}</span>
                {job.already_applied && <span className="badge badge-applied" style={{ marginLeft: 6 }}>✅</span>}
                <div style={{ fontSize: 11, color: '#9999cc', marginTop: 6 }}>{new Date(job.detected_at).toLocaleString()}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

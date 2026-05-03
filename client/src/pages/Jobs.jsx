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
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter, locFilter]);

  const LOCATIONS = ['Coventry', 'Rugby', 'Daventry', 'Banbury', 'Birmingham', 'Northampton'];

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Detected Jobs <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>({total})</span></h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="applying">Applying</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select value={locFilter} onChange={e => setLocFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All locations</option>
          {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading...</p> : jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-dim)' }}>No jobs found. Make sure monitoring is active.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {jobs.map(job => (
            <Link to={`/jobs/${job.id}`} key={job.id} className="card"
              style={{ textDecoration: 'none', color: 'var(--text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{job.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                  📍 {job.location} &nbsp;·&nbsp; ⏰ {job.job_type} {job.shift && `· ${job.shift}`}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span className={`badge badge-${job.status}`}>{job.status}</span>
                {job.already_applied ? <span className="badge badge-applied" style={{ marginLeft: 6 }}>Applied</span> : null}
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>{new Date(job.detected_at).toLocaleString()}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function History() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings/applications').then(setApps).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Application History</h1>
      {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading...</p> : apps.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-dim)' }}>No applications yet. Find a job and apply!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {apps.map(a => (
            <div className="card" key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
              <div>
                <Link to={`/jobs/${a.job_id}`} style={{ fontWeight: 600, fontSize: 15 }}>{a.title}</Link>
                <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
                  📍 {a.location} · {a.job_type}
                </div>
                {a.notes && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{a.notes}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span className={`badge ${a.status === 'pending' ? 'badge-new' : a.status === 'browser_opened' ? 'badge-part-time' : 'badge-applied'}`}>
                  {a.status}
                </span>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>{new Date(a.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

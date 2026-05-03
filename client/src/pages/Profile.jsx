import { useState, useEffect } from 'react';
import { api } from '../api';

const FIELDS = [
  { key: 'full_name', label: 'Full Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'address', label: 'Address', type: 'text' },
  { key: 'work_eligibility', label: 'Work Eligibility', type: 'text', placeholder: 'e.g. Student visa – 20hrs/week' },
  { key: 'student_availability', label: 'Availability', type: 'text', placeholder: 'e.g. Evenings & weekends' },
  { key: 'preferred_shifts', label: 'Preferred Shifts', type: 'text', placeholder: 'e.g. Evening, Night, Weekend' },
  { key: 'amazon_email', label: 'Amazon Account Email', type: 'email' },
];

export default function Profile() {
  const [form, setForm] = useState({});
  const [coverNote, setCoverNote] = useState('');
  const [msg, setMsg] = useState('');
  const [cvFile, setCvFile] = useState(null);

  useEffect(() => {
    api.get('/profile').then(p => {
      if (p) { setForm(p); setCoverNote(p.cover_note || ''); }
    }).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put('/profile', { ...form, cover_note: coverNote });
      setMsg('Profile saved ✓');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.message); }
  };

  const uploadCv = async () => {
    if (!cvFile) return;
    const fd = new FormData();
    fd.append('cv', cvFile);
    try {
      const res = await api.upload('/profile/cv', fd);
      setForm(f => ({ ...f, cv_path: res.filename }));
      setMsg('CV uploaded ✓');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.message); }
  };

  const deleteProfile = async () => {
    if (!confirm('Delete all profile data?')) return;
    await api.delete('/profile');
    setForm({});
    setCoverNote('');
    setMsg('Profile deleted');
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Candidate Profile</h1>
      <form onSubmit={save}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gap: 14 }}>
            {FIELDS.map(f => (
              <div key={f.key}>
                <label>{f.label}</label>
                <input type={f.type} value={form[f.key] || ''} placeholder={f.placeholder || ''}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label>Cover Note</label>
              <textarea value={coverNote} onChange={e => setCoverNote(e.target.value)} placeholder="Optional cover note for applications" />
            </div>
          </div>
        </div>

        {/* CV Upload */}
        <div className="card" style={{ marginBottom: 16 }}>
          <label>CV / Resume (PDF, DOC)</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
            <input type="file" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files[0])} style={{ flex: 1 }} />
            <button type="button" className="btn-secondary btn-sm" onClick={uploadCv} disabled={!cvFile}>Upload</button>
          </div>
          {form.cv_path && <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 6 }}>📎 {form.cv_path}</p>}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" type="submit">Save Profile</button>
          <button className="btn-danger btn-sm" type="button" onClick={deleteProfile}>Delete Profile</button>
        </div>
      </form>
      {msg && <div className="toast">{msg}</div>}
    </div>
  );
}

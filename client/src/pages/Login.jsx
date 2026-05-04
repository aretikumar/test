import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post(isRegister ? '/auth/register' : '/auth/login', { email, password });
      login(data.token);
      nav('/');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20, background: 'linear-gradient(135deg, #0a0a1a 0%, #121240 50%, #0d0d25 100%)' }}>
      <div style={{
        width: '100%', maxWidth: 420, background: '#121228', borderRadius: 16,
        border: '1px solid #2d2d5e', padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏭</div>
          <h1 style={{ fontSize: 26, margin: 0, background: 'linear-gradient(135deg, #ff9900, #ff5722)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Amazon Job Monitor
          </h1>
          <p style={{ color: '#9999cc', fontSize: 13, marginTop: 6 }}>UK Warehouse · Part-Time Auto-Apply</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          </div>
          {error && <p style={{ color: '#ff4466', fontSize: 13, marginBottom: 14, padding: '8px 12px', background: 'rgba(255,68,102,0.1)', borderRadius: 8 }}>⚠️ {error}</p>}
          <button className="btn-primary" style={{ width: '100%', padding: 12, fontSize: 16 }} disabled={loading}>
            {loading ? '...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#9999cc' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{ background: 'none', color: '#18ffff', padding: 0, fontSize: 13, border: 'none', cursor: 'pointer' }}>
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}

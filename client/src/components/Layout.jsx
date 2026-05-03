import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const NAV = [
  { to: '/', label: '📊 Dashboard' },
  { to: '/jobs', label: '💼 Jobs' },
  { to: '/profile', label: '👤 Profile' },
  { to: '/settings', label: '⚙️ Settings' },
  { to: '/history', label: '📋 Applications' },
  { to: '/logs', label: '📝 Activity Logs' },
];

export default function Layout() {
  const { logout } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{
        width: 220, background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
        padding: '20px 0', display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, color: 'var(--accent)', margin: 0 }}>🏭 Job Monitor</h2>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Amazon UK · Part-Time</span>
        </div>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}
            style={({ isActive }) => ({
              display: 'block', padding: '10px 20px', fontSize: 14,
              color: isActive ? 'var(--accent)' : 'var(--text-dim)',
              background: isActive ? 'var(--bg-input)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              textDecoration: 'none', transition: 'all 0.2s'
            })}
          >{n.label}</NavLink>
        ))}
        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <button className="btn-secondary" style={{ width: '100%' }} onClick={logout}>Logout</button>
        </div>
      </nav>
      <main style={{ flex: 1, padding: 24, overflowY: 'auto', maxHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}

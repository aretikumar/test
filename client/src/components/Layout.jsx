import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const NAV = [
  { to: '/', label: '📊 Dashboard', color: '#ff9900' },
  { to: '/jobs', label: '💼 Jobs', color: '#448aff' },
  { to: '/profile', label: '👤 Profile', color: '#b388ff' },
  { to: '/settings', label: '⚙️ Settings', color: '#18ffff' },
  { to: '/history', label: '📋 Applications', color: '#00e676' },
  { to: '/logs', label: '📝 Activity', color: '#ff80ab' },
];

export default function Layout() {
  const { logout } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{
        width: 230, background: 'linear-gradient(180deg, #0d0d25 0%, #121240 100%)',
        borderRight: '1px solid #2d2d5e', padding: '20px 0', display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #2d2d5e', marginBottom: 8 }}>
          <h2 style={{ fontSize: 18, margin: 0, background: 'linear-gradient(135deg, #ff9900, #ff5722)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🏭 Job Monitor
          </h2>
          <span style={{ fontSize: 11, color: '#9999cc' }}>Amazon UK · Part-Time Auto-Apply</span>
        </div>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', padding: '11px 20px', fontSize: 14,
              color: isActive ? n.color : '#9999cc',
              background: isActive ? `${n.color}15` : 'transparent',
              borderLeft: isActive ? `3px solid ${n.color}` : '3px solid transparent',
              textDecoration: 'none', transition: 'all 0.2s',
            })}
          >{n.label}</NavLink>
        ))}
        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <button className="btn-secondary" style={{ width: '100%' }} onClick={logout}>🚪 Logout</button>
        </div>
      </nav>
      <main style={{ flex: 1, padding: 28, overflowY: 'auto', maxHeight: '100vh', background: '#0a0a1a' }}>
        <Outlet />
      </main>
    </div>
  );
}

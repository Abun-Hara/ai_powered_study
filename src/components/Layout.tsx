import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/courses', label: 'Courses' },
  { to: '/notes', label: 'Notes + AI' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/analytics', label: 'Analytics' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Study Planner</h1>
        <p className="muted">AI Smart Academic Assistant</p>
        <nav>
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={location.pathname === item.to ? 'nav-link active' : 'nav-link'}
            >
              {item.label}
            </Link>
          ))}
          {user?.role === 'admin' ? (
            <Link
              to="/admin"
              className={location.pathname === '/admin' ? 'nav-link active' : 'nav-link'}
            >
              Admin
            </Link>
          ) : null}
        </nav>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <div>
            <strong>{user?.name}</strong>
            <p className="muted">{user?.email}</p>
          </div>
          <div className="topbar-actions">
            <ThemeToggle />
            <button className="btn" onClick={logout}>
              Logout
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


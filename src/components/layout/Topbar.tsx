import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../shared/ThemeToggle';
import Button from '../ui/Button';
import { fetchPlatformSettings, fetchSupportTickets, fetchUserTickets } from '../../features/admin/interactionsApi';

interface TopbarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onToggleMobile: () => void;
}

export default function Topbar({ collapsed, onToggleCollapsed, onToggleMobile }: TopbarProps) {
  const { user, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);
  const ticketsQuery = useQuery({
    queryKey: user?.role === 'admin' ? ['admin-support-tickets'] : ['my-support-tickets', user?.email],
    queryFn: () => (user?.role === 'admin' ? fetchSupportTickets() : fetchUserTickets(user?.email ?? '')),
    enabled: Boolean(user?.email),
  });
  const settingsQuery = useQuery({ queryKey: ['platform-settings'], queryFn: fetchPlatformSettings });
  const notificationCount =
    (user?.role === 'admin'
      ? (ticketsQuery.data ?? []).filter((t) => t.status !== 'resolved').length
      : (ticketsQuery.data ?? []).filter((t) => t.status !== 'resolved').length + (settingsQuery.data?.announcement ? 1 : 0));

  return (
    <header className="topbar-modern">
      <div className="row gap-sm">
        <Button variant="ghost" className="mobile-only" onClick={onToggleMobile}>
          <span className="icon-label">
            <i className="fa-solid fa-bars" aria-hidden="true" />
            Menu
          </span>
        </Button>
        <Button variant="secondary" className="desktop-only" onClick={onToggleCollapsed}>
          <span className="icon-label">
            <i className={collapsed ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left'} aria-hidden="true" />
            {collapsed ? 'Expand' : 'Collapse'}
          </span>
        </Button>
      </div>

      <div className="row gap-sm">
        <Button variant="ghost" aria-label="Notifications">
          <span className="icon-label">
            <i className="fa-solid fa-bell" aria-hidden="true" />
            Notifications ({notificationCount})
          </span>
        </Button>
        <ThemeToggle />

        <div className="avatar-wrap">
          <button className="avatar-btn" onClick={() => setOpenMenu((p) => !p)}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name || 'User'} className="avatar-img" />
            ) : (
              user?.name?.slice(0, 1).toUpperCase() || 'U'
            )}
          </button>
          {user?.role ? (
            <span className={`role-badge ${user.role === 'admin' ? 'admin' : 'student'}`}>
              {user.role.toUpperCase()}
            </span>
          ) : null}
          {openMenu ? (
            <div className="dropdown card">
              <p><strong>{user?.name}</strong></p>
              {user?.username ? <p className="muted">@{user.username}</p> : null}
              <p className="muted">{user?.email}</p>
              <Button variant="danger" onClick={logout}>
                <span className="icon-label">
                  <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
                  Logout
                </span>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

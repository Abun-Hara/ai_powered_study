import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
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
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const ticketsQuery = useQuery({
    queryKey: user?.role === 'admin' ? ['admin-support-tickets'] : ['my-support-tickets', user?.email],
    queryFn: () => (user?.role === 'admin' ? fetchSupportTickets() : fetchUserTickets(user?.email ?? '')),
    enabled: Boolean(user?.email),
    refetchInterval: 4000,
    refetchOnWindowFocus: true,
  });
  const settingsQuery = useQuery({ queryKey: ['platform-settings'], queryFn: fetchPlatformSettings });
  const notificationCount =
    (user?.role === 'admin'
      ? (ticketsQuery.data ?? []).filter((t) => t.unreadByAdmin).length
      : (ticketsQuery.data ?? []).filter((t) => t.unreadByUser).length + (settingsQuery.data?.announcement ? 1 : 0));

  useEffect(() => {
    if (!openMenu) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      const target = event.target as Node;
      if (!menuRef.current.contains(target)) {
        setOpenMenu(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [openMenu]);

  useEffect(() => {
    if (!user?.email) return;

    const ticketKey = user.role === 'admin' ? ['admin-support-tickets'] : ['my-support-tickets', user.email];
    const channel = supabase
      .channel(`topbar-realtime-${user.email}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_threads' }, () => {
        queryClient.invalidateQueries({ queryKey: ticketKey });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ticketKey });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, user?.email, user?.role]);

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
        <Button variant="ghost" aria-label="Notifications" onClick={() => navigate(user?.role === 'admin' ? '/admin/reports' : '/notifications')}>
          <span className="icon-label">
            <i className="fa-solid fa-bell" aria-hidden="true" />
            Notifications ({notificationCount})
          </span>
        </Button>
        <ThemeToggle />

        <div className="avatar-wrap" ref={menuRef}>
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

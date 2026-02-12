import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleCapabilities } from '../../features/auth/permissions';
import { cn } from '../../utils/cn';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge-high', key: 'dashboard' },
  { to: '/courses', label: 'Courses', icon: 'fa-solid fa-book-open', key: 'courses' },
  { to: '/schedule', label: 'Schedule', icon: 'fa-solid fa-calendar-days', key: 'schedule' },
  { to: '/ai', label: 'AI Notes', icon: 'fa-solid fa-robot', key: 'ai' },
  { to: '/analytics', label: 'Analytics', icon: 'fa-solid fa-chart-simple', key: 'analytics' },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { user } = useAuth();
  const caps = getRoleCapabilities(user?.role ?? 'student');
  const visibleLinks = links.filter((link) => {
    if (link.key === 'courses') return caps.canManageOwnCourses;
    if (link.key === 'schedule') return caps.canManageStudyPlanner;
    if (link.key === 'ai') return caps.canUseAI;
    if (link.key === 'analytics') return caps.canViewPersonalAnalytics;
    return true;
  });

  return (
    <aside className={cn('sidebar-modern', collapsed ? 'collapsed' : '', mobileOpen ? 'mobile-open' : '')}>
      <div className="sidebar-head">
        <h2>{collapsed ? 'SP' : 'Study Planner'}</h2>
        {!collapsed ? <p className="muted">Smart Academic Assistant</p> : null}
      </div>

      <nav className="stack-sm">
        {visibleLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onCloseMobile}
            className={({ isActive }) => cn('nav-modern', isActive ? 'active' : '')}
          >
            <span className="icon-label">
              <i className={link.icon} aria-hidden="true" />
              {!collapsed ? link.label : null}
            </span>
          </NavLink>
        ))}
        {caps.canAccessAdminDashboard ? (
          <NavLink
            to="/admin"
            onClick={onCloseMobile}
            className={({ isActive }) => cn('nav-modern', isActive ? 'active' : '')}
          >
            <span className="icon-label">
              <i className="fa-solid fa-user-shield" aria-hidden="true" />
              {!collapsed ? 'Admin' : null}
            </span>
          </NavLink>
        ) : null}
      </nav>
    </aside>
  );
}

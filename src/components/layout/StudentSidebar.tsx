import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge-high' },
  { to: '/courses', label: 'Courses', icon: 'fa-solid fa-book-open' },
  { to: '/schedule', label: 'Schedule', icon: 'fa-solid fa-calendar-days' },
  { to: '/ai', label: 'AI Notes', icon: 'fa-solid fa-robot' },
  { to: '/analytics', label: 'Analytics', icon: 'fa-solid fa-chart-simple' },
  { to: '/profile', label: 'Profile', icon: 'fa-solid fa-user' },
];

interface Props {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function StudentSidebar({ collapsed, mobileOpen, onCloseMobile }: Props) {
  return (
    <aside className={cn('sidebar-modern', collapsed ? 'collapsed' : '', mobileOpen ? 'mobile-open' : '')}>
      <div className="sidebar-head">
        <h2>{collapsed ? 'SP' : 'Study Planner'}</h2>
        {!collapsed ? <p className="muted">Student Workspace</p> : null}
      </div>

      <nav className="stack-sm">
        {links.map((link) => (
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
      </nav>
    </aside>
  );
}
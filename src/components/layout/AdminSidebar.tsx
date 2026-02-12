import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';

const links = [
  { to: '/admin', label: 'Dashboard', icon: 'fa-solid fa-shield-halved' },
  { to: '/admin/users', label: 'Users', icon: 'fa-solid fa-users' },
  { to: '/admin/system-analytics', label: 'System Analytics', icon: 'fa-solid fa-chart-line' },
  { to: '/admin/ai-control', label: 'AI Control', icon: 'fa-solid fa-sliders' },
  { to: '/admin/settings', label: 'Settings', icon: 'fa-solid fa-gear' },
  { to: '/admin/reports', label: 'Reports', icon: 'fa-solid fa-file-lines' },
];

interface Props {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function AdminSidebar({ collapsed, mobileOpen, onCloseMobile }: Props) {
  return (
    <aside className={cn('sidebar-modern admin-sidebar', collapsed ? 'collapsed' : '', mobileOpen ? 'mobile-open' : '')}>
      <div className="sidebar-head">
        <h2>{collapsed ? 'AC' : 'Admin Console'}</h2>
        {!collapsed ? <p className="muted">Platform Operations</p> : null}
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
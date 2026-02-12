import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppFooter from '../shared/AppFooter';
import AdminSidebar from './AdminSidebar';
import Topbar from './Topbar';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="shell">
      <AdminSidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="main">
        <Topbar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((prev) => !prev)} onToggleMobile={() => setMobileOpen((prev) => !prev)} />
        <main className="page-content">
          <Outlet />
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
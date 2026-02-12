import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import StudentLayout from '../components/layout/StudentLayout';
import ProtectedRoute from '../components/shared/ProtectedRoute';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

const AdminDashboardPage = lazy(() => import('../features/admin/AdminPage'));
const UsersPage = lazy(() => import('../features/admin/pages/UsersPage'));
const SystemAnalyticsPage = lazy(() => import('../features/admin/pages/SystemAnalyticsPage'));
const AIControlPage = lazy(() => import('../features/admin/pages/AIControlPage'));
const SettingsPage = lazy(() => import('../features/admin/pages/SettingsPage'));
const ReportsPage = lazy(() => import('../features/admin/pages/ReportsPage'));

const AnalyticsPage = lazy(() => import('../features/analytics/AnalyticsPage'));
const CoursesPage = lazy(() => import('../features/courses/CoursesPage'));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const AINotesPage = lazy(() => import('../features/ai/AINotesPage'));
const ProfilePage = lazy(() => import('../features/profile/ProfilePage'));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage'));
const SchedulePage = lazy(() => import('../features/schedule/SchedulePage'));

function RouteFallback() {
  return (
    <div className="page-content">
      <Card className="stack">
        <h3>Loading...</h3>
        <p className="muted">Preparing page module.</p>
      </Card>
    </div>
  );
}

export default function AppRouter() {
  const { isAuthenticated, user } = useAuth();
  const home = user?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to={home} replace /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to={home} replace /> : <RegisterPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute role="student">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="ai" element={<AINotesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="system-analytics" element={<SystemAnalyticsPage />} />
          <Route path="ai-control" element={<AIControlPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? home : '/login'} replace />} />
      </Routes>
    </Suspense>
  );
}
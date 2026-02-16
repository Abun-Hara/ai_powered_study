import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: JSX.Element;
  role?: UserRole;
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { isAuthenticated, hasRole, user, isInitializing } = useAuth();

  if (isInitializing) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && !hasRole(role)) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
}


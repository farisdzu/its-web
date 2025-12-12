import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'user')[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const correctPath = getDashboardPath(user.role);
    return <Navigate to={correctPath} replace />;
  }

  return <>{children}</>;
}

export function getDashboardPath(role: 'admin' | 'user'): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'user':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}


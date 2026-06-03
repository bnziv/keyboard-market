import { useAuth } from '@/utils/AuthProvider';
import { Navigate, Outlet } from 'react-router-dom';

const ADMIN_USER_ID = import.meta.env.VITE_ADMIN_USER_ID;

const AdminRoute = () => {
  const { isAuthenticated, authLoading, user } = useAuth();

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated || user?.id !== ADMIN_USER_ID) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;

import { useAuth } from '@/utils/AuthProvider';
import { Navigate, Outlet } from 'react-router-dom';
import LoadingScreen from '@/components/LoadingScreen';

const ADMIN_USER_ID = import.meta.env.VITE_ADMIN_USER_ID;

const AdminRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || user?.id !== ADMIN_USER_ID) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;

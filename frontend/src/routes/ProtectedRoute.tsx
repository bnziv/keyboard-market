import { useAuth } from '@/utils/AuthProvider';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useToast } from '@/utils/ToastProvider';
import { useEffect, useRef } from 'react';

const ProtectedRoute = () => {
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation();
  const { showInfo } = useToast();
  const isMounted = useRef(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated && !isMounted.current) {
      showInfo('You must be logged in to access this page');
      isMounted.current = true;
    }
  }, [authLoading, isAuthenticated, showInfo]);

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

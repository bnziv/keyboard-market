import { useAuth } from '@/utils/AuthProvider';
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toastInfo } from '@/utils/Toast';

const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;

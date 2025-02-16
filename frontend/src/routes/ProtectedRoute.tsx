import { isAuthenticated } from '@/utils/auth';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toastInfo } from '@/utils/Toast';

const ProtectedRoute = () => {
    const [auth, setAuth] = useState<boolean | null>(null);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            const isAuth = await isAuthenticated();
            setAuth(isAuth);

            if (!isAuth) {
                toastInfo('You must be logged in to access this page');
            }
        }
        
        checkAuth();
    }, [location.pathname]);

    if (auth === null) {
        return <div>Loading...</div>;
    }

    return auth ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;

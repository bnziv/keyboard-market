import { useAuth } from '@/utils/AuthProvider'
import { useEffect, useRef } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useToast } from '@/utils/ToastProvider'

const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth()
    const { showInfo } = useToast()
    const hasShownToast = useRef(false) // To prevent double toast issue

    useEffect(() => {
        if (!isAuthenticated && !hasShownToast.current) {
            showInfo("You must be logged in to access this page.")
            hasShownToast.current = true
        }
    }, [])

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
};

export default ProtectedRoute;

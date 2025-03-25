import { useAuth } from '@/utils/AuthProvider'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useToast } from '@/utils/ToastProvider'
import { useEffect, useRef } from 'react'
import LoadingScreen from '@/components/LoadingScreen'

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuth()
    const location = useLocation()
    const { showInfo } = useToast()
    const isMounted = useRef(false)

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !isMounted.current) {
            showInfo("You must be logged in to access this page")
            isMounted.current = true
        }
    }, [isLoading, isAuthenticated, showInfo])

    if (isLoading) {
        return <LoadingScreen />
    }

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />
    }

    return <Outlet />
}

export default ProtectedRoute;

import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "@/utils/api"
import { useToast } from "@/utils/ToastProvider";
import LoadingScreen from "@/components/LoadingScreen";

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { showSuccess } = useToast()
  
  useEffect(() => {
    validateAuth()
  }, [])

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      res => res,
      (err: any) => {
        if (err.response?.status === 401 && !err.config?.url?.includes("/auth/login")) {
          setIsAuthenticated(false)
          setUser(null)
          navigate("/login")
        }
        return Promise.reject(err)
      }
    )
    return () => api.interceptors.response.eject(interceptor)
  }, [navigate])
  
  const validateAuth = async () => {
    try {
      const response = await api.get(`/api/auth/me`)
      setIsAuthenticated(true)
      setUser(response.data)
    } catch (error) {
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }
  
  const login = (userData: User) => {
    setIsAuthenticated(true)
    setUser(userData)
  }

  const logout = async () => {
    try {
      await api.post(`/api/auth/logout`)
    } finally {
      setIsAuthenticated(false)
      setUser(null)
      showSuccess("Logged out successfully")
      navigate("/")
    }
  }

  if (isLoading && !user && !isAuthenticated) {
    return <LoadingScreen />
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

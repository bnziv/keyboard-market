import { createContext, useContext, useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import axios from "axios"
import API_URL from "@/utils/config"

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [user, setUser] = useState<User | null>(null)
  
  useEffect(() => {
    validateAuth()
  }, [location.pathname])
  
  const validateAuth = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true })
      setIsAuthenticated(true)
      setUser(response.data)
    } catch (error) {
      setIsAuthenticated(false)
      setUser(null)
    }
  }
  
  const login = (userData: User) => {
    setIsAuthenticated(true)
    setUser(userData)
  }

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true })
    } finally {
      setIsAuthenticated(false)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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

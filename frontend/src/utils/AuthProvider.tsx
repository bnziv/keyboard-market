import { createContext, useContext, useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import axios from "axios"

interface AuthContextType {
  isAuthenticated: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  
  useEffect(() => {
    validateAuth()
  }, [location.pathname])
  
  const validateAuth = async () => {
    try {
      await axios.get("http://localhost:8080/api/auth/me", { withCredentials: true })
      setIsAuthenticated(true)
    } catch (error) {
      setIsAuthenticated(false)
    }
  }
  
  const login = () => {
    setIsAuthenticated(true)
  }

  const logout = async () => {
    try {
      await axios.post("http://localhost:8080/api/auth/logout", {}, { withCredentials: true })
    } finally {
      setIsAuthenticated(false)
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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

import { createContext, useContext, useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"

interface AuthContextType {
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  
  useEffect(() => {
    const token = localStorage.getItem("token")
    
    if (token && validateToken()) {
      setIsAuthenticated(true)
    } else {
      logout()
    }
  }, [location.pathname])
  
  const validateToken = (): boolean => {
    console.log("Validate token")
    const token = localStorage.getItem("token")
    if (!token) return false

    try {
      const decoded: any = jwtDecode(token)
      return decoded?.exp * 1000 > Date.now()
    } catch (error) {
      return false
    }
  }
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(validateToken)
  const login = (token: string) => {
    localStorage.setItem("token", token)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem("token")
    setIsAuthenticated(false)
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

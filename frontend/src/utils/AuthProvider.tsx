import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { jwtDecode } from "jwt-decode"

interface AuthContextType {
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("token")
    
    if (token) {
        validateToken()
    } else {
        setIsAuthenticated(false)
    }
  }, [location.pathname])

  const validateToken = () => {
    const token = localStorage.getItem("token")

    if (token) {
        const decoded: any = jwtDecode(token)
        if (decoded?.exp * 1000 < Date.now()) {
            logout()
        } else {
            setIsAuthenticated(true)
        }
    }
  }

  const login = (token: string) => {
    localStorage.setItem("token", token)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem("token")
    setIsAuthenticated(false)
    navigate("/login")
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

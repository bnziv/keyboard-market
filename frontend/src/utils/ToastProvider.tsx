import { toast } from "sonner"
import { createContext, useContext } from "react"

interface ToastContextType {
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  
  const showSuccess = (message: string) => {
    toast.success(message,
      { style: { background: "green", color: "white", border: "1px solid green", fontSize: "16px" } }
    )
  }

  const showError = (message: string) => {
    toast.error(message,
      { style: { background: "red", color: "white", border: "1px solid red", fontSize: "16px" } }
    )
  }

  const showInfo = (message: string) => {
    toast.info(message,
      { style: { background: "skyblue", color: "black", border: "1px solid skyblue", fontSize: "16px" } }
    )
  }

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

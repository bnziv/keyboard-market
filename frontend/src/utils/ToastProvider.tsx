import { toast } from "sonner"
import { createContext, useContext } from "react"

interface ToastContextType {
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const BASE: React.CSSProperties = {
  background: 'var(--km-surface)',
  border: '1px solid var(--km-line)',
  color: 'var(--km-ink)',
  fontFamily: 'var(--km-font-body)',
  fontSize: '14px',
  borderRadius: '4px',
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {

  const showSuccess = (message: string) => {
    toast.success(message, {
      style: { ...BASE, borderLeft: '2px solid var(--km-ok)' },
    })
  }

  const showError = (message: string) => {
    toast.error(message, {
      style: { ...BASE, borderLeft: '2px solid var(--km-error)' },
    })
  }

  const showInfo = (message: string) => {
    toast(message, {
      style: { ...BASE, borderLeft: '2px solid var(--km-gold)' },
    })
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

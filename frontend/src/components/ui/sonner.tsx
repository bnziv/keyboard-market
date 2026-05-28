import { Toaster as Sonner, ToasterProps } from "sonner"
import { useTheme } from "@/utils/ThemeProvider"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      toastOptions={{
        style: {
          background: 'var(--km-surface)',
          border: '1px solid var(--km-line)',
          color: 'var(--km-ink)',
          fontFamily: 'var(--km-font-mono)',
          fontSize: '12px',
          borderRadius: '4px',
          padding: '10px 14px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

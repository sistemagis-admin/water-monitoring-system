import React, { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void
  success: (title: string, message?: string, duration?: number) => void
  error: (title: string, message?: string, duration?: number) => void
  warning: (title: string, message?: string, duration?: number) => void
  info: (title: string, message?: string, duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 3500) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const newToast: ToastItem = { id, type, title, message, duration }

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]) // Keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const success = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast('success', title, message, duration),
    [showToast]
  )
  const error = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast('error', title, message, duration),
    [showToast]
  )
  const warning = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast('warning', title, message, duration),
    [showToast]
  )
  const info = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast('info', title, message, duration),
    [showToast]
  )

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, removeToast }}>
      {children}
      {createPortal(
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

const ToastCard: React.FC<{ toast: ToastItem; onClose: () => void }> = ({ toast, onClose }) => {
  const getIconAndStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          accent: 'border-emerald-500/30',
          bgAccent: 'bg-emerald-50',
          indicator: 'bg-emerald-500',
        }
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          accent: 'border-rose-500/30',
          bgAccent: 'bg-rose-50',
          indicator: 'bg-rose-500',
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          accent: 'border-amber-500/30',
          bgAccent: 'bg-amber-50',
          indicator: 'bg-amber-500',
        }
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-[#00799e] shrink-0" />,
          accent: 'border-[#00799e]/30',
          bgAccent: 'bg-[#00799e]/10',
          indicator: 'bg-[#00799e]',
        }
    }
  }

  const { icon, accent, bgAccent } = getIconAndStyle()

  return (
    <div
      className={`pointer-events-auto w-full bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl shadow-slate-900/10 border ${accent} flex items-start justify-between gap-3 animate-slide-in-right transition-all transform duration-200 hover:scale-[1.01]`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className={`p-2 rounded-xl ${bgAccent} shrink-0`}>{icon}</div>
        <div className="min-w-0 pt-0.5">
          <h4 className="font-heading font-semibold text-xs sm:text-sm text-slate-900 m-0 leading-tight">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-xs text-slate-500 m-0 mt-1 leading-relaxed font-normal">
              {toast.message}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
        aria-label="Tutup notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = { id, message, type }

    setToasts((prev) => [...prev, newToast])

    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id)
    }, type === 'error' || type === 'warning' ? 7000 : 3500)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  removeToast: (id: string) => void
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onClose: () => void
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  // 관리자 톤 — void 바탕 + 종류별 작은 사각 표시 (Paper 'Blog Admin')
  const marks: Record<ToastType, string> = {
    success: 'bg-paper',
    error: 'bg-[#C2553F]',
    warning: 'bg-amber',
    info: 'border border-paper/60',
  }

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className="flex max-w-[560px] items-center gap-3 bg-void px-4 py-3 text-paper shadow-[0_10px_30px_rgb(10_9_8/0.25)] animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <span className={`size-1.5 shrink-0 ${marks[toast.type]}`} aria-hidden />
      <p className="text-[13px] font-light leading-5">{toast.message}</p>
      <button onClick={onClose} className="ml-2 shrink-0 p-1 text-paper/50 transition-colors hover:text-paper" aria-label="닫기">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type ToastKind = 'success' | 'error'

interface ToastState {
  message: string
  kind: ToastKind
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION_MS = 2800

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setToast({ message, kind })
    timerRef.current = setTimeout(() => {
      setToast(null)
      timerRef.current = null
    }, DEFAULT_DURATION_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={[
            'fixed left-1/2 -translate-x-1/2 bottom-6 z-[100]',
            'px-4 py-3 rounded-2xl shadow-card',
            'text-sm sm:text-base font-medium',
            'max-w-[90vw] text-center',
            toast.kind === 'error'
              ? 'bg-alert/10 text-alert border border-alert/40'
              : 'bg-primary text-white',
          ].join(' ')}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

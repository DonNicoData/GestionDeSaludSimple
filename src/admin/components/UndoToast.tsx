/**
 * Provider de toast con acción (Undo).
 *
 * El `Toast` estándar solo soporta mensajes efímeros sin acción. Para
 * el patrón "undo 5s" del admin necesitamos un toast que tenga un
 * botón clickeable y un countdown visible.
 *
 * Decisión de diseño: un solo UndoToast a la vez. Si se dispara uno
 * nuevo mientras hay uno activo, el anterior se commitea (porque ya
 * pasó su ventana). Esto evita superposiciones confusas en la UI.
 *
 * No se commitea inmediatamente: en lugar de eso, el Provider expone
 * `showUndo({ message, onUndo, onCommit })`. Si el usuario NO hace
 * click en undo antes de los 5s, se llama `onCommit`. Si hace click,
 * se llama `onUndo` y se cancela el commit.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export const UNDO_WINDOW_MS = 5000

export interface UndoAction {
  message: string
  onUndo: () => void | Promise<void>
  onCommit?: () => void
}

export interface UndoToastContextValue {
  showUndo: (action: UndoAction) => void
}

const UndoToastContext = createContext<UndoToastContextValue | null>(null)

interface ActiveState extends UndoAction {
  /** Timestamp de cuándo se mostró. */
  startedAt: number
  /** Segundos restantes (entero, derivado del interval). */
  remainingSeconds: number
}

export function UndoToastProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveState | null>(null)
  const activeRef = useRef<ActiveState | null>(null)
  activeRef.current = active

  const cancelTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = useCallback(() => {
    if (cancelTimer.current) {
      clearInterval(cancelTimer.current)
      cancelTimer.current = null
    }
  }, [])

  useEffect(() => clear, [clear])

  const showUndo = useCallback(
    (action: UndoAction) => {
      clear()
      // Si hay un active previo, lo commiteamos ahora (no se puede
      // deshacer post-acción). Esto es una decisión conservadora: si
      // el usuario dispara otro undo, asumimos que el primero ya no
      // le importa.
      const prev = activeRef.current
      if (prev) {
        prev.onCommit?.()
      }
      const startedAt = Date.now()
      const state: ActiveState = { ...action, startedAt, remainingSeconds: 5 }
      setActive(state)
      cancelTimer.current = setInterval(() => {
        const elapsed = Date.now() - state.startedAt
        const remainingMs = Math.max(0, UNDO_WINDOW_MS - elapsed)
        const remainingSeconds = Math.ceil(remainingMs / 1000)
        setActive((cur) => (cur ? { ...cur, remainingSeconds } : cur))
        if (remainingMs === 0) {
          clear()
          setActive(null)
          state.onCommit?.()
        }
      }, 200)
    },
    [clear],
  )

  const handleUndo = useCallback(async () => {
    if (!activeRef.current) return
    const cur = activeRef.current
    clear()
    setActive(null)
    await cur.onUndo()
  }, [clear])

  return (
    <UndoToastContext.Provider value={{ showUndo }}>
      {children}
      {active && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[110] flex items-center gap-2 max-w-[92vw] px-4 py-3 rounded-2xl shadow-card bg-graphite text-bone animate-[fadeIn_150ms_ease-out]"
        >
          <span className="text-sm sm:text-base font-medium flex-1 min-w-0 truncate">
            {active.message}
          </span>
          <span
            aria-hidden="true"
            className="text-xs text-bone/60 tabular-nums"
          >
            {active.remainingSeconds}s
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="h-9 px-3 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Deshacer
          </button>
        </div>
      )}
    </UndoToastContext.Provider>
  )
}

export function useUndoToast(): UndoToastContextValue {
  const ctx = useContext(UndoToastContext)
  if (!ctx) {
    throw new Error('useUndoToast must be used within an UndoToastProvider')
  }
  return ctx
}

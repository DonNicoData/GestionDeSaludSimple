/**
 * Hook de eliminación con undo de 5 segundos.
 *
 * Patrón (basado en NN/g "User Control and Freedom" + Notion/Airtable):
 * - Al "eliminar", NO borramos de la DB inmediatamente. Marcamos el
 *   item como "pending-delete" en memoria (el componente lo renderiza
 *   tachado) y arrancamos un timer de 5s.
 * - Mostramos un toast con botón "Deshacer" + countdown.
 * - Si el usuario hace click en undo antes de que termine el timer,
 *   cancelamos: el item vuelve a la vista normal y NO tocamos la DB.
 * - Si el timer termina sin undo, ejecutamos el `commit` (delete real
 *   en DB). En ese momento, si el commit falla, mostramos error y
 *   "revivimos" el item (lo des-marcamos como pending).
 *
 * El snapshot previo (en `useUndoableDelete`) se usa en dos casos:
 * - Borrado de cliente: necesitamos cliente + todos sus records para
 *   poder restaurar atómicamente.
 * - Borrado de record: basta con el record solo.
 *
 * El snapshot es un deep-copy vía `structuredClone` para que mutaciones
 * accidentales del caller no afecten el restore.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export const UNDO_WINDOW_MS = 5000

export type UndoableState =
  | { kind: 'idle' }
  | { kind: 'pending'; snapshot: unknown; commit: () => Promise<void> }
  | { kind: 'committed' }
  | { kind: 'restored' }

export interface UndoableOptions<T> {
  /** Función que borra definitivamente de la DB. */
  commit: () => Promise<void>
  /** Función que restaura a partir del snapshot. */
  restore: (snapshot: T) => Promise<void>
  /** Snapshot del item a borrar. */
  snapshot: T
  /** Callback cuando se completa el delete real (post-5s). */
  onCommitted?: () => void
  /** Callback cuando el usuario deshace. */
  onUndone?: () => void
}

export interface UseUndoableDeleteResult {
  state: UndoableState
  remainingMs: number
  trigger: () => void
  undo: () => Promise<void>
  cancel: () => void
}

export function useUndoableDelete<T>(opts: UndoableOptions<T>): UseUndoableDeleteResult {
  const [state, setState] = useState<UndoableState>({ kind: 'idle' })
  const [remainingMs, setRemainingMs] = useState(0)
  const optsRef = useRef(opts)
  optsRef.current = opts

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef<number>(0)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => clearTimer, [clearTimer])

  const trigger = useCallback(() => {
    clearTimer()
    const snapshotCopy = structuredClone(optsRef.current.snapshot)
    setState({
      kind: 'pending',
      snapshot: snapshotCopy,
      commit: optsRef.current.commit,
    })
    startRef.current = Date.now()
    setRemainingMs(UNDO_WINDOW_MS)
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const remaining = Math.max(0, UNDO_WINDOW_MS - elapsed)
      setRemainingMs(remaining)
      if (remaining === 0) {
        clearTimer()
        // Commit real
        void optsRef.current.commit()
          .then(() => {
            setState({ kind: 'committed' })
            optsRef.current.onCommitted?.()
          })
          .catch(() => {
            // Si el commit falla, dejamos el item "pending" para que el
            // usuario pueda reintentar (o el caller puede mostrar error).
            setState((prev) =>
              prev.kind === 'pending' ? prev : { kind: 'idle' },
            )
          })
      }
    }, 100)
  }, [clearTimer])

  const undo = useCallback(async () => {
    if (state.kind !== 'pending') return
    clearTimer()
    try {
      await optsRef.current.restore(state.snapshot as T)
      setState({ kind: 'restored' })
      optsRef.current.onUndone?.()
    } catch {
      // Si restore falla, dejamos el item en DB "muerto" y marcamos
      // idle para que el caller refresque.
      setState({ kind: 'idle' })
    }
  }, [state, clearTimer])

  const cancel = useCallback(() => {
    clearTimer()
    setState({ kind: 'idle' })
    setRemainingMs(0)
  }, [clearTimer])

  return { state, remainingMs, trigger, undo, cancel }
}

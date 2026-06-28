import { useCallback, useEffect, useRef, useState } from 'react'
import { db } from '@/db/schema'

const DEBOUNCE_MS = 300

export interface UseFormDraftDBResult<T> {
  value: T | null
  setValue: (v: T | null) => void
  clearDraft: () => Promise<void>
  loading: boolean
}

async function readDraft<T>(key: string): Promise<T | null> {
  const entry = await db.drafts.get(key)
  return (entry?.value as T | undefined) ?? null
}

async function writeDraft<T>(key: string, value: T | null): Promise<void> {
  if (value === null) {
    await db.drafts.delete(key)
  } else {
    await db.drafts.put({ key, value, updatedAt: new Date() })
  }
}

/**
 * Hook para persistir el estado de un formulario en IndexedDB (Dexie).
 *
 * A diferencia de `useFormDraft` (sessionStorage, sincrónico):
 * - **Persiste entre sesiones**: si el usuario cierra la pestaña, el borrador
 *   sigue disponible cuando vuelva.
 * - **Asíncrono**: la lectura inicial es asíncrona. Se devuelve `loading: true`
 *   hasta que el primer valor llegue. Los `setValue` se debouncean para no
 *   saturar la DB en cada keystroke.
 * - **Compatible con la misma forma**: la firma `value / setValue / clearDraft`
 *   es similar, así que migrar componentes es directo.
 */
export function useFormDraftDB<T>(key: string): UseFormDraftDBResult<T> {
  const [value, setInternal] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  const debounceRef = useRef<number | null>(null)
  const pendingRef = useRef<T | null | undefined>(undefined)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false
    void readDraft<T>(key).then((v) => {
      if (cancelled) return
      setInternal(v)
      setLoading(false)
    })
    return () => {
      cancelled = true
      mountedRef.current = false
    }
  }, [key])

  const flushPending = useCallback(async () => {
    if (pendingRef.current === undefined) return
    const next = pendingRef.current
    pendingRef.current = undefined
    await writeDraft(key, next)
  }, [key])

  const setValue = useCallback(
    (next: T | null) => {
      setInternal(next)
      pendingRef.current = next

      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current)
      }
      debounceRef.current = window.setTimeout(() => {
        void flushPending()
        debounceRef.current = null
      }, DEBOUNCE_MS)
    },
    [flushPending],
  )

  const clearDraft = useCallback(async () => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    pendingRef.current = undefined
    await writeDraft(key, null)
    if (mountedRef.current) {
      setInternal(null)
    }
  }, [key])

  // Flush pendiente al desmontar para no perder último cambio.
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      void flushPending()
    }
  }, [flushPending])

  return {
    value,
    setValue,
    clearDraft,
    loading,
  }
}

export const DRAFT_KEY_BASIC = 'salud_draft_basic_v1'
export const DRAFT_KEY_METRICS = 'salud_draft_metrics_v1'

/**
 * Limpia TODOS los borradores de la app. Usado al volver al Home
 * (descartar flujo) o desde admin cuando se purga la DB.
 */
export async function clearAllDrafts(): Promise<void> {
  const keys = [DRAFT_KEY_BASIC, DRAFT_KEY_METRICS]
  await db.drafts.bulkDelete(keys)
}

export async function clearDraftByKey(key: string): Promise<void> {
  await db.drafts.delete(key)
}

export async function hasAnyDraft(): Promise<boolean> {
  const count = await db.drafts.count()
  return count > 0
}
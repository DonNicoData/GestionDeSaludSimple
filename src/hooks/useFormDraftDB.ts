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
 * Work-preservation invariants (P0-3):
 * - El setValue escribe al instante en `pendingRef` (memoria) y agenda un
 *   debounce de 300ms hacia IndexedDB.
 * - Al desmontar o al hacer flushPending, se cancela el timeout pendiente
 *   y se escribe `pendingRef.current` de forma inmediata, sin esperar
 *   al debounce. Esto evita perder el último cambio cuando el usuario
 *   escribe y navega rápido.
 * - Si el componente ya está desmontado, NO se hace setState (chequeo
 *   `mountedRef`) para evitar warnings de React.
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

  const writeNow = useCallback(
    async (next: T | null | undefined) => {
      if (next === undefined) return
      await writeDraft(key, next)
    },
    [key],
  )

  const flushPending = useCallback(() => {
    if (pendingRef.current === undefined) return
    const next = pendingRef.current
    pendingRef.current = undefined
    void writeNow(next)
  }, [writeNow])

  const setValue = useCallback(
    (next: T | null) => {
      setInternal(next)
      pendingRef.current = next

      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current)
      }
      debounceRef.current = window.setTimeout(() => {
        flushPending()
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

  // Flush pendiente al desmontar — P0-3: cancela timeout y escribe YA.
  // Importante: NO es async cleanup (React ignora la promesa). Se dispara
  // la escritura sincrónicamente pero la operación de Dexie es asíncrona;
  // Dexie encola la operación internamente y la completa aunque el
  // componente esté desmontado.
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      flushPending()
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

/**
 * Helpers exportados para tests (P0-1 regression suite).
 * No usar desde UI — preferir el hook `useFormDraftDB`.
 */
export async function readDraftForTest<T>(key: string): Promise<T | null> {
  return readDraft<T>(key)
}

export async function writeDraftForTest<T>(
  key: string,
  value: T,
): Promise<void> {
  await writeDraft(key, value)
}
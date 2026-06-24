import { useCallback, useEffect, useRef, useState } from 'react'

const DEBOUNCE_MS = 300

export interface UseFormDraftResult<T> {
  value: T | null
  setValue: (v: T | null) => void
  clearDraft: () => void
  hasDraft: boolean
}

function readFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeToStorage<T>(key: string, value: T | null): void {
  if (typeof window === 'undefined') return
  try {
    if (value === null) {
      window.sessionStorage.removeItem(key)
    } else {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    }
  } catch {
    /* quota exceeded or storage disabled */
  }
}

/**
 * Hook para persistir el estado de un formulario en sessionStorage.
 *
 * - Lee el valor persistido al montar (sincrónico).
 * - Escribe con debounce en cada cambio para no saturar el storage.
 * - Al desmontar, fuerza un flush para no perder el último cambio.
 * - hasDraft: true si hay valor persistido o en memoria.
 *
 * Limitaciones conocidas:
 * - sessionStorage se limpia al cerrar la pestaña (no persiste entre sesiones).
 * - No hay sincronización entre pestañas (último write gana).
 */
export function useFormDraft<T>(key: string): UseFormDraftResult<T> {
  const [value, setInternal] = useState<T | null>(() => readFromStorage<T>(key))

  const debounceRef = useRef<number | null>(null)
  const pendingRef = useRef<T | null | undefined>(undefined)

  const setValue = useCallback(
    (next: T | null) => {
      setInternal(next)
      pendingRef.current = next

      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current)
      }
      debounceRef.current = window.setTimeout(() => {
        writeToStorage(key, pendingRef.current ?? null)
        debounceRef.current = null
        pendingRef.current = undefined
      }, DEBOUNCE_MS)
    },
    [key],
  )

  const clearDraft = useCallback(() => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    pendingRef.current = undefined
    writeToStorage(key, null)
    setInternal(null)
  }, [key])

  // Flush pendiente al desmontar para no perder último cambio
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      if (pendingRef.current !== undefined) {
        writeToStorage(key, pendingRef.current)
        pendingRef.current = undefined
      }
    }
  }, [key])

  return {
    value,
    setValue,
    clearDraft,
    hasDraft: value !== null,
  }
}

/**
 * Clave estable para los borradores de la app. App.tsx usa este prefijo
 * para limpiar todos los borradores al volver al Home.
 */
export const DRAFT_KEY_PREFIX = 'salud_draft_'

export function clearAllDrafts(): void {
  if (typeof window === 'undefined') return
  const keys = Object.keys(window.sessionStorage)
  for (const k of keys) {
    if (k.startsWith(DRAFT_KEY_PREFIX)) {
      window.sessionStorage.removeItem(k)
    }
  }
}

export function hasAnyDraft(): boolean {
  if (typeof window === 'undefined') return false
  return Object.keys(window.sessionStorage).some((k) =>
    k.startsWith(DRAFT_KEY_PREFIX),
  )
}

/**
 * Hook de autenticación del admin: encapsula la lógica de login,
 * verificación, lockout y logout.
 *
 * - En mount, lee si ya hay sesión activa en sessionStorage.
 * - `login(password)`: hashea con bcrypt y compara contra
 *   `VITE_ADMIN_PASSWORD`. Devuelve ok:true/false y deja que la UI
 *   muestre el error.
 * - `logout()`: limpia la sesión.
 * - Expone el estado de lockout (`lockedSecondsRemaining`) para que el
 *   botón de submit se deshabilite durante el bloqueo y se muestre un
 *   countdown.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  getAdminPasswordFromEnv,
  hashPassword,
  verifyPassword,
} from '@/admin/auth/hash'
import {
  clearLockout,
  isLocked as isLockoutActive,
  readLockoutState,
  recordFailedAttempt,
  getRemainingLockoutMs,
  type LockoutState,
} from '@/admin/auth/lockout'
import {
  endAdminSession,
  isAdminAuthenticated,
  startAdminSession,
} from '@/admin/auth/session'

const TICK_MS = 250

export interface UseAdminAuthResult {
  authenticated: boolean
  submitting: boolean
  errorKey: 'mismatch' | 'noPassword' | null
  lockedSecondsRemaining: number
  login: (password: string) => Promise<boolean>
  logout: () => void
}

export function useAdminAuth(): UseAdminAuthResult {
  const [authenticated, setAuthenticated] = useState<boolean>(() =>
    isAdminAuthenticated(),
  )
  const [submitting, setSubmitting] = useState(false)
  const [errorKey, setErrorKey] = useState<'mismatch' | 'noPassword' | null>(null)
  const [, setLockout] = useState<LockoutState>(() => readLockoutState())
  const [lockedSecondsRemaining, setLockedSecondsRemaining] = useState(0)

  // Tick para refrescar el countdown del lockout.
  useEffect(() => {
    const id = window.setInterval(() => {
      const state = readLockoutState()
      setLockout(state)
      const remainingMs = getRemainingLockoutMs(state)
      setLockedSecondsRemaining(Math.ceil(remainingMs / 1000))
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  const login = useCallback(
    async (password: string): Promise<boolean> => {
      setErrorKey(null)
      const state = readLockoutState()
      if (isLockoutActive(state)) {
        return false
      }
      setSubmitting(true)
      try {
        const expected = getAdminPasswordFromEnv()
        if (!expected) {
          setErrorKey('noPassword')
          return false
        }
        const expectedHash = await hashPassword(expected)
        const ok = await verifyPassword(password, expectedHash)
        if (ok) {
          startAdminSession()
          clearLockout()
          setAuthenticated(true)
          return true
        }
        const next = recordFailedAttempt()
        setLockout(next)
        if (isLockoutActive(next)) {
          setErrorKey(null)
        } else {
          setErrorKey('mismatch')
        }
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [],
  )

  const logout = useCallback(() => {
    endAdminSession()
    setAuthenticated(false)
  }, [])

  return {
    authenticated,
    submitting,
    errorKey,
    lockedSecondsRemaining,
    login,
    logout,
  }
}

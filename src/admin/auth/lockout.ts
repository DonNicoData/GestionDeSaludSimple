/**
 * Lockout de intentos de login: tras N intentos fallidos consecutivos
 * dentro de la misma sesión de pestaña, bloquea nuevos intentos durante
 * un período.
 *
 * El estado vive en sessionStorage, así que:
 * - Sobrevive a F5 dentro de la misma pestaña.
 * - Muere al cerrar la pestaña (el "atacante" tendría que reabrir la
 *   pestaña y volver a tipear, lo que es fricción suficiente para el
 *   nivel de amenaza del proyecto).
 *
 * El contador y el timestamp del próximo desbloqueo se serializan como
 * JSON. Cualquier error de storage se ignora silenciosamente: si no
 * funciona sessionStorage, el lockout simplemente no aplica y se vuelve
 * a login normal.
 *
 * Defaults: 3 intentos → 30s de bloqueo. Ajustables vía parámetros.
 */

const COUNTER_KEY = 'gds:admin:failed-attempts'
const UNTIL_KEY = 'gds:admin:locked-until'
const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_LOCKOUT_MS = 30_000

export interface LockoutState {
  failedAttempts: number
  lockedUntil: number | null
}

function readNumber(key: string): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(key)
    if (raw == null) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function writeNumber(key: string, value: number): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(key, String(value))
  } catch {
    // ignore
  }
}

function clearKey(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function readLockoutState(): LockoutState {
  return {
    failedAttempts: readNumber(COUNTER_KEY) ?? 0,
    lockedUntil: readNumber(UNTIL_KEY),
  }
}

function isLockedNow(state: LockoutState, now: number = Date.now()): boolean {
  if (state.lockedUntil == null) return false
  return state.lockedUntil > now
}

/**
 * Devuelve los segundos restantes de bloqueo, o 0 si no está bloqueado.
 * Útil para mostrar un countdown en el UI.
 */
export function getRemainingLockoutMs(
  state: LockoutState,
  now: number = Date.now(),
): number {
  if (state.lockedUntil == null) return 0
  const remaining = state.lockedUntil - now
  return remaining > 0 ? remaining : 0
}

export function isLocked(state: LockoutState, now: number = Date.now()): boolean {
  return isLockedNow(state, now)
}

export function recordFailedAttempt(
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
  lockoutMs: number = DEFAULT_LOCKOUT_MS,
): LockoutState {
  const prev = readLockoutState()
  const failedAttempts = prev.failedAttempts + 1
  writeNumber(COUNTER_KEY, failedAttempts)
  if (failedAttempts >= maxAttempts) {
    writeNumber(UNTIL_KEY, Date.now() + lockoutMs)
  }
  return readLockoutState()
}

export function clearLockout(): void {
  clearKey(COUNTER_KEY)
  clearKey(UNTIL_KEY)
}

/**
 * Sesión de admin: marca de "logged in" en sessionStorage.
 *
 * Decisiones (basadas en NN/g y PLAN §8):
 * - sessionStorage, NO localStorage: al cerrar la pestaña se cierra la
 *   sesión, evitando que el admin quede logueado indefinidamente en un
 *   dispositivo compartido.
 * - El valor es opaco (timestamp), no la contraseña. Si alguien lee
 *   sessionStorage no encuentra nada útil más allá de "sí, admin estuvo
 *   logueado en esta pestaña".
 * - Si sessionStorage no está disponible (modo privado, storage lleno),
 *   caemos a memoria del módulo: la sesión vive solo durante la vida
 *   de la pestaña, lo cual es aceptable para este nivel de amenaza.
 */

const SESSION_KEY = 'gds:admin:session'

let inMemorySession: number | null = null

function read(): number | null {
  if (typeof window === 'undefined') return inMemorySession
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (raw == null) return inMemorySession
    const n = Number(raw)
    return Number.isFinite(n) ? n : inMemorySession
  } catch {
    return inMemorySession
  }
}

function write(timestamp: number): void {
  inMemorySession = timestamp
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(SESSION_KEY, String(timestamp))
  } catch {
    // ignore: in-memory fallback already set
  }
}

function clear(): void {
  inMemorySession = null
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

export function isAdminAuthenticated(): boolean {
  return read() != null
}

export function startAdminSession(): void {
  write(Date.now())
}

export function endAdminSession(): void {
  clear()
}

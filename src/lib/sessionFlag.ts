/**
 * Helpers para una bandera de sesión respaldada en sessionStorage.
 *
 * Se usan para condicionar CTAs (por ejemplo, "Ver mi historial") que
 * deben aparecer solo después de una acción confirmada por el usuario
 * en la pestaña actual. Sobrevive a F5 dentro de la misma pestaña;
 * muere al cerrar la pestaña (semántica nativa de sessionStorage).
 *
 * SSR-safe: si `window` no está definido (entornos sin DOM), devuelve
 * el valor por defecto sin lanzar.
 */

const KEY = 'gds:has-saved-in-session'

export function readSessionSavedFlag(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function writeSessionSavedFlag(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(KEY, '1')
  } catch {
    // sessionStorage puede fallar en modo privado / storage lleno.
    // La falta de persistencia no es bloqueante: el flag vive en memoria
    // vía el state del componente, así que el CTA sigue funcionando
    // dentro de la sesión actual aunque no sobreviva a F5.
  }
}
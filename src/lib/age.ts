/**
 * Calcula la edad en años cumplidos a partir de una fecha de nacimiento
 * en formato ISO YYYY-MM-DD.
 */
export function calculateAge(birthDateIso: string, now: Date = new Date()): number {
  if (!birthDateIso) return 0

  const birth = new Date(birthDateIso)
  if (Number.isNaN(birth.getTime())) return 0

  let years = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  const dayDiff = now.getDate() - birth.getDate()

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years -= 1
  }
  return Math.max(0, years)
}

/**
 * Convierte una fecha a formato ISO YYYY-MM-DD.
 * Acepta un string de input de tipo date (YYYY-MM-DD) o un Date.
 */
export function toIsoDate(value: string | Date): string {
  if (value instanceof Date) {
    const yyyy = value.getFullYear()
    const mm = String(value.getMonth() + 1).padStart(2, '0')
    const dd = String(value.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
  return value
}

/**
 * Devuelve la fecha de hoy en formato ISO YYYY-MM-DD (sin hora).
 */
export function todayIso(): string {
  return toIsoDate(new Date())
}

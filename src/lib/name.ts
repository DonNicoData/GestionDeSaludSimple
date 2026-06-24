/**
 * Construye el nombre completo a partir de los componentes.
 * Une con un solo espacio y descarta segmentos vacíos.
 */
export function combineName(
  firstName: string,
  lastName1: string,
  lastName2: string,
): string {
  return [firstName, lastName1, lastName2]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ')
}

/**
 * Devuelve el nombre completo de un cliente con sus tres componentes.
 */
export function fullNameOf(client: {
  firstName: string
  lastName1: string
  lastName2: string
}): string {
  return combineName(client.firstName, client.lastName1, client.lastName2)
}

/**
 * Normaliza un nombre para comparación/matching:
 * lowercase, sin tildes, sin espacios redundantes.
 */
export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

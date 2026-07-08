/**
 * Hashing y verificación de la contraseña de admin.
 *
 * La contraseña de admin se lee desde `import.meta.env.VITE_ADMIN_PASSWORD`
 * y se hashea con bcryptjs en el momento del login. Nunca persistimos el
 * hash: el cómputo se hace en runtime porque el bundle del cliente ya
 * incluye la variable (es un filtro básico, no seguridad de servidor).
 *
 * El costo (10 rounds) está elegido para que tarde ~50-100 ms en un
 * dispositivo moderno: suficiente para ralentizar un ataque de fuerza
 * bruta trivial sin volver la app pesada. Coincide con el default de
 * bcryptjs.
 *
 * Ver PLAN §8 — "PIN admin local: no es seguridad alta, es filtro
 * básico". Si en el futuro el modelo pasa a backend, este módulo se
 * reemplaza por una llamada al endpoint.
 */
import bcrypt from 'bcryptjs'

const BCRYPT_COST = 10

/**
 * Hashea una contraseña en texto plano. Se usa al iniciar la app para
 * derivar el hash a comparar contra `verifyPassword` (en lugar de
 * guardar el hash en disco).
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST)
}

/**
 * Compara una contraseña en texto plano contra un hash bcrypt.
 *
 * Usa `bcrypt.compare` que internamente hace comparación constant-time
 * sobre el hash derivado, mitigando timing attacks básicos. La
 * comparación de la "entrada" contra la "entrada hasheada esperada"
 * sigue siendo vulnerable si el input tiene longitudes muy diferentes
 * (el costo de bcrypt se mide en el output derivado, no en la entrada),
 * pero es una mitigación suficiente para el contexto de la app.
 */
export async function verifyPassword(
  plain: string,
  expectedHash: string,
): Promise<boolean> {
  if (!plain || !expectedHash) return false
  try {
    return await bcrypt.compare(plain, expectedHash)
  } catch {
    return false
  }
}

/**
 * Lee la contraseña de admin desde la configuración de Vite. Si no
 * está definida (build sin .env), devuelve string vacío → el login
 * fallará siempre con un mensaje claro.
 */
export function getAdminPasswordFromEnv(): string {
  const value = import.meta.env.VITE_ADMIN_PASSWORD
  return typeof value === 'string' ? value : ''
}

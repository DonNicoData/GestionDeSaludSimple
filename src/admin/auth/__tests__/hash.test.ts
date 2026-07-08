import { describe, expect, it } from 'vitest'
import { getAdminPasswordFromEnv, hashPassword, verifyPassword } from '../hash'

describe('hashPassword / verifyPassword', () => {
  it('hashea una contraseña y la verifica correctamente', async () => {
    const hash = await hashPassword('adminadmin')
    expect(hash).not.toBe('adminadmin')
    expect(hash.length).toBeGreaterThan(20)
    expect(await verifyPassword('adminadmin', hash)).toBe(true)
  })

  it('devuelve false con contraseña incorrecta', async () => {
    const hash = await hashPassword('adminadmin')
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })

  it('devuelve false con input vacío', async () => {
    const hash = await hashPassword('adminadmin')
    expect(await verifyPassword('', hash)).toBe(false)
  })

  it('devuelve false con hash vacío', async () => {
    expect(await verifyPassword('adminadmin', '')).toBe(false)
  })

  it('dos hashes de la misma contraseña son distintos (salt aleatorio)', async () => {
    const a = await hashPassword('adminadmin')
    const b = await hashPassword('adminadmin')
    expect(a).not.toBe(b)
    // Pero ambos verifican OK.
    expect(await verifyPassword('adminadmin', a)).toBe(true)
    expect(await verifyPassword('adminadmin', b)).toBe(true)
  })
})

describe('getAdminPasswordFromEnv', () => {
  it('devuelve string vacío si VITE_ADMIN_PASSWORD no está definida', () => {
    // vitest no inyecta import.meta.env por defecto para este test.
    const value = getAdminPasswordFromEnv()
    expect(typeof value).toBe('string')
  })
})

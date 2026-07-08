import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  clearLockout,
  getRemainingLockoutMs,
  isLocked,
  readLockoutState,
  recordFailedAttempt,
} from '../lockout'

describe('admin lockout', () => {
  beforeEach(() => {
    clearLockout()
  })

  afterEach(() => {
    clearLockout()
  })

  it('empieza en 0 intentos y desbloqueado', () => {
    const state = readLockoutState()
    expect(state.failedAttempts).toBe(0)
    expect(state.lockedUntil).toBeNull()
    expect(isLocked(state)).toBe(false)
    expect(getRemainingLockoutMs(state)).toBe(0)
  })

  it('incrementa el contador con cada intento fallido', () => {
    const s1 = recordFailedAttempt()
    expect(s1.failedAttempts).toBe(1)
    expect(isLocked(s1)).toBe(false)

    const s2 = recordFailedAttempt()
    expect(s2.failedAttempts).toBe(2)
    expect(isLocked(s2)).toBe(false)
  })

  it('alcanza el máximo de intentos y queda bloqueado', () => {
    const s1 = recordFailedAttempt()
    const s2 = recordFailedAttempt()
    const s3 = recordFailedAttempt()
    expect(s3.failedAttempts).toBe(3)
    expect(s3.lockedUntil).not.toBeNull()
    expect(s3.lockedUntil!).toBeGreaterThan(Date.now())
    expect(isLocked(s3)).toBe(true)
    expect(isLocked(s1)).toBe(false)
    expect(isLocked(s2)).toBe(false)
  })

  it('getRemainingLockoutMs devuelve ms positivos mientras esté bloqueado', () => {
    recordFailedAttempt()
    recordFailedAttempt()
    const s3 = recordFailedAttempt()
    const remaining = getRemainingLockoutMs(s3)
    expect(remaining).toBeGreaterThan(0)
    expect(remaining).toBeLessThanOrEqual(30_000)
  })

  it('clearLockout resetea todo', () => {
    recordFailedAttempt()
    recordFailedAttempt()
    recordFailedAttempt()
    clearLockout()
    const state = readLockoutState()
    expect(state.failedAttempts).toBe(0)
    expect(state.lockedUntil).toBeNull()
  })
})

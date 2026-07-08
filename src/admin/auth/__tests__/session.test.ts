import { afterEach, describe, expect, it } from 'vitest'
import {
  endAdminSession,
  isAdminAuthenticated,
  startAdminSession,
} from '../session'

describe('admin session', () => {
  afterEach(() => {
    endAdminSession()
  })

  it('empieza sin sesión activa', () => {
    expect(isAdminAuthenticated()).toBe(false)
  })

  it('startAdminSession marca la sesión como activa', () => {
    startAdminSession()
    expect(isAdminAuthenticated()).toBe(true)
  })

  it('endAdminSession cierra la sesión', () => {
    startAdminSession()
    endAdminSession()
    expect(isAdminAuthenticated()).toBe(false)
  })
})

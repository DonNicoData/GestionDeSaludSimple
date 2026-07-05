import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Tests para sessionFlag. Como vitest corre en `node` por defecto,
 * stubbemos un `window` mínimo con un `sessionStorage` in-memory
 * antes de importar el módulo bajo test. `vi.resetModules()` fuerza
 * una recarga del módulo para que el `typeof window === 'undefined'`
 * se evalúe con el stub ya presente.
 */

function makeMockStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial))
  return {
    getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
    clear: vi.fn(() => {
      store.clear()
    }),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    get length() {
      return store.size
    },
  }
}

async function loadWithStorage(storage: ReturnType<typeof makeMockStorage>) {
  vi.stubGlobal('window', { sessionStorage: storage })
  vi.resetModules()
  const mod = await import('../sessionFlag')
  return mod
}

describe('sessionFlag', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('readSessionSavedFlag', () => {
    it('devuelve false cuando no hay valor guardado', async () => {
      const { readSessionSavedFlag } = await loadWithStorage(makeMockStorage())
      expect(readSessionSavedFlag()).toBe(false)
    })

    it('devuelve true cuando sessionStorage tiene "1"', async () => {
      const { readSessionSavedFlag } = await loadWithStorage(
        makeMockStorage({ 'gds:has-saved-in-session': '1' }),
      )
      expect(readSessionSavedFlag()).toBe(true)
    })

    it('devuelve false si sessionStorage tiene cualquier otro valor', async () => {
      const { readSessionSavedFlag } = await loadWithStorage(
        makeMockStorage({ 'gds:has-saved-in-session': 'true' }),
      )
      expect(readSessionSavedFlag()).toBe(false)
    })

    it('devuelve false si sessionStorage.getItem lanza (modo privado)', async () => {
      const storage = makeMockStorage()
      storage.getItem.mockImplementation(() => {
        throw new Error('SecurityError')
      })
      const { readSessionSavedFlag } = await loadWithStorage(storage)
      expect(readSessionSavedFlag()).toBe(false)
    })
  })

  describe('writeSessionSavedFlag', () => {
    it('escribe "1" en la clave correcta', async () => {
      const storage = makeMockStorage()
      const { writeSessionSavedFlag } = await loadWithStorage(storage)
      writeSessionSavedFlag()
      expect(storage.setItem).toHaveBeenCalledWith('gds:has-saved-in-session', '1')
    })

    it('es idempotente (sobrescribir con "1" sigue dando "1")', async () => {
      const storage = makeMockStorage({ 'gds:has-saved-in-session': '1' })
      const { writeSessionSavedFlag, readSessionSavedFlag } = await loadWithStorage(storage)
      writeSessionSavedFlag()
      expect(readSessionSavedFlag()).toBe(true)
    })

    it('no lanza si sessionStorage.setItem falla', async () => {
      const storage = makeMockStorage()
      storage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceeded')
      })
      const { writeSessionSavedFlag } = await loadWithStorage(storage)
      expect(() => writeSessionSavedFlag()).not.toThrow()
    })
  })
})
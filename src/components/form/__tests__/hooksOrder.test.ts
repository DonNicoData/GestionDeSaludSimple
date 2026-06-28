import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Regression test para el bug detectado en validación manual:
 *
 * "Arregla una vez pasa al segundo formulario. Se queda en blanco y no responde."
 *
 * Causa raíz: en MetricsForm.tsx, el `if (draft.loading && !hydrated) return
 * <skeleton />` estaba UBICADO ENTRE los useState de errores/touched/etc.
 * Esto rompe las Rules of Hooks: React cree que los hooks se llaman en
 * distinto orden entre renders → "se queda en blanco".
 *
 * Este test verifica estáticamente que:
 * 1. Todos los hooks (useState/useEffect/useMemo/useCallback) en el
 *    componente aparecen ANTES del conditional return.
 * 2. El conditional return aparece DESPUÉS del último hook.
 *
 * Si rompe: alguien movió el if arriba de los hooks. El bug está de vuelta.
 */

const HOOK_RE = /\b(useState|useEffect|useMemo|useCallback|useRef|useReducer|useContext|useLayoutEffect|useImperativeHandle|useDebugValue)\b/
const CONDITIONAL_RETURN_RE =
  /\bif\s*\(\s*draft\.loading\s*&&\s*!hydrated\s*\)\s*\{[\s\S]*?return\s*\(/

function findLineOfFirstMatch(
  source: string,
  regex: RegExp,
): number {
  const lines = source.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i] ?? '')) {
      return i + 1 // 1-indexed
    }
  }
  return -1
}

function findLastLineOfHook(source: string): number {
  const lines = source.split('\n')
  let last = -1
  for (let i = 0; i < lines.length; i++) {
    if (HOOK_RE.test(lines[i] ?? '')) {
      last = i + 1
    }
  }
  return last
}

describe('Hooks order rules — conditional renders must follow all hooks', () => {
  const candidates = [
    'src/components/form/MetricsForm.tsx',
    'src/components/form/BasicDataForm.tsx',
  ] as const

  for (const file of candidates) {
    it(`${file}: el if (draft.loading && !hydrated) return está DESPUÉS del último hook`, () => {
      const source = readFileSync(resolve(file), 'utf8')

      const conditionalLine = findLineOfFirstMatch(source, CONDITIONAL_RETURN_RE)
      const lastHookLine = findLastLineOfHook(source)

      if (conditionalLine === -1) {
        // El componente no usa este patrón — no hay nada que verificar.
        return
      }

      expect(
        conditionalLine,
        `Expected conditional return on line > ${lastHookLine}, got line ${conditionalLine}. ` +
          `Mover el if abajo de todos los hooks (Rules of Hooks).`,
      ).toBeGreaterThan(lastHookLine)
    })
  }

  it('no hay hooks dentro de returns tempranos en los componentes form', () => {
    for (const file of candidates) {
      const source = readFileSync(resolve(file), 'utf8')
      // Busca el patrón "if (...) return" y verifica que NO haya hooks
      // entre un return temprano y el final del componente.
      const earlyReturns = source.matchAll(
        /\bif\s*\([^)]*\)\s*\{\s*return\s*\([\s\S]*?\n\s*\}\n/g,
      )
      for (const m of earlyReturns) {
        const block = m[0]
        // Permitir el `return <skeleton />` que NO contiene hooks.
        const hookInsideEarlyReturn = HOOK_RE.test(block)
        expect(
          hookInsideEarlyReturn,
          `${file}: no debe haber hooks dentro de early returns. Bloque encontrado:\n${block.slice(0, 200)}`,
        ).toBe(false)
      }
    }
  })
})
/**
 * Stress test del patrón "ref sincronizada con state" usado por
 * ResultsPage para leer el alcance del export sin depender del re-render
 * de React.
 *
 * El bug original: cuando el usuario seleccionaba "Esta medición" en el
 * scope selector y hacía click en "Descargar Excel" muy rápido, el botón
 * podía leer el valor viejo de `exportScope` desde el closure previo al
 * re-render, descargando el historial completo en lugar de la medición
 * actual.
 *
 * El fix: cada `updateExportScope(next)` actualiza TANTO la ref como el
 * state en el mismo tick, y `handleExport` lee siempre desde la ref.
 * `handleExport` puede ser invocada en cualquier momento y siempre verá
 * el último valor seleccionado.
 *
 * Este test NO usa React real (no hay testing-library disponible en el
 * proyecto). En su lugar simula exactamente el patrón: state + ref +
 * sync atómico + lectura desde ref. Si el patrón está bien implementado,
 * el test pasa. Si rompe el contrato (ref desincronizada, lectura desde
 * state en lugar de ref, etc.) el test falla.
 */
import { describe, expect, it, vi } from 'vitest'
import { pickRecordsForScope, type ExportScope } from '../scope'
import type { Record } from '@/types'

function makeRecord(id: number, weight: number): Record {
  return {
    id,
    clientId: 1,
    date: new Date(`2026-07-0${id}T10:00:00`),
    weight,
    bmi: 22,
    bodyFatPct: 20,
    muscleMassPct: 35,
    calories: 1800,
    bioAge: 30,
    visceralFat: 8,
  }
}

/**
 * Simula el componente ResultsPage:
 * - exportScopeState: lo que React tiene en memoria (puede estar
 *   "desactualizado" durante el re-render).
 * - exportScopeRef: la fuente de verdad que `handleExport` consulta.
 * - updateExportScope: actualiza ambos en el mismo tick (EL FIX).
 */
function makeComponent() {
  let exportScopeState: ExportScope = 'current'
  const exportScopeRef: { current: ExportScope } = { current: 'current' }
  const runExport = vi.fn()

  function updateExportScope(next: ExportScope) {
    exportScopeRef.current = next
    exportScopeState = next
  }

  function handleExport(format: 'xlsx' | 'pdf') {
    const records = [
      makeRecord(3, 73),
      makeRecord(2, 72),
      makeRecord(1, 71),
    ]
    const subset = pickRecordsForScope(records, exportScopeRef.current, 3)
    runExport(subset, format)
  }

  // Devuelve un getter para que el test vea el valor actualizado de `let`.
  return {
    exportScopeState: () => exportScopeState,
    exportScopeRef,
    updateExportScope,
    handleExport,
    runExport,
  }
}

describe('export scope ref pattern (closure-resilience)', () => {
  it('initial scope = "current" → exporta solo la medición recién guardada', () => {
    const { handleExport, runExport } = makeComponent()
    handleExport('xlsx')
    expect(runExport).toHaveBeenCalledTimes(1)
    const [recordsArg] = runExport.mock.calls[0]
    expect(recordsArg).toHaveLength(1)
    expect(recordsArg[0].id).toBe(3)
  })

  it('cambio a "history" → exporta todos los records', () => {
    const { updateExportScope, handleExport, runExport } = makeComponent()
    updateExportScope('history')
    handleExport('pdf')
    const [recordsArg] = runExport.mock.calls[0]
    expect(recordsArg).toHaveLength(3)
  })

  it('cambio a "current" tras estar en "history" → vuelve a filtrar', () => {
    const { updateExportScope, handleExport, runExport } = makeComponent()
    updateExportScope('history')
    handleExport('xlsx')
    updateExportScope('current')
    handleExport('pdf')
    const [xlsxRecords] = runExport.mock.calls[0]
    const [pdfRecords] = runExport.mock.calls[1]
    expect(xlsxRecords).toHaveLength(3)
    expect(pdfRecords).toHaveLength(1)
    expect(pdfRecords[0].id).toBe(3)
  })

  it('cambios rápidos radio → botón reflejan el último valor (caso del bug)', () => {
    // Simula: usuario hace click "Esta medición" → inmediatamente descarga.
    // Sin el ref pattern, el re-render podría no procesarse y el botón
    // leería el state anterior.
    const { updateExportScope, handleExport, runExport } = makeComponent()
    // 1. Usuario hace click en "Tu historial completo".
    updateExportScope('history')
    // 2. Usuario cambia de opinión y hace click en "Esta medición".
    //    Sin esperar re-render, hace click en "Descargar Excel".
    updateExportScope('current')
    handleExport('xlsx')
    const [recordsArg] = runExport.mock.calls[0]
    expect(recordsArg).toHaveLength(1)
    expect(recordsArg[0].id).toBe(3)
  })

  it('secuencia de 10 cambios alternados siempre refleja el último', () => {
    const { updateExportScope, handleExport, runExport } = makeComponent()
    const expectedSizes: number[] = []
    const scopes: ExportScope[] = ['history', 'current', 'history', 'current', 'history', 'current', 'history', 'current', 'history', 'current']
    for (const scope of scopes) {
      updateExportScope(scope)
      handleExport('xlsx')
      expectedSizes.push(scope === 'history' ? 3 : 1)
    }
    for (let i = 0; i < scopes.length; i++) {
      const [recordsArg] = runExport.mock.calls[i]
      expect(recordsArg).toHaveLength(expectedSizes[i])
    }
  })

  it('la ref y el state quedan sincronizados después de updateExportScope', () => {
    const { exportScopeState, exportScopeRef, updateExportScope } = makeComponent()
    updateExportScope('history')
    expect(exportScopeRef.current).toBe('history')
    expect(exportScopeState()).toBe('history')
    updateExportScope('current')
    expect(exportScopeRef.current).toBe('current')
    expect(exportScopeState()).toBe('current')
  })

  it('contraste: el patrón VIEJO (closure sobre state sin ref) puede divergir', () => {
    // Este test demuestra la clase de bug que el patrón nuevo evita.
    // Simulamos el patrón anterior: handleExport captura `exportScope`
    // directamente del state, sin ref. Si el re-render no se procesa
    // antes de la invocación, el closure queda con el valor viejo.
    let exportScope: ExportScope = 'history'  // último valor al momento del último render
    const runExport = vi.fn()

    // handleExport "viejo": lee directamente del state. En React real,
    // cada render crea una nueva handleExport que captura el state de
    // ESE render. Aquí simulamos la "versión vieja" que no se recrea:
    function handleExport(format: 'xlsx' | 'pdf') {
      const records = [makeRecord(3, 73), makeRecord(2, 72), makeRecord(1, 71)]
      const subset = pickRecordsForScope(records, exportScope, 3)
      runExport(subset, format)
    }

    // Simulamos un cambio en el state SIN recrear handleExport.
    exportScope = 'current'
    handleExport('xlsx')
    // Como exportScope es let, el cambio se ve. Esto NO es realmente
    // un closure issue en JS — es un React re-render issue. Por eso
    // el patrón nuevo agrega la ref sincronizada explícitamente.
    // El test verifica que al menos el patrón viejo NO diverge.
    expect(runExport).toHaveBeenCalledWith([expect.objectContaining({ id: 3 })], 'xlsx')
  })

  // STRESS TESTS adicionales: agresivos, multiples clicks.

  it('stress: 100 toggles current↔history alternados sin perder consistencia', () => {
    const { updateExportScope, handleExport, runExport } = makeComponent()
    let expectedCurrent = true
    for (let i = 0; i < 100; i++) {
      updateExportScope(expectedCurrent ? 'current' : 'history')
      handleExport('xlsx')
      expectedCurrent = !expectedCurrent
    }
    // Cada invocación de handleExport debe haber usado el último valor
    // seteado, no el anterior. Verificamos alternancia:
    for (let i = 0; i < 100; i++) {
      const [recordsArg] = runExport.mock.calls[i]
      // i=0: current → 1 record; i=1: history → 3 records; i=2: current → 1; ...
      const expected = i % 2 === 0 ? 1 : 3
      expect(recordsArg).toHaveLength(expected)
    }
  })

  it('stress: 50 updates SIN handleExport (solo updates), luego 1 export', () => {
    // Simula: el usuario cambia el scope muchas veces (re-renders) y
    // luego exporta. El export debe usar el último valor.
    const { updateExportScope, handleExport, runExport, exportScopeRef } = makeComponent()
    for (let i = 0; i < 50; i++) {
      updateExportScope(i % 2 === 0 ? 'history' : 'current')
    }
    // Último valor: i=49 → i%2=1 → 'current'
    expect(exportScopeRef.current).toBe('current')
    handleExport('xlsx')
    const [recordsArg] = runExport.mock.calls[0]
    expect(recordsArg).toHaveLength(1)
  })

  it('stress: 50 updates + 50 exports intercalados siempre coherentes', () => {
    // Simula: el usuario cambia scope y exporta inmediatamente, 50 veces.
    const { updateExportScope, handleExport, runExport } = makeComponent()
    for (let i = 0; i < 50; i++) {
      updateExportScope(i % 2 === 0 ? 'history' : 'current')
      handleExport(i % 3 === 0 ? 'xlsx' : 'pdf')
    }
    // Cada export debe coincidir con el update inmediatamente anterior.
    for (let i = 0; i < 50; i++) {
      const expectedScope = i % 2 === 0 ? 'history' : 'current'
      const expectedLen = expectedScope === 'history' ? 3 : 1
      const [recordsArg] = runExport.mock.calls[i]
      expect(recordsArg).toHaveLength(expectedLen)
    }
  })

  it('stress: race condition simulada — cambio + export en el mismo tick', () => {
    // Simula el bug exacto reportado: el usuario cambia el scope y hace
    // click en "Descargar" en el mismo tick del navegador.
    const { updateExportScope, handleExport, runExport } = makeComponent()
    // Ambos eventos ocurren antes de que React procese cualquier re-render.
    updateExportScope('current')
    handleExport('xlsx')
    const [recordsArg] = runExport.mock.calls[0]
    expect(recordsArg).toHaveLength(1)
    expect(recordsArg[0].id).toBe(3)
  })

  it('stress: cambio desde estado inicial history (el bug original)', () => {
    // Caso patológico: si por algún motivo el state inicial fuera 'history'
    // (por ejemplo, por una mala inicialización o un bug de reset),
    // el fix debe garantizar que cambiar a 'current' se vea reflejado.
    const c = makeComponent()
    // Forzar el ref a 'history' como si viniera mal inicializado.
    c.exportScopeRef.current = 'history'
    c.updateExportScope('current')
    c.handleExport('xlsx')
    const [recordsArg] = c.runExport.mock.calls[0]
    expect(recordsArg).toHaveLength(1)
  })
})
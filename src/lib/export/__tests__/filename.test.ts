import { describe, expect, it } from 'vitest'
import { buildExportFilename, formatDateStamp } from '../filename'
import type { ExportClientHeader } from '../serialize'

function makeClient(overrides: Partial<ExportClientHeader> = {}): ExportClientHeader {
  return {
    firstName: 'María',
    lastName1: 'García',
    lastName2: 'López',
    birthDate: '1990-01-01',
    age: 35,
    gender: 'F',
    heightCm: 165,
    wristContexture: 'normal',
    ...overrides,
  }
}

describe('formatDateStamp', () => {
  it('formatea YYYY-MM-DD_HHmm con padding a 2 dígitos', () => {
    const d = new Date(2026, 6, 1, 9, 5) // 1 jul 2026 09:05
    expect(formatDateStamp(d)).toBe('2026-07-01_0905')
  })

  it('rellena con ceros a la izquierda', () => {
    const d = new Date(2026, 0, 3, 0, 0) // 3 ene 2026 00:00
    expect(formatDateStamp(d)).toBe('2026-01-03_0000')
  })
})

describe('buildExportFilename', () => {
  it('concatena nombre y apellido sin espacios', () => {
    const d = new Date(2026, 6, 1, 14, 30)
    const name = buildExportFilename(makeClient(), d, 'xlsx')
    expect(name).toBe('MariaGarciaLopez_2026-07-01_1430.xlsx')
  })

  it('elimina acentos', () => {
    const d = new Date(2026, 6, 1, 14, 30)
    const name = buildExportFilename(
      makeClient({ firstName: 'Ángela', lastName1: 'Núñez' }),
      d,
      'pdf',
    )
    expect(name).toBe('AngelaNunezLopez_2026-07-01_1430.pdf')
  })

  it('omite segmentos vacíos', () => {
    const d = new Date(2026, 6, 1, 14, 30)
    const name = buildExportFilename(
      makeClient({ lastName2: '  ' }),
      d,
      'xlsx',
    )
    expect(name).toBe('MariaGarcia_2026-07-01_1430.xlsx')
  })

  it('usa "cliente" como fallback si no hay nombre', () => {
    const d = new Date(2026, 6, 1, 14, 30)
    const name = buildExportFilename(
      makeClient({ firstName: '', lastName1: '', lastName2: '' }),
      d,
      'xlsx',
    )
    expect(name).toBe('cliente_2026-07-01_1430.xlsx')
  })

  it('respeta la extensión solicitada', () => {
    const d = new Date(2026, 6, 1, 14, 30)
    expect(buildExportFilename(makeClient(), d, 'xlsx')).toMatch(/\.xlsx$/)
    expect(buildExportFilename(makeClient(), d, 'pdf')).toMatch(/\.pdf$/)
  })
})

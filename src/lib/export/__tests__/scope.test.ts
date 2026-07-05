import { describe, expect, it } from 'vitest'
import { pickRecordsForScope } from '../scope'
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

describe('pickRecordsForScope', () => {
  const records: Record[] = [
    makeRecord(3, 73),
    makeRecord(2, 72),
    makeRecord(1, 71),
  ]

  it("scope='history' devuelve todos los records sin filtrar", () => {
    const result = pickRecordsForScope(records, 'history', 3)
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.id)).toEqual([3, 2, 1])
  })

  it("scope='current' devuelve solo el record con id === currentRecordId", () => {
    const result = pickRecordsForScope(records, 'current', 2)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
  })

  it("scope='current' devuelve el primer record cuando currentRecordId es el más reciente", () => {
    const result = pickRecordsForScope(records, 'current', 3)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(3)
  })

  it("scope='current' devuelve [] si currentRecordId no está en el array", () => {
    const result = pickRecordsForScope(records, 'current', 999)
    expect(result).toEqual([])
  })

  it('no muta el array de entrada', () => {
    const before = [...records]
    pickRecordsForScope(records, 'history', 3)
    pickRecordsForScope(records, 'current', 2)
    expect(records).toEqual(before)
  })

  it('devuelve [] para ambos scopes si records está vacío', () => {
    expect(pickRecordsForScope([], 'current', 1)).toEqual([])
    expect(pickRecordsForScope([], 'history', 1)).toEqual([])
  })
})
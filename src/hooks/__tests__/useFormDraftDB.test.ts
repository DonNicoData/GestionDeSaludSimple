import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/schema'
import {
  DRAFT_KEY_BASIC,
  DRAFT_KEY_METRICS,
  clearDraftByKey,
  hasAnyDraft,
  readDraftForTest,
  writeDraftForTest,
} from '@/hooks/useFormDraftDB'
import { clearAllData } from '../../db/repo'

/**
 * P0-1: invariante "work preservation".
 *
 * El draft de datos básicos NO se borra al submitear del BasicDataForm.
 * Solo se borra cuando el record se persiste OK (en handleResultsSaved).
 *
 * Esta política es la que evita el bug detectado en validación manual:
 * "Voy a métricas → vuelvo → datos básicos están vacíos".
 */
describe('Work preservation — drafts sobreviven al submit', () => {
  beforeEach(async () => {
    await clearAllData()
  })

  it('writeDraftForTest persiste un draft en IndexedDB', async () => {
    await writeDraftForTest(DRAFT_KEY_BASIC, {
      firstName: 'Juan',
      lastName1: 'Pérez',
      lastName2: 'González',
      birthDate: '1990-05-15',
      heightCm: '175',
      gender: undefined,
      wristContexture: undefined,
    })
    expect(await hasAnyDraft()).toBe(true)
    const read = await readDraftForTest<unknown>(DRAFT_KEY_BASIC)
    expect(read).toMatchObject({ firstName: 'Juan' })
  })

  it('readDraftForTest devuelve null si no hay draft', async () => {
    const read = await readDraftForTest(DRAFT_KEY_BASIC)
    expect(read).toBeNull()
  })

  it('clearDraftByKey borra SOLO la key indicada, no las otras', async () => {
    await writeDraftForTest(DRAFT_KEY_BASIC, { x: 1 })
    await writeDraftForTest(DRAFT_KEY_METRICS, { y: 2 })

    await clearDraftByKey(DRAFT_KEY_BASIC)

    expect(await readDraftForTest(DRAFT_KEY_BASIC)).toBeNull()
    expect(await readDraftForTest(DRAFT_KEY_METRICS)).toEqual({ y: 2 })
  })

  it('drafts de Basic y Metrics coexisten (no se sobrescriben entre sí)', async () => {
    await writeDraftForTest(DRAFT_KEY_BASIC, { stage: 'basic' })
    await writeDraftForTest(DRAFT_KEY_METRICS, { stage: 'metrics' })

    expect(await readDraftForTest(DRAFT_KEY_BASIC)).toEqual({ stage: 'basic' })
    expect(await readDraftForTest(DRAFT_KEY_METRICS)).toEqual({ stage: 'metrics' })
  })

  it('clearAllData (incluyendo drafts) limpia ambos', async () => {
    await writeDraftForTest(DRAFT_KEY_BASIC, { x: 1 })
    await writeDraftForTest(DRAFT_KEY_METRICS, { y: 2 })

    await clearAllData()

    expect(await readDraftForTest(DRAFT_KEY_BASIC)).toBeNull()
    expect(await readDraftForTest(DRAFT_KEY_METRICS)).toBeNull()
    expect(await hasAnyDraft()).toBe(false)
  })

  it('esquema IndexedDB incluye la tabla drafts (regression check)', async () => {
    // Si alguien borra la tabla del schema, este test rompe.
    expect(db.drafts).toBeDefined()
    await writeDraftForTest(DRAFT_KEY_BASIC, { smoke: true })
    const all = await db.drafts.toArray()
    expect(all.length).toBeGreaterThan(0)
  })
})
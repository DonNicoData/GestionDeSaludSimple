import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearAllData,
  createClient,
  deleteClient,
  deleteRecord,
  findClientMatch,
  getAdminStats,
  getClient,
  getClientSnapshot,
  getLastRecordForClient,
  getLatestRecord,
  getLatestRecordContext,
  getRecordsForClient,
  listAllClients,
  restoreClientSnapshot,
  saveRecord,
  updateClient,
  updateRecord,
} from '../repo'

function basicInput(
  overrides: Partial<Parameters<typeof createClient>[0]> = {},
): Parameters<typeof createClient>[0] {
  return {
    firstName: 'Juan',
    lastName1: 'Pérez',
    lastName2: 'González',
    birthDate: '1990-05-15',
    age: 35,
    gender: 'M',
    heightCm: 175,
    wristContexture: 'normal',
    ...overrides,
  }
}

function recordInput(
  overrides: Partial<Parameters<typeof saveRecord>[1]> = {},
): Parameters<typeof saveRecord>[1] {
  return {
    weight: 72,
    bmi: 23.5,
    bodyFatPct: 18,
    muscleMassPct: 40,
    calories: 2000,
    bioAge: 30,
    visceralFat: 8,
    ...overrides,
  }
}

beforeEach(async () => {
  await clearAllData()
})

describe('createClient / getClient', () => {
  it('crea un cliente con normalizedName derivado y devuelve id', async () => {
    const id = await createClient(basicInput())
    expect(typeof id).toBe('number')

    const fetched = await getClient(id)
    expect(fetched).toBeDefined()
    expect(fetched?.firstName).toBe('Juan')
    expect(fetched?.normalizedName).toBe('juan perez gonzalez')
  })

  it('normaliza acentos y mayúsculas al guardar', async () => {
    const id = await createClient(
      basicInput({
        firstName: 'María',
        lastName1: 'ÁLVAREZ',
        lastName2: 'Nuñez',
      }),
    )
    const fetched = await getClient(id)
    // La ñ se normaliza a n (NFD + strip diacríticos); 'ñ' ≡ 'n' para matching.
    expect(fetched?.normalizedName).toBe('maria alvarez nunez')
  })
})

describe('findClientMatch — niveles de coincidencia', () => {
  it('devuelve "none" cuando no hay clientes', async () => {
    const result = await findClientMatch(basicInput())
    expect(result.level).toBe('none')
    expect(result.client).toBeUndefined()
    expect(result.candidates).toBeUndefined()
  })

  it('devuelve "high" cuando los 3 campos coinciden', async () => {
    const id = await createClient(basicInput())
    const result = await findClientMatch(basicInput())
    expect(result.level).toBe('high')
    expect(result.client?.id).toBe(id)
  })

  it('devuelve "high" incluso con diferencias de mayúsculas/tildes', async () => {
    await createClient(
      basicInput({ firstName: 'María', lastName1: 'ÁLVAREZ' }),
    )
    const result = await findClientMatch(
      basicInput({ firstName: 'maria', lastName1: 'alvarez' }),
    )
    expect(result.level).toBe('high')
  })

  it('devuelve "partial" cuando coincide nombre + fecha (altura distinta)', async () => {
    await createClient(basicInput({ heightCm: 170 }))
    const result = await findClientMatch(basicInput({ heightCm: 178 }))
    expect(result.level).toBe('partial')
    expect(result.candidates?.length).toBe(1)
  })

  it('devuelve "partial" cuando coincide nombre + altura (fecha distinta)', async () => {
    await createClient(basicInput({ birthDate: '1990-05-15' }))
    const result = await findClientMatch(basicInput({ birthDate: '1991-08-20' }))
    expect(result.level).toBe('partial')
  })

  it('devuelve "none" cuando solo coincide el nombre (1 de 3)', async () => {
    await createClient(
      basicInput({ birthDate: '1990-05-15', heightCm: 170 }),
    )
    const result = await findClientMatch(
      basicInput({ birthDate: '1985-03-10', heightCm: 165 }),
    )
    expect(result.level).toBe('none')
  })

  it('NO hace match con nombre distinto aunque fecha y altura coincidan', async () => {
    await createClient(
      basicInput({ firstName: 'Juan', birthDate: '1990-05-15', heightCm: 175 }),
    )
    const result = await findClientMatch(
      basicInput({ firstName: 'Pedro', birthDate: '1990-05-15', heightCm: 175 }),
    )
    expect(result.level).toBe('none')
  })
})

describe('saveRecord / getRecordsForClient', () => {
  it('asocia un record al clientId correcto y lo devuelve ordenado desc', async () => {
    const clientId = await createClient(basicInput())
    await saveRecord(clientId, recordInput({ weight: 70 }))
    await new Promise((r) => setTimeout(r, 5))
    await saveRecord(clientId, recordInput({ weight: 72 }))
    await new Promise((r) => setTimeout(r, 5))
    await saveRecord(clientId, recordInput({ weight: 74 }))

    const records = await getRecordsForClient(clientId)
    expect(records).toHaveLength(3)
    expect(records[0]?.weight).toBe(74)
    expect(records[1]?.weight).toBe(72)
    expect(records[2]?.weight).toBe(70)
  })

  it('getLastRecordForClient devuelve el más reciente', async () => {
    const clientId = await createClient(basicInput())
    await saveRecord(clientId, recordInput({ weight: 70 }))
    await new Promise((r) => setTimeout(r, 5))
    await saveRecord(clientId, recordInput({ weight: 72 }))

    const last = await getLastRecordForClient(clientId)
    expect(last?.weight).toBe(72)
  })

  it('getLatestRecord devuelve el último de TODOS los clientes', async () => {
    const c1 = await createClient(basicInput({ firstName: 'Ana' }))
    const c2 = await createClient(basicInput({ firstName: 'Beto' }))
    await saveRecord(c1, recordInput({ weight: 60 }))
    await new Promise((r) => setTimeout(r, 5))
    await saveRecord(c2, recordInput({ weight: 80 }))

    const last = await getLatestRecord()
    expect(last?.weight).toBe(80)
    expect(last?.clientId).toBe(c2)
  })

  // P2-2: getLatestRecordContext — hidrata activeClientName en mount.
  describe('getLatestRecordContext', () => {
    it('devuelve record + cliente asociado en una sola llamada', async () => {
      const id = await createClient(
        basicInput({ firstName: 'María' }),
      )
      await saveRecord(id, recordInput())
      const ctx = await getLatestRecordContext()
      expect(ctx).toBeDefined()
      expect(ctx?.client.id).toBe(id)
      expect(ctx?.client.firstName).toBe('María')
      expect(ctx?.record.clientId).toBe(id)
    })

    it('devuelve undefined cuando no hay records', async () => {
      expect(await getLatestRecordContext()).toBeUndefined()
    })

    it('puede resolver el cliente aunque haya varios clientes con records', async () => {
      const c1 = await createClient(basicInput({ firstName: 'Ana' }))
      const c2 = await createClient(basicInput({ firstName: 'Beto' }))
      await saveRecord(c1, recordInput({ weight: 60 }))
      await new Promise((r) => setTimeout(r, 5))
      await saveRecord(c2, recordInput({ weight: 80 }))

      const ctx = await getLatestRecordContext()
      expect(ctx?.client.id).toBe(c2)
      expect(ctx?.client.firstName).toBe('Beto')
    })
  })
})

describe('listAllClients', () => {
  it('lista clientes ordenados por createdAt desc', async () => {
    await createClient(basicInput({ firstName: 'Primero' }))
    await new Promise((r) => setTimeout(r, 5))
    await createClient(basicInput({ firstName: 'Segundo' }))

    const all = await listAllClients()
    expect(all.length).toBeGreaterThanOrEqual(2)
    expect(all[0]?.firstName).toBe('Segundo')
  })
})

describe('deleteClient', () => {
  it('elimina cliente y todos sus records (cascade)', async () => {
    const id = await createClient(basicInput())
    await saveRecord(id, recordInput())
    await saveRecord(id, recordInput({ weight: 75 }))

    expect((await getRecordsForClient(id)).length).toBe(2)

    await deleteClient(id)
    expect(await getClient(id)).toBeUndefined()
    expect((await getRecordsForClient(id)).length).toBe(0)
  })
})

describe('clearAllData', () => {
  it('limpia clientes, records y drafts', async () => {
    const id = await createClient(basicInput())
    await saveRecord(id, recordInput())

    await clearAllData()

    expect(await listAllClients()).toEqual([])
    expect(await getRecordsForClient(id)).toEqual([])
  })

  it('es idempotente (se puede llamar sin datos)', async () => {
    await clearAllData()
    await clearAllData()
    expect(await listAllClients()).toEqual([])
  })
})

describe('Fase 8 — admin: updateClient / updateRecord / deleteRecord / snapshot / stats', () => {
  describe('updateClient', () => {
    it('actualiza campos y re-deriva normalizedName', async () => {
      const id = await createClient(basicInput())
      await updateClient(id, {
        firstName: 'Juan',
        lastName1: 'Pérez',
        lastName2: 'Gómez',
        birthDate: '1990-05-15',
        gender: 'M',
        heightCm: 180,
        wristContexture: 'thick',
      })
      const after = await getClient(id)
      expect(after?.lastName2).toBe('Gómez')
      expect(after?.heightCm).toBe(180)
      expect(after?.wristContexture).toBe('thick')
      expect(after?.normalizedName).toBe('juan perez gomez')
    })

    it('re-deriva age desde el nuevo birthDate', async () => {
      const id = await createClient(basicInput({ birthDate: '1990-05-15', age: 35 }))
      await updateClient(id, {
        firstName: 'Juan',
        lastName1: 'Pérez',
        lastName2: 'González',
        birthDate: '1985-03-10',
        gender: 'M',
        heightCm: 175,
        wristContexture: 'normal',
      })
      const after = await getClient(id)
      expect(after?.birthDate).toBe('1985-03-10')
      // age se recalcula; assert de cambio (no valor exacto, depende del día)
      expect(after?.age).not.toBe(35)
    })
  })

  describe('updateRecord', () => {
    it('actualiza los valores de la medición preservando id y clientId', async () => {
      const clientId = await createClient(basicInput())
      const recordId = await saveRecord(clientId, recordInput({ weight: 70 }))
      await updateRecord(recordId, { ...recordInput(), weight: 85, notes: 'post-vacaciones' })
      const after = await getClientSnapshot(clientId)
      expect(after?.records[0]?.weight).toBe(85)
      expect(after?.records[0]?.notes).toBe('post-vacaciones')
      expect(after?.records[0]?.id).toBe(recordId)
      expect(after?.records[0]?.clientId).toBe(clientId)
    })
  })

  describe('deleteRecord', () => {
    it('elimina SOLO el record indicado, sin tocar otros del mismo cliente', async () => {
      const clientId = await createClient(basicInput())
      const r1 = await saveRecord(clientId, recordInput({ weight: 70 }))
      const r2 = await saveRecord(clientId, recordInput({ weight: 72 }))
      const r3 = await saveRecord(clientId, recordInput({ weight: 74 }))

      await deleteRecord(r2)

      const records = await getRecordsForClient(clientId)
      expect(records.map((r) => r.id)).toEqual([r3, r1])
    })
  })

  describe('snapshot / restore', () => {
    it('getClientSnapshot devuelve cliente + records', async () => {
      const clientId = await createClient(basicInput())
      await saveRecord(clientId, recordInput())
      await saveRecord(clientId, recordInput({ weight: 75 }))

      const snap = await getClientSnapshot(clientId)
      expect(snap?.client.id).toBe(clientId)
      expect(snap?.records).toHaveLength(2)
    })

    it('restoreClientSnapshot recrea cliente + records', async () => {
      const clientId = await createClient(basicInput({ firstName: 'Ana' }))
      const r1 = await saveRecord(clientId, recordInput())
      const snap = await getClientSnapshot(clientId)

      // Borramos todo del cliente original.
      await deleteClient(clientId)
      expect(await getClient(clientId)).toBeUndefined()

      // Restauramos.
      const newId = await restoreClientSnapshot(snap!)
      expect(newId).not.toBe(clientId)
      const restored = await getClient(newId)
      expect(restored?.firstName).toBe('Ana')
      const records = await getRecordsForClient(newId)
      expect(records).toHaveLength(1)
      expect(records[0]?.id).not.toBe(r1)
    })
  })

  describe('getAdminStats', () => {
    it('cuenta clientes y records y devuelve la fecha del último', async () => {
      expect(await getAdminStats()).toEqual({
        clientCount: 0,
        recordCount: 0,
        lastRecordAt: null,
      })

      const c1 = await createClient(basicInput({ firstName: 'Ana' }))
      const c2 = await createClient(basicInput({ firstName: 'Beto' }))
      await saveRecord(c1, recordInput())
      await new Promise((r) => setTimeout(r, 5))
      await saveRecord(c2, recordInput())
      await new Promise((r) => setTimeout(r, 5))
      await saveRecord(c2, recordInput())

      const stats = await getAdminStats()
      expect(stats.clientCount).toBe(2)
      expect(stats.recordCount).toBe(3)
      expect(stats.lastRecordAt).toBeInstanceOf(Date)
    })
  })
})
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearAllData,
  createClient,
  deleteClient,
  findClientMatch,
  getClient,
  getLastRecordForClient,
  getLatestRecord,
  getLatestRecordContext,
  getRecordsForClient,
  listAllClients,
  saveRecord,
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
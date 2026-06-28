import { db, initSchema } from '@/db/schema'
import { combineName, normalizeName } from '@/lib/name'
import type { Client, Record } from '@/types'

/**
 * Resultado de buscar un cliente por la tripleta identidad.
 * PLAN §5: (nombre normalizado, fechaNacimiento ISO, altura cm).
 */
export type ClientMatchLevel = 'high' | 'partial' | 'none'

export interface ClientMatch {
  level: ClientMatchLevel
  /** Cliente exacto cuando level === 'high'. */
  client?: Client
  /** Coincidencias parciales cuando level === 'partial' (2 de 3 campos). */
  candidates?: Client[]
}

export interface CreateClientInput {
  firstName: string
  lastName1: string
  lastName2: string
  birthDate: string
  age: number
  gender: Client['gender']
  heightCm: number
  wristContexture: Client['wristContexture']
}

export interface CreateRecordInput {
  weight: number
  bmi: number
  bodyFatPct: number
  muscleMassPct: number
  calories: number
  bioAge: number
  visceralFat: number
  notes?: string
}

let initPromise: Promise<void> | null = null

/**
 * Asegura que el schema esté inicializado antes de la primera operación.
 * Llamar al inicio de cada función pública evita errores en arranque en frío.
 */
function ensureReady(): Promise<void> {
  if (!initPromise) {
    initPromise = initSchema().catch((err) => {
      // Si falla la inicialización, resetear el promise para reintentar.
      initPromise = null
      throw err
    })
  }
  return initPromise
}

export async function findClientMatch(input: CreateClientInput): Promise<ClientMatch> {
  await ensureReady()

  const normalized = normalizeName(
    combineName(input.firstName, input.lastName1, input.lastName2),
  )

  // Candidatos por nombre normalizado (case + acentos insensitive).
  const byName = await db.clients.where('normalizedName').equals(normalized).toArray()

  // Match alto: los 3 campos idénticos.
  const exact = byName.find(
    (c) => c.birthDate === input.birthDate && c.heightCm === input.heightCm,
  )
  if (exact) {
    return { level: 'high', client: exact }
  }

  // Match parcial: nombre coincide Y (fechaNacimiento O altura coincide).
  const partial = byName.filter((c) => {
    const sameBirth = c.birthDate === input.birthDate
    const sameHeight = c.heightCm === input.heightCm
    return sameBirth || sameHeight
  })
  if (partial.length > 0) {
    return { level: 'partial', candidates: partial }
  }

  return { level: 'none' }
}

export async function createClient(input: CreateClientInput): Promise<number> {
  await ensureReady()

  const normalized = normalizeName(
    combineName(input.firstName, input.lastName1, input.lastName2),
  )

  const id = await db.clients.add({
    firstName: input.firstName,
    lastName1: input.lastName1,
    lastName2: input.lastName2,
    normalizedName: normalized,
    birthDate: input.birthDate,
    age: input.age,
    gender: input.gender,
    heightCm: input.heightCm,
    wristContexture: input.wristContexture,
    createdAt: new Date(),
  })

  return id as number
}

export async function getClient(id: number): Promise<Client | undefined> {
  await ensureReady()
  return db.clients.get(id)
}

export async function listAllClients(): Promise<Client[]> {
  await ensureReady()
  return db.clients.orderBy('createdAt').reverse().toArray()
}

export async function saveRecord(
  clientId: number,
  input: CreateRecordInput,
): Promise<number> {
  await ensureReady()

  const id = await db.records.add({
    clientId,
    date: new Date(),
    weight: input.weight,
    bmi: input.bmi,
    bodyFatPct: input.bodyFatPct,
    muscleMassPct: input.muscleMassPct,
    calories: input.calories,
    bioAge: input.bioAge,
    visceralFat: input.visceralFat,
    notes: input.notes,
  })

  return id as number
}

export async function getRecordsForClient(clientId: number): Promise<Record[]> {
  await ensureReady()
  return db.records.where('clientId').equals(clientId).reverse().sortBy('date')
}

export async function getLastRecordForClient(clientId: number): Promise<Record | undefined> {
  await ensureReady()
  const list = await db.records.where('clientId').equals(clientId).reverse().sortBy('date')
  return list[0]
}

export async function getLatestRecord(): Promise<Record | undefined> {
  await ensureReady()
  const list = await db.records.orderBy('date').reverse().toArray()
  return list[0]
}

export interface LatestRecordContext {
  record: Record
  client: Client
}

/**
 * Devuelve el último record + su cliente asociado en una sola llamada.
 * Usado por App.tsx para hidratar activeClientName en el montaje y poder
 * mostrar el saludo personalizado desde la primera visita con datos.
 */
export async function getLatestRecordContext(): Promise<LatestRecordContext | undefined> {
  await ensureReady()
  const record = await getLatestRecord()
  if (!record) return undefined
  const client = await db.clients.get(record.clientId)
  if (!client) return undefined
  return { record, client }
}

export async function deleteRecord(id: number): Promise<void> {
  await ensureReady()
  await db.records.delete(id)
}

export async function deleteClient(id: number): Promise<void> {
  await ensureReady()
  await db.transaction('rw', db.clients, db.records, async () => {
    await db.records.where('clientId').equals(id).delete()
    await db.clients.delete(id)
  })
}

export async function clearAllData(): Promise<void> {
  await ensureReady()
  await db.transaction('rw', db.clients, db.records, db.drafts, db.meta, async () => {
    await db.clients.clear()
    await db.records.clear()
    await db.drafts.clear()
    await db.meta.clear()
  })
  // Re-sembrar la versión de schema después del wipe.
  initPromise = null
  await ensureReady()
}
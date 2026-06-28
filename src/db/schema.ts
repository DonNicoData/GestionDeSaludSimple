import Dexie, { type Table } from 'dexie'
import type { Client, Record } from '@/types'

/**
 * Schema versionado de la base de datos local (IndexedDB vía Dexie).
 *
 * Convenciones:
 * - Las claves primarias autoincrementales usan `++id`.
 * - Los índices secundarios se definen como strings separados por coma.
 * - Cualquier cambio incompatible con datos existentes requiere subir
 *   `db.version(N)` y agregar un upgrade callback. La tabla `meta`
 *   almacena `schemaVersion` para auditoría/migraciones futuras.
 *
 * Tablas:
 * - `clients`: ficha de cada persona. La identidad se define por la tripleta
 *   (normalizedName, birthDate, heightCm) — PLAN §5. Se indexa por
 *   `normalizedName` para acelerar el matching.
 * - `records`: cada medición en el tiempo. Se indexa por `clientId` (FK) y
 *   por `[clientId+date]` para resolver "último registro del cliente" en O(1).
 * - `meta`: settings internos. Hoy solo `schemaVersion`. Se reserva para
 *   preferencias futuras (ej. idioma persistido, último cliente activo).
 * - `drafts`: borradores de formularios (basic, metrics). Persisten entre
 *   sesiones gracias a IndexedDB — mejora clave sobre el sessionStorage
 *   de Fase 2.
 */
export interface MetaEntry {
  key: string
  value: unknown
}

export interface DraftEntry {
  key: string
  value: unknown
  updatedAt: Date
}

export class SaludDB extends Dexie {
  clients!: Table<Client, number>
  records!: Table<Record, number>
  meta!: Table<MetaEntry, string>
  drafts!: Table<DraftEntry, string>

  constructor() {
    super('salud_db')
    this.version(1).stores({
      clients: '++id, normalizedName, birthDate, heightCm, createdAt',
      records: '++id, clientId, date, [clientId+date]',
      meta: 'key',
      drafts: 'key, updatedAt',
    })
  }
}

export const db = new SaludDB()

const SCHEMA_VERSION = 1

/**
 * Inicializa la DB: registra la versión de schema en `meta`.
 * Es idempotente: si la versión coincide, no hace nada.
 */
export async function initSchema(): Promise<void> {
  const existing = await db.meta.get('schemaVersion')
  if (existing?.value === SCHEMA_VERSION) return
  await db.meta.put({ key: 'schemaVersion', value: SCHEMA_VERSION })
}
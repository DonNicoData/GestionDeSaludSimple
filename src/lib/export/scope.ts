/**
 * Filtra el conjunto de records de un cliente según el alcance de export
 * seleccionado por el usuario:
 *
 * - 'current'  → solo el record recién guardado (id === currentRecordId).
 * - 'history'  → todos los records del cliente.
 *
 * Helper puro (sin acceso a i18n ni a Dexie) para poder testearlo sin
 * contexto de UI. No muta el array de entrada.
 */
import type { Record } from '@/types'

export type ExportScope = 'current' | 'history'

export function pickRecordsForScope(
  records: Record[],
  scope: ExportScope,
  currentRecordId: number,
): Record[] {
  if (scope === 'history') {
    return records
  }
  const found = records.find((r) => r.id === currentRecordId)
  return found ? [found] : []
}
/**
 * Exporta un payload a un archivo Excel (.xlsx) y dispara la descarga.
 *
 * Estructura del libro:
 * - Hoja 1 "Cliente": datos básicos del cliente.
 * - Hojas siguientes "Medición YYYY-MM-DD HH:MM": una por registro, con
 *   las 7 métricas en filas (Métrica | Valor | Unidad | Rango ideal | Estado).
 *
 * La generación es local (sin red): XLSX escribe un Blob y se descarga
 * con un ancla temporal.
 */
import * as XLSX from 'xlsx'
import type { ExportPayload, ExportClientHeader } from './serialize'
import { buildExportFilename } from './filename'

export interface ExcelExportInput {
  client: ExportClientHeader
  payload: ExportPayload
}

export function exportToExcel({ client, payload }: ExcelExportInput): void {
  const wb = XLSX.utils.book_new()

  // Hoja 1: datos del cliente.
  const wsClient = XLSX.utils.aoa_to_sheet([
    [payload.titles.client],
    [payload.header.fullName],
    [],
    [
      `${payload.header.birthDate}  (${payload.header.age})`,
      payload.header.gender,
      `${payload.header.heightCm} cm`,
      payload.header.wristContexture,
    ],
  ])
  wsClient['!cols'] = [{ wch: 32 }, { wch: 16 }, { wch: 16 }, { wch: 24 }]
  XLSX.utils.book_append_sheet(wb, wsClient, payload.titles.client.slice(0, 31) || 'Cliente')

  // Hojas de mediciones.
  payload.sections.forEach((section, idx) => {
    const rows: (string | number)[][] = [
      [section.title],
      [section.date.toISOString().slice(0, 16).replace('T', ' ')],
      [],
      [
        payload.columnHeaders.metric,
        payload.columnHeaders.value,
        payload.columnHeaders.unit,
        payload.columnHeaders.idealRange,
        payload.columnHeaders.status,
      ],
      ...section.rows.map((r) => [r.metric, r.value, r.unit, r.idealRange, r.status]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 10 }, { wch: 24 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, ws, sheetNameFor(section.date, idx))
  })

  const filename = buildExportFilename(client, payload.generatedAt, 'xlsx')
  XLSX.writeFile(wb, filename)
}

function sheetNameFor(date: Date, idx: number): string {
  const stamp = date.toISOString().slice(0, 16).replace('T', ' ')
  const name = `Medición ${stamp}`.slice(0, 31)
  return name || `Medición ${idx + 1}`
}

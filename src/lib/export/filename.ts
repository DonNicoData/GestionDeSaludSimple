/**
 * Construye el nombre de archivo para un export Excel o PDF.
 * Formato: `NombreApellido_YYYY-MM-DD_HHmm.xlsx` (o `.pdf`).
 *
 * Sin acentos ni espacios para máxima compatibilidad con exploradores
 * y sistemas de archivos. Si la medición cae en dos nombres (poco común),
 * se concatenan.
 */
import type { ExportClientHeader } from './serialize'

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatDateStamp(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
}

export function buildExportFilename(
  client: ExportClientHeader,
  date: Date,
  ext: 'xlsx' | 'pdf',
): string {
  const rawName = [client.firstName, client.lastName1, client.lastName2]
    .map((s) => s.trim())
    .filter(Boolean)
    .join('')
  const safeName = stripAccents(rawName) || 'cliente'
  return `${safeName}_${formatDateStamp(date)}.${ext}`
}

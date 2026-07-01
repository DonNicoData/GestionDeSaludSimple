/**
 * Exporta un payload a un PDF A4 y dispara la descarga.
 *
 * Estructura del PDF:
 * - Encabezado: título + nombre del cliente.
 * - Bloque de datos del cliente (fecha nac., edad, género, altura, contextura).
 * - Una sección por medición: título con la fecha + tabla con las 7 métricas
 *   en filas (Métrica | Valor | Unidad | Rango ideal | Estado).
 *   La celda "Estado" se colorea según el semáforo (verde / ámbar / coral).
 * - Pie: "Generado el ..."
 */
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CellHookData } from 'jspdf-autotable'
import type { ExportPayload, ExportClientHeader, ExportRow } from './serialize'
import { buildExportFilename } from './filename'

export interface PdfExportInput {
  client: ExportClientHeader
  payload: ExportPayload
  /** Color hexadecimal (sin #) para el status 'normal'. Default verde suave. */
  normalColor?: string
  warningColor?: string
  alertColor?: string
}

const DEFAULT_COLORS = {
  normal: 'dcfce7',  // green-100
  warning: 'fef3c7', // amber-100
  alert: 'fee2e2',   // red-100
}

export function exportToPdf({
  client,
  payload,
  normalColor = DEFAULT_COLORS.normal,
  warningColor = DEFAULT_COLORS.warning,
  alertColor = DEFAULT_COLORS.alert,
}: PdfExportInput): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 40
  let cursorY = 50

  // Encabezado
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(payload.titles.client, marginX, cursorY)
  cursorY += 22

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(payload.header.fullName, marginX, cursorY)
  cursorY += 18

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const meta = [
    `${payload.header.birthDate}  (${payload.header.age})`,
    payload.header.gender,
    `${payload.header.heightCm} cm`,
    payload.header.wristContexture,
  ]
  doc.text(meta.join('   ·   '), marginX, cursorY, { maxWidth: pageWidth - marginX * 2 })
  cursorY += 24

  // Mediciones
  payload.sections.forEach((section, idx) => {
    if (idx > 0) cursorY += 16

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    const dateText = section.date.toISOString().slice(0, 16).replace('T', ' ')
    doc.text(`${section.title} — ${dateText}`, marginX, cursorY)
    cursorY += 6

    autoTable(doc, {
      startY: cursorY + 4,
      margin: { left: marginX, right: marginX },
      head: [
        [
          payload.columnHeaders.metric,
          payload.columnHeaders.value,
          payload.columnHeaders.unit,
          payload.columnHeaders.idealRange,
          payload.columnHeaders.status,
        ],
      ],
      body: section.rows.map((r) => [r.metric, r.value, r.unit, r.idealRange, r.status]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [240, 253, 244], textColor: 30, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 55 },
        3: { cellWidth: 110 },
        4: { cellWidth: 'auto', fontStyle: 'bold' },
      },
      didParseCell: (data: CellHookData) => {
        if (data.section === 'body' && data.column.index === 4) {
          const row = section.rows[data.row.index] as ExportRow | undefined
          if (!row) return
          const color =
            row.statusKey === 'alert'
              ? alertColor
              : row.statusKey === 'warning'
                ? warningColor
                : normalColor
          data.cell.styles.fillColor = hexToRgb(color)
        }
      },
    })

    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
    cursorY = finalY ?? cursorY + 80
  })

  // Pie
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text(payload.titles.generatedAt, marginX, pageHeight - 24)
  doc.setTextColor(0)

  const filename = buildExportFilename(client, payload.generatedAt, 'pdf')
  doc.save(filename)
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return [r, g, b]
}

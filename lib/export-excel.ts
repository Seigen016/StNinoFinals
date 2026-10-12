/**
 * Shared Excel export utility — wraps ExcelJS so every page
 * calls one function instead of duplicating boilerplate.
 *
 * Dynamically imports ExcelJS to keep it out of the initial bundle
 * (client-side only; never call from a server component/route).
 */

const BLUE  = 'FF1E3A8A'
const RED   = 'FF991B1B'
const GRAY  = 'FFE5E7EB'
const WHITE = 'FFFFFFFF'
const DARK  = 'FF111827'
const MUTED = 'FF6B7280'

export type CellValue = string | number | null | undefined

export interface ExcelSheet {
  /** Worksheet tab name */
  name?: string
  /** Optional document header lines printed above the table (school name, report title…) */
  title?: string[]
  /** Column header labels */
  columns: string[]
  /** Data rows */
  rows: CellValue[][]
  /** Optional bold footer row (e.g. totals) */
  totalRow?: CellValue[]
  /** Per-column widths in character units — defaults to 22 */
  colWidths?: number[]
  /** Header fill colour (ARGB). Defaults to dark blue. Use RED for school-branded reports. */
  headerColor?: 'blue' | 'red'
}

/** Download a styled .xlsx file. Accepts one sheet or an array of sheets. */
export async function downloadExcel(
  filename: string,
  input: ExcelSheet | ExcelSheet[]
): Promise<void> {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()

  const sheets = Array.isArray(input) ? input : [input]

  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name || 'Report')
    const colCount = sheet.columns.length
    const fillArgb = sheet.headerColor === 'red' ? RED : BLUE

    // Column widths
    sheet.columns.forEach((_, i) => {
      ws.getColumn(i + 1).width = sheet.colWidths?.[i] ?? 22
    })

    let r = 1

    // Title block
    if (sheet.title?.length) {
      for (let li = 0; li < sheet.title.length; li++) {
        ws.mergeCells(r, 1, r, colCount)
        const cell = ws.getCell(r, 1)
        cell.value = sheet.title[li]
        cell.font = {
          name: 'Calibri',
          bold: li === 0,
          size: li === 0 ? 13 : li === 1 ? 11 : 9,
          color: { argb: li >= 2 ? MUTED : DARK },
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        ws.getRow(r).height = li === 0 ? 22 : li === 1 ? 18 : 14
        r++
      }
      ws.getRow(r).height = 6 // spacer
      r++
    }

    // Column header row
    const hRow = ws.getRow(r)
    hRow.height = 20
    sheet.columns.forEach((label, i) => {
      const cell = hRow.getCell(i + 1)
      cell.value = label
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } }
      cell.font = { bold: true, color: { argb: WHITE }, name: 'Calibri', size: 10 }
      cell.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle' }
    })
    r++

    // Data rows
    for (const rowData of sheet.rows) {
      const row = ws.getRow(r)
      row.height = 17
      rowData.forEach((val, i) => {
        const cell = row.getCell(i + 1)
        cell.value = val ?? ''
        cell.font = { name: 'Calibri', size: 10 }
        cell.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle' }
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFF3F4F6' } } }
      })
      r++
    }

    // Total / footer row
    if (sheet.totalRow) {
      const row = ws.getRow(r)
      row.height = 18
      sheet.totalRow.forEach((val, i) => {
        const cell = row.getCell(i + 1)
        cell.value = val ?? ''
        cell.font = { bold: true, name: 'Calibri', size: 10, color: { argb: DARK } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY } }
        cell.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle' }
        cell.border = { top: { style: 'thin', color: { argb: 'FFCCCCCC' } } }
      })
    }
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

import type { SheetData } from '../types'
import { cellKey } from '../types'

export function sheetToCsv(sheet: SheetData, rows = 25, cols = 15): string {
  const out: string[] = []
  for (let r = 0; r < rows; r++) {
    const line: string[] = []
    for (let c = 0; c < cols; c++) {
      const v = sheet.cells[cellKey(r, c)]?.value ?? ''
      line.push(escapeCsv(v))
    }
    out.push(line.join(','))
  }
  return out.join('\n')
}

export function csvToGrid(csv: string): string[][] {
  // Simple CSV parser: handles quoted fields and commas/newlines.
  const s = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!
    const next = s[i + 1]
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cur += '"'
        i++
        continue
      }
      if (ch === '"') {
        inQuotes = false
        continue
      }
      cur += ch
      continue
    }
    if (ch === '"') {
      inQuotes = true
      continue
    }
    if (ch === ',') {
      row.push(cur)
      cur = ''
      continue
    }
    if (ch === '\n') {
      row.push(cur)
      cur = ''
      rows.push(row)
      row = []
      continue
    }
    cur += ch
  }
  row.push(cur)
  rows.push(row)
  return rows
}

function escapeCsv(v: string): string {
  if (v.includes('"') || v.includes(',') || v.includes('\n')) {
    return `"${v.replaceAll('"', '""')}"`
  }
  return v
}


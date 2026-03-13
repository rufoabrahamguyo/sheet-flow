import type { SheetData } from '../types'
import { cellKey } from '../types'

export type FormulaResult =
  | { ok: true; value: string }
  | { ok: false; error: string }

export function isFormula(raw: string): boolean {
  return raw.trimStart().startsWith('=')
}

export function evaluateCell(raw: string, sheet: SheetData, visited: Set<string>): FormulaResult {
  const expr = raw.trim()
  if (!isFormula(expr)) return { ok: true, value: raw }
  try {
    const inside = expr.slice(1).trim()
    const parsed = parseFunctionCall(inside)
    if (!parsed) return { ok: false, error: 'Invalid formula' }
    const fn = parsed.name.toUpperCase()
    const args = parsed.args
    const nums = args.flatMap((a) => resolveArgToNumbers(a, sheet, visited))
    if (nums.some((n) => Number.isNaN(n))) return { ok: false, error: 'NaN' }

    switch (fn) {
      case 'SUM':
        return { ok: true, value: String(nums.reduce((s, n) => s + n, 0)) }
      case 'AVERAGE':
      case 'AVG':
        return { ok: true, value: nums.length ? String(nums.reduce((s, n) => s + n, 0) / nums.length) : '0' }
      case 'MIN':
        return { ok: true, value: nums.length ? String(Math.min(...nums)) : '0' }
      case 'MAX':
        return { ok: true, value: nums.length ? String(Math.max(...nums)) : '0' }
      default:
        return { ok: false, error: `Unknown function: ${parsed.name}` }
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' }
  }
}

export function recalcSheet(sheet: SheetData): SheetData {
  const nextCells = { ...sheet.cells }
  for (const [k, cell] of Object.entries(nextCells)) {
    const raw = (cell as any).raw ?? cell.value
    if (typeof raw !== 'string') continue
    if (!isFormula(raw)) {
      if ((cell as any).raw !== undefined) (nextCells[k] as any) = { ...(cell as any), value: raw }
      continue
    }
    const visited = new Set<string>([k])
    const r = evaluateCell(raw, sheet, visited)
    ;(nextCells[k] as any) = { ...(cell as any), raw, value: r.ok ? r.value : `#ERR` }
  }
  return { ...sheet, cells: nextCells }
}

function parseFunctionCall(s: string): { name: string; args: string[] } | null {
  const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*$/.exec(s)
  if (!m) return null
  const name = m[1]!
  const argsStr = m[2]!.trim()
  if (!argsStr) return { name, args: [] }
  const args = splitArgs(argsStr)
  return { name, args }
}

function splitArgs(s: string): string[] {
  const out: string[] = []
  let cur = ''
  let depth = 0
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      out.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

function resolveArgToNumbers(arg: string, sheet: SheetData, visited: Set<string>): number[] {
  const a = arg.trim()
  if (isRange(a)) {
    const { start, end } = parseRange(a)
    const out: number[] = []
    for (let r = start.row; r <= end.row; r++) {
      for (let c = start.col; c <= end.col; c++) {
        out.push(resolveCellToNumber(r, c, sheet, visited))
      }
    }
    return out
  }
  if (isCellRef(a)) {
    const { row, col } = parseCellRef(a)
    return [resolveCellToNumber(row, col, sheet, visited)]
  }
  const n = Number(a)
  return [Number.isFinite(n) ? n : NaN]
}

function resolveCellToNumber(row: number, col: number, sheet: SheetData, visited: Set<string>): number {
  const k = cellKey(row, col)
  if (visited.has(k)) return NaN
  visited.add(k)
  const cell = sheet.cells[k]
  if (!cell) return 0
  const raw = (cell as any).raw ?? cell.value
  if (typeof raw !== 'string') return 0
  if (isFormula(raw)) {
    const r = evaluateCell(raw, sheet, visited)
    return r.ok ? Number(r.value) : NaN
  }
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

function isCellRef(s: string): boolean {
  return /^[A-Za-z]+[1-9][0-9]*$/.test(s)
}

function parseCellRef(s: string): { row: number; col: number } {
  const m = /^([A-Za-z]+)([0-9]+)$/.exec(s)!
  const colLetters = m[1]!.toUpperCase()
  const row = Number(m[2]!) - 1
  let col = 0
  for (const ch of colLetters) {
    col = col * 26 + (ch.charCodeAt(0) - 64)
  }
  col -= 1
  return { row, col }
}

function isRange(s: string): boolean {
  return /^[A-Za-z]+[1-9][0-9]*\s*:\s*[A-Za-z]+[1-9][0-9]*$/.test(s)
}

function parseRange(s: string): { start: { row: number; col: number }; end: { row: number; col: number } } {
  const [a, b] = s.split(':').map((x) => x.trim())
  const p1 = parseCellRef(a!)
  const p2 = parseCellRef(b!)
  return {
    start: { row: Math.min(p1.row, p2.row), col: Math.min(p1.col, p2.col) },
    end: { row: Math.max(p1.row, p2.row), col: Math.max(p1.col, p2.col) },
  }
}


import { describe, expect, it } from 'vitest'
import { evaluateCell, recalcSheet } from './engine'
import type { SheetData } from '../types'

function sheet(cells: Record<string, any>): SheetData {
  return { id: 's', name: 'S', cells }
}

describe('formula engine', () => {
  it('SUM range', () => {
    const s = sheet({
      '0,0': { value: '1' }, // A1
      '0,1': { value: '2' }, // B1
      '1,0': { value: '3' }, // A2
      '1,1': { value: '4' }, // B2
    })
    const r = evaluateCell('=SUM(A1:B2)', s, new Set(['x']))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe('10')
  })

  it('recalcSheet writes computed values', () => {
    const s = sheet({
      '0,0': { value: '5', raw: '5' },
      '0,1': { value: '6', raw: '6' },
      '0,2': { value: '', raw: '=SUM(A1:B1)' },
    })
    const out = recalcSheet(s)
    expect(out.cells['0,2']!.value).toBe('11')
  })
})


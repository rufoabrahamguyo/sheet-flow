import React, { useMemo, useState } from 'react'
import type { SheetData } from '../types'

export function FindReplacePanel({
  isOpen,
  onClose,
  sheet,
  onReplace,
  onSelectCell,
}: {
  isOpen: boolean
  onClose: () => void
  sheet: SheetData
  onReplace: (row: number, col: number, value: string) => void
  onSelectCell: (row: number, col: number) => void
}) {
  const [query, setQuery] = useState('')
  const [replace, setReplace] = useState('')
  const [matchCase, setMatchCase] = useState(false)

  const matches = useMemo(() => {
    const q = matchCase ? query : query.toLowerCase()
    if (!q) return []
    const out: Array<{ row: number; col: number; value: string }> = []
    for (const [key, cell] of Object.entries(sheet.cells)) {
      const [rS, cS] = key.split(',')
      const row = Number(rS)
      const col = Number(cS)
      const v = cell.value ?? ''
      const vv = matchCase ? v : v.toLowerCase()
      if (vv.includes(q)) out.push({ row, col, value: v })
    }
    out.sort((a, b) => (a.row - b.row) || (a.col - b.col))
    return out
  }, [matchCase, query, sheet.cells])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
          padding: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>Find & Replace</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 8, background: '#fff' }}
          >
            Close
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#555' }}>Find</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Text to find…"
              style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#555' }}>Replace</span>
            <input
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              placeholder="Replacement…"
              style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10 }}
            />
          </label>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <input type="checkbox" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} />
          <span style={{ fontSize: 13 }}>Match case</span>
        </label>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            disabled={!query}
            onClick={() => {
              if (matches[0]) onSelectCell(matches[0].row, matches[0].col)
            }}
            style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10, background: '#fff' }}
          >
            Find next
          </button>
          <button
            type="button"
            disabled={!query || matches.length === 0}
            onClick={() => {
              for (const m of matches) {
                onReplace(m.row, m.col, m.value.replace(new RegExp(escapeRegExp(query), matchCase ? 'g' : 'gi'), replace))
              }
            }}
            style={{ padding: '10px 12px', border: 'none', borderRadius: 10, background: '#1976d2', color: '#fff' }}
          >
            Replace all
          </button>
        </div>

        <div style={{ maxHeight: 260, overflow: 'auto', borderTop: '1px solid #eee', paddingTop: 10 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
            {query ? `${matches.length} match(es)` : 'Type to search.'}
          </div>
          {matches.slice(0, 50).map((m) => (
            <button
              key={`${m.row},${m.col}`}
              type="button"
              onClick={() => onSelectCell(m.row, m.col)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                border: '1px solid #eee',
                borderRadius: 10,
                background: '#fff',
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 4 }}>
                {String.fromCharCode(65 + m.col)}
                {m.row + 1}
              </div>
              <div style={{ color: '#444', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {m.value}
              </div>
            </button>
          ))}
          {matches.length > 50 && <div style={{ fontSize: 12, color: '#666' }}>Showing first 50 matches…</div>}
        </div>
      </div>
    </div>
  )
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}


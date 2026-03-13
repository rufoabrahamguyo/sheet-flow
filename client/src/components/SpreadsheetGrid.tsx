import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SheetData, CellData, CellFormat } from '../types'

const COLS = 15 // A-O
const ROWS = 25
const COL_LETTERS = 'ABCDEFGHIJKLMNO'.split('')

interface SpreadsheetGridProps {
  sheet: SheetData
  onCellChange: (row: number, col: number, value: string) => void
  onFormatChange: (row: number, col: number, format: Partial<CellFormat>) => void
  selectedCell: { row: number; col: number } | null
  onSelectCell: (row: number, col: number) => void
  selectedRange: { start: { row: number; col: number }; end: { row: number; col: number } } | null
  onSelectRange: (r: { start: { row: number; col: number }; end: { row: number; col: number } } | null) => void
  onRequestUndo: () => void
  onRequestRedo: () => void
  onRequestCopy: () => void
  onRequestCut: () => void
  onRequestPaste: () => void
}

function cellKey(row: number, col: number) {
  return `${row},${col}`
}

export function SpreadsheetGrid({
  sheet,
  onCellChange,
  onFormatChange,
  selectedCell,
  onSelectCell,
  selectedRange,
  onSelectRange,
  onRequestUndo,
  onRequestRedo,
  onRequestCopy,
  onRequestCut,
  onRequestPaste,
}: SpreadsheetGridProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null)
  const [editValue, setEditValue] = useState('')
  const isMouseDownRef = useRef(false)
  const anchorRef = useRef<{ row: number; col: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const getCell = useCallback(
    (row: number, col: number): CellData => {
      return sheet.cells[cellKey(row, col)] ?? { value: '' }
    },
    [sheet.cells]
  )

  const startEdit = (row: number, col: number) => {
    const cell = getCell(row, col)
    setEditingCell({ row, col })
    setEditValue(cell.value)
  }

  const commitEdit = () => {
    if (editingCell === null) return
    onCellChange(editingCell.row, editingCell.col, editValue)
    setEditingCell(null)
  }

  const normalizedRange = useMemo(() => {
    const r = selectedRange
    if (!r) return null
    const r0 = Math.min(r.start.row, r.end.row)
    const r1 = Math.max(r.start.row, r.end.row)
    const c0 = Math.min(r.start.col, r.end.col)
    const c1 = Math.max(r.start.col, r.end.col)
    return { r0, r1, c0, c1 }
  }, [selectedRange])

  const moveSelection = useCallback(
    (dRow: number, dCol: number, extend: boolean) => {
      const cur = selectedCell ?? { row: 0, col: 0 }
      const next = {
        row: Math.max(0, Math.min(ROWS - 1, cur.row + dRow)),
        col: Math.max(0, Math.min(COLS - 1, cur.col + dCol)),
      }
      onSelectCell(next.row, next.col)
      if (extend) {
        const anchor = anchorRef.current ?? cur
        anchorRef.current = anchor
        onSelectRange({ start: anchor, end: next })
      } else {
        anchorRef.current = next
        onSelectRange({ start: next, end: next })
      }
    },
    [onSelectCell, onSelectRange, selectedCell]
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) return
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) onRequestRedo()
        else onRequestUndo()
        return
      }
      if (meta && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        onRequestCopy()
        return
      }
      if (meta && e.key.toLowerCase() === 'x') {
        e.preventDefault()
        onRequestCut()
        return
      }
      if (meta && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        onRequestPaste()
        return
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          moveSelection(-1, 0, e.shiftKey)
          return
        case 'ArrowDown':
          e.preventDefault()
          moveSelection(1, 0, e.shiftKey)
          return
        case 'ArrowLeft':
          e.preventDefault()
          moveSelection(0, -1, e.shiftKey)
          return
        case 'ArrowRight':
          e.preventDefault()
          moveSelection(0, 1, e.shiftKey)
          return
        case 'Enter': {
          e.preventDefault()
          if (!selectedCell) return
          startEdit(selectedCell.row, selectedCell.col)
          return
        }
        case 'Tab': {
          e.preventDefault()
          moveSelection(0, e.shiftKey ? -1 : 1, false)
          return
        }
        case 'Backspace':
        case 'Delete': {
          e.preventDefault()
          if (!selectedRange) return
          // clearing handled by cut via app; treat as cut without clipboard write
          onRequestCut()
          return
        }
        default: {
          if (e.key.length === 1 && !meta && selectedCell) {
            // typing starts edit
            startEdit(selectedCell.row, selectedCell.col)
            setEditValue(e.key)
          }
        }
      }
    }
    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [
    editingCell,
    moveSelection,
    onRequestCopy,
    onRequestCut,
    onRequestPaste,
    onRequestRedo,
    onRequestUndo,
    selectedCell,
    selectedRange,
  ])

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      style={{ overflow: 'auto', flex: 1, padding: 16, outline: 'none' }}
      onMouseDown={() => {
        isMouseDownRef.current = true
      }}
      onMouseUp={() => {
        isMouseDownRef.current = false
      }}
      onMouseLeave={() => {
        isMouseDownRef.current = false
      }}
    >
      <table
        style={{
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          minWidth: 800,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                width: 40,
                minWidth: 40,
                border: '1px solid #ddd',
                background: '#f5f5f5',
                padding: 4,
              }}
            />
            {COL_LETTERS.map((letter, col) => (
              <th
                key={letter}
                style={{
                  width: 100,
                  minWidth: 100,
                  border: '1px solid #ddd',
                  background: '#f5f5f5',
                  padding: 4,
                  fontWeight: 600,
                }}
              >
                {letter}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROWS }, (_, row) => (
            <tr key={row}>
              <td
                style={{
                  width: 40,
                  border: '1px solid #ddd',
                  background: '#f5f5f5',
                  padding: 4,
                  textAlign: 'center',
                  fontWeight: 500,
                }}
              >
                {row + 1}
              </td>
              {COL_LETTERS.map((_, col) => {
                const cell = getCell(row, col)
                const isSelected =
                  selectedCell?.row === row && selectedCell?.col === col
                const isEditing =
                  editingCell?.row === row && editingCell?.col === col
                const inRange =
                  normalizedRange &&
                  row >= normalizedRange.r0 &&
                  row <= normalizedRange.r1 &&
                  col >= normalizedRange.c0 &&
                  col <= normalizedRange.c1
                return (
                  <td
                    key={col}
                    style={{
                      width: 100,
                      border: '1px solid #ddd',
                      padding: 2,
                      background: isSelected ? '#e3f2fd' : inRange ? '#f3f8ff' : '#fff',
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      anchorRef.current = { row, col }
                      onSelectCell(row, col)
                      onSelectRange({ start: { row, col }, end: { row, col } })
                      isMouseDownRef.current = true
                      containerRef.current?.focus()
                    }}
                    onMouseEnter={() => {
                      if (!isMouseDownRef.current) return
                      const anchor = anchorRef.current
                      if (!anchor) return
                      onSelectCell(row, col)
                      onSelectRange({ start: anchor, end: { row, col } })
                    }}
                    onDoubleClick={() => {
                      startEdit(row, col)
                    }}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit()
                          if (e.key === 'Escape') setEditingCell(null)
                        }}
                        style={{
                          width: '100%',
                          border: 'none',
                          outline: 'none',
                          fontWeight: cell.format?.bold ? 700 : undefined,
                          fontStyle: cell.format?.italic ? 'italic' : undefined,
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          display: 'block',
                          minHeight: 22,
                          fontWeight: cell.format?.bold ? 700 : undefined,
                          fontStyle: cell.format?.italic ? 'italic' : undefined,
                        }}
                      >
                        {cell.value || '\u00A0'}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

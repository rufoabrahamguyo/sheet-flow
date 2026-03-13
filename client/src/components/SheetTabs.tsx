import React from 'react'
import type { SheetData } from '../types'

interface SheetTabsProps {
  sheets: SheetData[]
  activeSheetId: string
  onSelectSheet: (sheetId: string) => void
  onAddSheet?: () => void
}

export function SheetTabs({ sheets, activeSheetId, onSelectSheet, onAddSheet }: SheetTabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        padding: '8px 16px 0',
        borderBottom: '1px solid #e0e0e0',
        background: '#fff',
      }}
    >
      {sheets.map((sheet) => (
        <button
          key={sheet.id}
          type="button"
          onClick={() => onSelectSheet(sheet.id)}
          style={{
            padding: '8px 16px',
            border: '1px solid #e0e0e0',
            borderBottom: 'none',
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            background: activeSheetId === sheet.id ? '#fff' : '#f5f5f5',
            marginBottom: -1,
            fontWeight: activeSheetId === sheet.id ? 600 : 400,
          }}
        >
          {sheet.name}
        </button>
      ))}
      {onAddSheet && (
        <button
          type="button"
          onClick={onAddSheet}
          title="Add sheet"
          style={{
            marginLeft: 8,
            padding: '0 10px',
            border: '1px solid #e0e0e0',
            borderRadius: 999,
            background: '#f5f5f5',
            fontSize: 18,
            lineHeight: '22px',
          }}
        >
          +
        </button>
      )}
    </div>
  )
}

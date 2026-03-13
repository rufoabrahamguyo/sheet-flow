import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Header, type EditCommand } from './components/Header'
import { FormattingToolbar } from './components/FormattingToolbar'
import { SheetTabs } from './components/SheetTabs'
import { SpreadsheetGrid } from './components/SpreadsheetGrid'
import { AIChatSidebar } from './components/AIChatSidebar'
import { UploadModal } from './components/UploadModal'
import { FindReplacePanel } from './components/FindReplacePanel'
import { api } from './api/client'
import type {
  DocumentData,
  SheetData,
  ChatMessage,
  ReceiptExtractResult,
  MpesaAnalysisResult,
} from './types'
import { cellKey } from './types'
import { recalcSheet, isFormula } from './formulas/engine'
import { sheetToCsv, csvToGrid } from './utils/csv'
import './App.css'

function createEmptySheet(id: string, name: string): SheetData {
  return { id, name, cells: {} }
}

function createDefaultDocument(): DocumentData {
  const sheet1 = createEmptySheet('sheet-1', 'Sheet 1')
  const sheet2 = createEmptySheet('sheet-2', 'Sheet 2')
  return {
    id: 'default',
    sheets: [sheet1, sheet2],
    activeSheetId: sheet1.id,
  }
}

export default function App() {
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [docListLoading, setDocListLoading] = useState(true)
  const [docListError, setDocListError] = useState<string | null>(null)
  const [documentsList, setDocumentsList] = useState<Array<{ id: string; title: string | null; updated_at: string }>>(
    []
  )

  const [document, setDocument] = useState<DocumentData | null>(null)
  const [docLoading, setDocLoading] = useState(true)
  const [docError, setDocError] = useState<string | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [selectedRange, setSelectedRange] = useState<{
    start: { row: number; col: number }
    end: { row: number; col: number }
  } | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [findOpen, setFindOpen] = useState(false)
  const [saveTimeoutId, setSaveTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null)
  const documentRef = useRef<DocumentData | null>(null)
  documentRef.current = document

  const undoStackRef = useRef<DocumentData[]>([])
  const redoStackRef = useRef<DocumentData[]>([])

  const activeSheet = document?.sheets.find((s) => s.id === document.activeSheetId) ?? null

  // Bootstrap: load or create a document so we can show the spreadsheet without login
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setDocListLoading(true)
      setDocListError(null)
      try {
        const res = await api.listDocuments()
        if (cancelled) return
        setDocumentsList(res.documents.map((d) => ({ id: d.id, title: d.title, updated_at: d.updated_at })))
        if (res.documents.length > 0) {
          setDocumentId(res.documents[0]!.id)
        } else {
          const created = await api.createDocument('Untitled spreadsheet')
          if (cancelled) return
          setDocumentId(created.document.id)
          setDocumentsList([
            {
              id: created.document.id,
              title: created.document.name ?? null,
              updated_at: new Date().toISOString(),
            },
          ])
        }
      } catch (e) {
        if (cancelled) return
        setDocListError(e instanceof Error ? e.message : 'Failed to load documents')
        try {
          const created = await api.createDocument('Untitled spreadsheet')
          if (cancelled) return
          setDocumentId(created.document.id)
        } catch {
          setDocumentId('default')
        }
      } finally {
        if (!cancelled) setDocListLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadDocument = useCallback(async () => {
    setDocLoading(true)
    setDocError(null)
    try {
      const res = await api.getDocument(documentId ?? 'default')
      setDocument(res.document)
    } catch (err) {
      setDocError(err instanceof Error ? err.message : 'Failed to load document')
      setDocument(createDefaultDocument())
    } finally {
      setDocLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    if (!documentId) return
    loadDocument()
  }, [documentId, loadDocument])

  const saveDocument = useCallback(
    async (doc: DocumentData) => {
      try {
        await api.putDocument(doc.id, doc)
      } catch (err) {
        console.error('Save failed:', err)
      }
    },
    []
  )

  const scheduleSave = useCallback(() => {
    if (saveTimeoutId) clearTimeout(saveTimeoutId)
    const id = setTimeout(() => {
      const doc = documentRef.current
      if (doc) saveDocument(doc)
      setSaveTimeoutId(null)
    }, 1000)
    setSaveTimeoutId(id)
  }, [saveDocument, saveTimeoutId])

  const pushUndo = useCallback(
    (prev: DocumentData) => {
      undoStackRef.current.push(structuredClone(prev))
      if (undoStackRef.current.length > 200) undoStackRef.current.shift()
      redoStackRef.current = []
    },
    []
  )

  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      if (!document || !activeSheet) return
      pushUndo(document)
      const key = cellKey(row, col)
      const prevCell = activeSheet.cells[key]
      const raw = value
      const nextCell = {
        ...(prevCell ?? { value: '' }),
        raw,
        value: isFormula(raw) ? prevCell?.value ?? '' : raw,
      }
      const nextCells = { ...activeSheet.cells, [key]: nextCell }
      const nextSheet = recalcSheet({ ...activeSheet, cells: nextCells })
      const nextSheets = document.sheets.map((s) => (s.id === activeSheet.id ? nextSheet : s))
      setDocument({ ...document, sheets: nextSheets })
      scheduleSave()
    },
    [document, activeSheet, scheduleSave, pushUndo]
  )

  const handleFormatChange = useCallback(
    (row: number, col: number, format: Partial<import('./types').CellFormat>) => {
      if (!document || !activeSheet) return
      pushUndo(document)
      const key = cellKey(row, col)
      const current = activeSheet.cells[key] ?? { value: '', raw: '' }
      const nextFormat = { ...current.format, ...format }
      const nextCells = { ...activeSheet.cells, [key]: { ...current, format: nextFormat } }
      const nextSheet = recalcSheet({ ...activeSheet, cells: nextCells })
      const nextSheets = document.sheets.map((s) => (s.id === activeSheet.id ? nextSheet : s))
      setDocument({ ...document, sheets: nextSheets })
      scheduleSave()
    },
    [document, activeSheet, scheduleSave, pushUndo]
  )

  const handleSelectSheet = useCallback((sheetId: string) => {
    setDocument((d) => (d ? { ...d, activeSheetId: sheetId } : null))
  }, [])

  const handleSendChat = useCallback(async (content: string) => {
    const userMessage: ChatMessage = { role: 'user', content }
    setChatMessages((m) => [...m, userMessage])
    setChatLoading(true)
    setChatError(null)
    try {
      const res = await api.chat([...chatMessages, userMessage])
      setChatMessages((m) => [...m, res.message])
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Failed to get response')
    } finally {
      setChatLoading(false)
    }
  }, [chatMessages])

  const handleUploadFile = useCallback(async (file: File) => {
    setUploadLoading(true)
    setUploadError(null)
    try {
      await api.uploadFile(file)
      setUploadModalOpen(false)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadLoading(false)
    }
  }, [])

  const handleAttachInChat = useCallback(async (file: File) => {
    setChatError(null)
    try {
      const res = await api.uploadFile(file)
      return res.data ?? null
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Upload failed')
      return null
    }
  }, [])

  /** Find next row index where col 0 is empty (for appending). */
  const getNextAppendRow = useCallback((sheet: SheetData): number => {
    for (let r = 0; r < 25; r++) {
      const v = sheet.cells[cellKey(r, 0)]?.value?.trim()
      if (!v) return r
    }
    return 25
  }, [])

  const appendReceiptToSheet = useCallback(
    (result: ReceiptExtractResult) => {
      if (!document || !activeSheet) return
      pushUndo(document)
      const nextCells = { ...activeSheet.cells }
      let startRow = getNextAppendRow(activeSheet)
      const needsHeader = startRow === 0
      if (needsHeader) {
        nextCells[cellKey(0, 0)] = { value: 'Date' }
        nextCells[cellKey(0, 1)] = { value: 'Item' }
        nextCells[cellKey(0, 2)] = { value: 'Amount' }
        nextCells[cellKey(0, 3)] = { value: 'Category' }
        nextCells[cellKey(0, 4)] = { value: 'Supplier' }
        startRow = 1
      }
      const dateStr = result.date ?? ''
      const supplier = result.supplier ?? ''
      for (let i = 0; i < result.lineItems.length; i++) {
        const row = startRow + i
        if (row >= 25) break
        const item = result.lineItems[i]!
        nextCells[cellKey(row, 0)] = { value: dateStr }
        nextCells[cellKey(row, 1)] = { value: item.itemName }
        nextCells[cellKey(row, 2)] = { value: String(item.amount) }
        nextCells[cellKey(row, 3)] = { value: item.category }
        nextCells[cellKey(row, 4)] = { value: supplier }
      }
      const nextSheet = { ...activeSheet, cells: nextCells }
      const nextSheets = document.sheets.map((s) => (s.id === activeSheet.id ? nextSheet : s))
      setDocument({ ...document, sheets: nextSheets })
      scheduleSave()
    },
    [document, activeSheet, getNextAppendRow, pushUndo, scheduleSave]
  )

  const appendMpesaToSheet = useCallback(
    (result: MpesaAnalysisResult) => {
      if (!document || !activeSheet) return
      pushUndo(document)
      const nextCells = { ...activeSheet.cells }
      let startRow = getNextAppendRow(activeSheet)
      const needsHeader = startRow === 0
      if (needsHeader) {
        nextCells[cellKey(0, 0)] = { value: 'Date' }
        nextCells[cellKey(0, 1)] = { value: 'Description' }
        nextCells[cellKey(0, 2)] = { value: 'Amount' }
        nextCells[cellKey(0, 3)] = { value: 'Type' }
        startRow = 1
      }
      for (let i = 0; i < result.transactions.length; i++) {
        const row = startRow + i
        if (row >= 25) break
        const t = result.transactions[i]!
        nextCells[cellKey(row, 0)] = { value: t.date }
        nextCells[cellKey(row, 1)] = { value: t.description.slice(0, 200) }
        nextCells[cellKey(row, 2)] = { value: String(t.amount) }
        nextCells[cellKey(row, 3)] = { value: t.type }
      }
      const nextSheet = { ...activeSheet, cells: nextCells }
      const nextSheets = document.sheets.map((s) => (s.id === activeSheet.id ? nextSheet : s))
      setDocument({ ...document, sheets: nextSheets })
      scheduleSave()
    },
    [document, activeSheet, getNextAppendRow, pushUndo, scheduleSave]
  )

  const handleUploadText = useCallback(async (text: string, scanHandwriting: boolean) => {
    setUploadLoading(true)
    setUploadError(null)
    try {
      await api.uploadText(text, scanHandwriting)
      setUploadModalOpen(false)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadLoading(false)
    }
  }, [])

  const openChat = () => setChatOpen(true)
  const [ioError, setIoError] = useState<string | null>(null)

  const selectedFormat =
    activeSheet && selectedCell
      ? activeSheet.cells[cellKey(selectedCell.row, selectedCell.col)]?.format
      : undefined

  const execEditCommand = useCallback(
    async (cmd: EditCommand) => {
      if (!document || !activeSheet) return

      const applyToSelectedCell = (fn: (row: number, col: number) => void) => {
        if (!selectedCell) return
        fn(selectedCell.row, selectedCell.col)
      }

      switch (cmd) {
        case 'copy': {
          try {
            const range = selectedRange ?? (selectedCell ? { start: selectedCell, end: selectedCell } : null)
            if (!range) return
            const r0 = Math.min(range.start.row, range.end.row)
            const r1 = Math.max(range.start.row, range.end.row)
            const c0 = Math.min(range.start.col, range.end.col)
            const c1 = Math.max(range.start.col, range.end.col)
            const rows: string[] = []
            for (let r = r0; r <= r1; r++) {
              const cols: string[] = []
              for (let c = c0; c <= c1; c++) {
                cols.push(activeSheet.cells[cellKey(r, c)]?.value ?? '')
              }
              rows.push(cols.join('\t'))
            }
            await navigator.clipboard?.writeText(rows.join('\n'))
          } catch (e) {
            console.warn('Clipboard copy failed', e)
          }
          return
        }
        case 'cut': {
          await execEditCommand('copy')
          const range = selectedRange ?? (selectedCell ? { start: selectedCell, end: selectedCell } : null)
          if (!range) return
          const r0 = Math.min(range.start.row, range.end.row)
          const r1 = Math.max(range.start.row, range.end.row)
          const c0 = Math.min(range.start.col, range.end.col)
          const c1 = Math.max(range.start.col, range.end.col)
          pushUndo(document)
          const nextCells = { ...activeSheet.cells }
          for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
              const k = cellKey(r, c)
              const current = nextCells[k] ?? { value: '' }
              nextCells[k] = { ...current, value: '' }
            }
          }
          const nextSheets = document.sheets.map((s) =>
            s.id === activeSheet.id ? { ...s, cells: nextCells } : s
          )
          setDocument({ ...document, sheets: nextSheets })
          scheduleSave()
          return
        }
        case 'paste': {
          try {
            const anchor = selectedRange?.start ?? selectedCell
            if (!anchor) return
            const text = await navigator.clipboard?.readText()
            if (typeof text !== 'string') return
            const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
            const grid = lines.map((l) => l.split('\t'))
            pushUndo(document)
            const nextCells = { ...activeSheet.cells }
            for (let r = 0; r < grid.length; r++) {
              for (let c = 0; c < grid[r]!.length; c++) {
                const rr = anchor.row + r
                const cc = anchor.col + c
                if (rr < 0 || rr >= 25 || cc < 0 || cc >= 15) continue
                const k = cellKey(rr, cc)
                const cur = nextCells[k] ?? { value: '' }
                nextCells[k] = { ...cur, value: grid[r]![c] ?? '' }
              }
            }
            const nextSheets = document.sheets.map((s) =>
              s.id === activeSheet.id ? { ...s, cells: nextCells } : s
            )
            setDocument({ ...document, sheets: nextSheets })
            scheduleSave()
          } catch (e) {
            console.warn('Clipboard paste failed', e)
          }
          return
        }
        case 'undo':
        {
          const prev = undoStackRef.current.pop()
          if (!prev) return
          redoStackRef.current.push(structuredClone(document))
          setDocument(prev)
          scheduleSave()
          return
        }
        case 'redo':
        {
          const next = redoStackRef.current.pop()
          if (!next) return
          undoStackRef.current.push(structuredClone(document))
          setDocument(next)
          scheduleSave()
          return
        }
        case 'find':
          setFindOpen(true)
          return
        case 'replace':
          setFindOpen(true)
          return
        case 'selectAll': {
          // v1: select the whole sheet
          setSelectedCell({ row: 0, col: 0 })
          setSelectedRange({ start: { row: 0, col: 0 }, end: { row: 24, col: 14 } })
          return
        }
        default:
          return
      }
    },
    [activeSheet, document, handleCellChange, selectedCell, selectedRange, pushUndo, scheduleSave]
  )

  if (!documentId) {
    return (
      <div className="app">
        <Header onEditCommand={execEditCommand} hasSelection={!!selectedCell} rightSlot={null} />
        <div className="app-loading">{docListLoading ? 'Loading…' : docListError || 'Loading…'}</div>
      </div>
    )
  }

  if (docLoading && !document) {
    return (
      <div className="app">
        <Header onEditCommand={execEditCommand} hasSelection={!!selectedCell} rightSlot={null} />
        <div className="app-loading">Loading...</div>
      </div>
    )
  }

  if (docError && !document) {
    return (
      <div className="app">
        <Header onEditCommand={execEditCommand} hasSelection={!!selectedCell} rightSlot={null} />
        <div className="app-error">{docError}</div>
      </div>
    )
  }

  if (!document) return null

  return (
    <div className="app">
      <Header onEditCommand={execEditCommand} hasSelection={!!selectedCell} rightSlot={null} />
      <div className="app-main">
        <div className="app-content">
          {ioError && <div style={{ padding: '8px 16px', color: '#c00' }}>{ioError}</div>}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <FormattingToolbar
              selectedFormat={selectedFormat}
              onFormatChange={(format) =>
                selectedCell && handleFormatChange(selectedCell.row, selectedCell.col, format)
              }
              onEditCommand={execEditCommand}
              disabled={!selectedCell}
            />
          </div>
          <SheetTabs
            sheets={document.sheets}
            activeSheetId={document.activeSheetId}
            onSelectSheet={handleSelectSheet}
          />
          {activeSheet && (
            <SpreadsheetGrid
              sheet={activeSheet}
              onCellChange={handleCellChange}
              onFormatChange={handleFormatChange}
              selectedCell={selectedCell}
              onSelectCell={(row, col) => {
                setSelectedCell({ row, col })
                setSelectedRange({ start: { row, col }, end: { row, col } })
              }}
              selectedRange={selectedRange}
              onSelectRange={setSelectedRange}
              onRequestUndo={() => execEditCommand('undo')}
              onRequestRedo={() => execEditCommand('redo')}
              onRequestCopy={() => execEditCommand('copy')}
              onRequestCut={() => execEditCommand('cut')}
              onRequestPaste={() => execEditCommand('paste')}
            />
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={openChat}
        title="AI Chat"
        aria-label="Open AI Chat"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: '#1976d2',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
        </svg>
      </button>
      <AIChatSidebar
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendChat}
        onAttachFile={handleAttachInChat}
        isLoading={chatLoading}
        error={chatError}
        documentId={documentId}
        onExtractReceipt={async (file) => {
          setChatError(null)
          try {
            return await api.extractReceipt(file)
          } catch (err) {
            setChatError(err instanceof Error ? err.message : 'Receipt scan failed')
            return null
          }
        }}
        onAnalyzeMpesaFile={async (file) => {
          setChatError(null)
          try {
            const res = await api.analyzeMpesaFile(file)
            return res
          } catch (err) {
            setChatError(err instanceof Error ? err.message : 'M-Pesa analysis failed')
            return null
          }
        }}
        onAnalyzeMpesaText={async (text) => {
          setChatError(null)
          try {
            const res = await api.analyzeMpesaText(text)
            return res
          } catch (err) {
            setChatError(err instanceof Error ? err.message : 'M-Pesa analysis failed')
            return null
          }
        }}
        onGenerateReport={async () => {
          if (!documentId) return null
          setChatError(null)
          try {
            const res = await api.generateReport(documentId)
            return res
          } catch (err) {
            setChatError(err instanceof Error ? err.message : 'Report failed')
            return null
          }
        }}
        onAddReceiptToSheet={appendReceiptToSheet}
        onAddMpesaToSheet={appendMpesaToSheet}
      />
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadFile={handleUploadFile}
        onUploadText={handleUploadText}
        isLoading={uploadLoading}
        error={uploadError}
      />

      {activeSheet && (
        <FindReplacePanel
          isOpen={findOpen}
          onClose={() => setFindOpen(false)}
          sheet={activeSheet}
          onReplace={(row, col, value) => handleCellChange(row, col, value)}
          onSelectCell={(row, col) => {
            setSelectedCell({ row, col })
            setSelectedRange({ start: { row, col }, end: { row, col } })
          }}
        />
      )}
    </div>
  )
}

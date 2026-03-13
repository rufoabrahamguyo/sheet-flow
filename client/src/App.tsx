import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Header, type EditCommand } from './components/Header'
import { FormattingToolbar } from './components/FormattingToolbar'
import { Sidebar } from './components/Sidebar'
import { SheetTabs } from './components/SheetTabs'
import { SpreadsheetGrid } from './components/SpreadsheetGrid'
import { AIChatSidebar } from './components/AIChatSidebar'
import { UploadModal } from './components/UploadModal'
import { AuthPanel } from './components/AuthPanel'
import { FindReplacePanel } from './components/FindReplacePanel'
import { api, setToken } from './api/client'
import type { DocumentData, SheetData, ChatMessage } from './types'
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
  const [authChecked, setAuthChecked] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const [documentId, setDocumentId] = useState<string | null>(null)
  const [docListLoading, setDocListLoading] = useState(false)
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

  useEffect(() => {
    ;(async () => {
      try {
        const me = await api.me()
        setUserEmail(me.user.email)
      } catch {
        setUserEmail(null)
      } finally {
        setAuthChecked(true)
      }
    })()
  }, [])

  const refreshDocList = useCallback(async () => {
    setDocListLoading(true)
    setDocListError(null)
    try {
      const res = await api.listDocuments()
      setDocumentsList(res.documents.map((d) => ({ id: d.id, title: d.title, updated_at: d.updated_at })))
      if (!documentId && res.documents.length > 0) {
        setDocumentId(res.documents[0]!.id)
      }
    } catch (e) {
      setDocListError(e instanceof Error ? e.message : 'Failed to load documents')
    } finally {
      setDocListLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    if (!authChecked || !userEmail) return
    refreshDocList()
  }, [authChecked, userEmail, refreshDocList])

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
    if (!authChecked || !userEmail) return
    if (!documentId) return
    loadDocument()
  }, [loadDocument])

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
    (row: number, col: number, format: Partial<{ bold?: boolean; italic?: boolean }>) => {
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

  const openUpload = () => setUploadModalOpen(true)
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

  const headerRightSlot = useMemo(() => {
    if (!userEmail) return null
    return (
      <button
        type="button"
        onClick={async () => {
          try {
            await api.logout()
          } catch {
            // ignore
          }
          setToken(null)
          setUserEmail(null)
          setDocumentId(null)
          setDocument(null)
        }}
        style={{
          padding: '6px 10px',
          border: '1px solid #ddd',
          borderRadius: 999,
          background: '#fff',
          color: '#444',
          fontSize: 13,
          marginRight: 6,
        }}
        title="Logout"
      >
        {userEmail}
      </button>
    )
  }, [userEmail])

  if (!authChecked) {
    return (
      <div className="app">
        <Header onEditCommand={execEditCommand} hasSelection={!!selectedCell} rightSlot={null} />
        <div className="app-loading">Loading…</div>
      </div>
    )
  }

  if (!userEmail) {
    return (
      <div className="app">
        <Header onEditCommand={execEditCommand} hasSelection={!!selectedCell} rightSlot={null} />
        <AuthPanel
          mode={authMode}
          onModeChange={setAuthMode}
          loading={authLoading}
          error={authError}
          onSubmit={async (email, password) => {
            setAuthLoading(true)
            setAuthError(null)
            try {
              const res =
                authMode === 'login' ? await api.login(email, password) : await api.register(email, password)
              setToken(res.token)
              setUserEmail(res.user.email)
              await refreshDocList()
            } catch (e) {
              setAuthError(e instanceof Error ? e.message : 'Auth failed')
            } finally {
              setAuthLoading(false)
            }
          }}
        />
      </div>
    )
  }

  if (!documentId) {
    return (
      <div className="app">
        <Header onEditCommand={execEditCommand} hasSelection={!!selectedCell} rightSlot={headerRightSlot} />
        <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Your documents</h2>
          {docListError && <div style={{ color: '#c00', marginBottom: 10 }}>{docListError}</div>}
          <button
            type="button"
            disabled={docListLoading}
            onClick={async () => {
              try {
                const created = await api.createDocument('Untitled spreadsheet')
                setDocumentId(created.document.id)
                await refreshDocList()
              } catch (e) {
                setDocListError(e instanceof Error ? e.message : 'Create failed')
              }
            }}
            style={{
              padding: '10px 14px',
              border: 'none',
              borderRadius: 8,
              background: '#1976d2',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            New document
          </button>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {documentsList.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDocumentId(d.id)}
                style={{
                  padding: '12px 14px',
                  border: '1px solid #ddd',
                  borderRadius: 10,
                  background: '#fff',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 700 }}>{d.title ?? d.id}</div>
                <div style={{ color: '#666', fontSize: 12 }}>Updated {new Date(d.updated_at).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (docLoading && !document) {
    return (
      <div className="app">
        <Header onEditCommand={execEditCommand} hasSelection={!!selectedCell} rightSlot={headerRightSlot} />
        <div className="app-loading">Loading...</div>
      </div>
    )
  }

  if (docError && !document) {
    return (
      <div className="app">
        <Header onEditCommand={execEditCommand} hasSelection={!!selectedCell} rightSlot={headerRightSlot} />
        <div className="app-error">{docError}</div>
      </div>
    )
  }

  if (!document) return null

  return (
    <div className="app">
      <Header onEditCommand={execEditCommand} hasSelection={!!selectedCell} rightSlot={headerRightSlot} />
      <div className="app-main">
        <Sidebar
          onUpload={openUpload}
          onCamera={openUpload}
          onPaste={openUpload}
          onHistory={async () => {
            // Export CSV (basic) from active sheet
            if (!documentId || !activeSheet) return
            try {
              setIoError(null)
              const csv = await api.exportCsv(documentId)
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${(document?.name ?? 'sheet')}.csv`
              a.click()
              URL.revokeObjectURL(url)
            } catch (e) {
              setIoError(e instanceof Error ? e.message : 'Export failed')
            }
          }}
        />
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
              onBold={() =>
                selectedCell && handleFormatChange(selectedCell.row, selectedCell.col, { bold: !selectedFormat?.bold })
              }
              onItalic={() =>
                selectedCell && handleFormatChange(selectedCell.row, selectedCell.col, { italic: !selectedFormat?.italic })
              }
              boldActive={selectedFormat?.bold}
              italicActive={selectedFormat?.italic}
            />
            <button
              type="button"
              onClick={openChat}
              style={{
                marginLeft: 'auto',
                padding: '6px 12px',
                border: '1px solid #1976d2',
                borderRadius: 6,
                background: '#fff',
                color: '#1976d2',
              }}
            >
              AI Chat
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!documentId || !activeSheet) return
                const csv = sheetToCsv(activeSheet)
                const newCsv = prompt('Paste CSV to import into current sheet (or cancel):', csv)
                if (!newCsv) return
                try {
                  setIoError(null)
                  const res = await api.importCsv(documentId, newCsv, activeSheet.id)
                  setDocument(res.document)
                } catch (e) {
                  setIoError(e instanceof Error ? e.message : 'Import failed')
                }
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                background: '#fff',
                color: '#444',
              }}
            >
              Import CSV
            </button>
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
      <AIChatSidebar
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendChat}
        isLoading={chatLoading}
        error={chatError}
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

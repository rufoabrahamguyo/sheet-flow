import React, { useState, useRef, useEffect } from 'react'
import type { ChatMessage, ReceiptExtractResult, MpesaAnalysisResult, ReportResult } from '../types'

export type AttachResult = { text?: string; extracted?: string } | null

interface AIChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  messages: ChatMessage[]
  onSendMessage: (content: string) => Promise<void>
  onAttachFile?: (file: File) => Promise<AttachResult>
  isLoading: boolean
  error: string | null
  documentId?: string | null
  onExtractReceipt?: (file: File) => Promise<ReceiptExtractResult | null>
  onAnalyzeMpesaFile?: (file: File) => Promise<(MpesaAnalysisResult & { success?: boolean }) | null>
  onAnalyzeMpesaText?: (text: string) => Promise<(MpesaAnalysisResult & { success?: boolean }) | null>
  onGenerateReport?: () => Promise<(ReportResult & { success?: boolean }) | null>
  onAddReceiptToSheet?: (data: ReceiptExtractResult) => void
  onAddMpesaToSheet?: (data: MpesaAnalysisResult) => void
  onAddReportToSheet?: (data: ReportResult) => void
}

export function AIChatSidebar({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onAttachFile,
  isLoading,
  error,
  documentId,
  onExtractReceipt,
  onAnalyzeMpesaFile,
  onAnalyzeMpesaText,
  onGenerateReport,
  onAddReceiptToSheet,
  onAddMpesaToSheet,
  onAddReportToSheet,
}: AIChatSidebarProps) {
  const [input, setInput] = useState('')
  const [attachError, setAttachError] = useState<string | null>(null)
  const [receiptCard, setReceiptCard] = useState<ReceiptExtractResult | null>(null)
  const [mpesaCard, setMpesaCard] = useState<MpesaAnalysisResult | null>(null)
  const [reportContent, setReportContent] = useState<ReportResult | null>(null)
  const [mpesaPaste, setMpesaPaste] = useState('')
  const [showMpesaPaste, setShowMpesaPaste] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const receiptInputRef = useRef<HTMLInputElement>(null)
  const mpesaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, receiptCard, mpesaCard, reportContent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await onSendMessage(text)
  }

  const handleAttachClick = () => {
    setAttachError(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || isLoading) return
    setAttachError(null)
    const isImage = /^image\/(jpeg|png|webp)$/i.test(file.type)
    if (isImage && onExtractReceipt) {
      try {
        const result = await onExtractReceipt(file)
        if (result) {
          setReceiptCard(result)
          setReportContent(null)
          setMpesaCard(null)
        }
      } catch (err) {
        setAttachError(err instanceof Error ? err.message : 'Scan failed')
      }
      return
    }
    if (onAttachFile) {
      try {
        const data = await onAttachFile(file)
        if (data) {
          const extracted = data.extracted ?? data.text ?? ''
          const message = extracted ? `[Attached: ${file.name}]\n\n${extracted}` : `[Attached: ${file.name}]`
          await onSendMessage(message)
        }
      } catch (err) {
        setAttachError(err instanceof Error ? err.message : 'Upload failed')
      }
    }
  }

  const handleScanReceiptClick = () => {
    receiptInputRef.current?.click()
  }

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !onExtractReceipt || isLoading) return
    setAttachError(null)
    try {
      const result = await onExtractReceipt(file)
      if (result) {
        setReceiptCard(result)
        setReportContent(null)
        setMpesaCard(null)
      }
    } catch (err) {
      setAttachError(err instanceof Error ? err.message : 'Receipt scan failed')
    }
  }

  const handleMpesaFileClick = () => {
    mpesaInputRef.current?.click()
  }

  const handleMpesaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !onAnalyzeMpesaFile || isLoading) return
    setAttachError(null)
    try {
      const result = await onAnalyzeMpesaFile(file)
      if (result) {
        setMpesaCard(result)
        setReceiptCard(null)
        setReportContent(null)
      }
    } catch (err) {
      setAttachError(err instanceof Error ? err.message : 'M-Pesa analysis failed')
    }
  }

  const handleMpesaPasteSubmit = async () => {
    if (!onAnalyzeMpesaText || !mpesaPaste.trim() || isLoading) return
    setAttachError(null)
    try {
      const result = await onAnalyzeMpesaText(mpesaPaste.trim())
      if (result) {
        setMpesaCard(result)
        setReceiptCard(null)
        setReportContent(null)
        setMpesaPaste('')
        setShowMpesaPaste(false)
      }
    } catch (err) {
      setAttachError(err instanceof Error ? err.message : 'M-Pesa analysis failed')
    }
  }

  const handleGenerateReport = async () => {
    if (!onGenerateReport || isLoading) return
    setAttachError(null)
    try {
      const result = await onGenerateReport()
      if (result) {
        setReportContent(result)
        setReceiptCard(null)
        setMpesaCard(null)
      }
    } catch (err) {
      setAttachError(err instanceof Error ? err.message : 'Report failed')
    }
  }

  const canAddToSheet = Boolean(documentId && (onAddReceiptToSheet || onAddMpesaToSheet))

  if (!isOpen) return null

  const cardStyle = {
    padding: 12,
    borderRadius: 8,
    background: '#f5f5f5',
    fontSize: 13,
    marginTop: 8,
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 380,
        maxWidth: '92vw',
        height: '100%',
        background: '#fff',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt" onChange={handleFileChange} style={{ display: 'none' }} aria-hidden />
      <input ref={receiptInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleReceiptFileChange} style={{ display: 'none' }} aria-hidden />
      <input ref={mpesaInputRef} type="file" accept=".txt,.csv,text/*" onChange={handleMpesaFileChange} style={{ display: 'none' }} aria-hidden />

      <div style={{ padding: 16, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>AI Assistant</h2>
        <button type="button" onClick={onClose} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, background: '#fff' }}>
          Close
        </button>
      </div>

      {/* MVP quick actions */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {onExtractReceipt && (
          <button type="button" onClick={handleScanReceiptClick} disabled={isLoading} style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #1976d2', borderRadius: 6, background: '#fff', color: '#1976d2' }}>
            📄 Scan receipt
          </button>
        )}
        {(onAnalyzeMpesaFile || onAnalyzeMpesaText) && (
          <>
            <button type="button" onClick={handleMpesaFileClick} disabled={isLoading} style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #2e7d32', borderRadius: 6, background: '#fff', color: '#2e7d32' }}>
              💳 M-Pesa (file)
            </button>
            <button type="button" onClick={() => setShowMpesaPaste((v) => !v)} disabled={isLoading} style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #2e7d32', borderRadius: 6, background: '#fff', color: '#2e7d32' }}>
              💳 M-Pesa (paste)
            </button>
          </>
        )}
        {onGenerateReport && documentId && (
          <button type="button" onClick={handleGenerateReport} disabled={isLoading} style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #ed6c02', borderRadius: 6, background: '#fff', color: '#ed6c02' }}>
            📊 Generate report
          </button>
        )}
      </div>

      {showMpesaPaste && onAnalyzeMpesaText && (
        <div style={{ padding: 12, borderBottom: '1px solid #eee', background: '#fafafa' }}>
          <textarea
            value={mpesaPaste}
            onChange={(e) => setMpesaPaste(e.target.value)}
            placeholder="Paste M-Pesa statement text here..."
            rows={4}
            style={{ width: '100%', padding: 8, fontSize: 12, border: '1px solid #ddd', borderRadius: 4, resize: 'vertical' }}
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleMpesaPasteSubmit} disabled={isLoading || !mpesaPaste.trim()} style={{ padding: '6px 12px', fontSize: 12, border: 'none', borderRadius: 4, background: '#2e7d32', color: '#fff' }}>
              Analyze
            </button>
            <button type="button" onClick={() => { setShowMpesaPaste(false); setMpesaPaste('') }} style={{ padding: '6px 12px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, background: '#fff' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && !receiptCard && !mpesaCard && !reportContent && !isLoading && !error && (
          <p style={{ color: '#666', fontSize: 14 }}>Send a message, scan a receipt, analyze M-Pesa, or generate a report.</p>
        )}
        {(error || attachError) && (
          <div style={{ color: '#c00', fontSize: 14, padding: 8, background: '#ffebee' }}>{error || attachError}</div>
        )}

        {receiptCard && (
          <div style={cardStyle}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>📄 Receipt extracted</div>
            <div style={{ marginBottom: 4 }}>Date: {receiptCard.date ?? '—'} | Supplier: {receiptCard.supplier ?? '—'}</div>
            {receiptCard.total != null && <div style={{ marginBottom: 8 }}>Total: {receiptCard.currency ?? ''} {receiptCard.total}</div>}
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              {receiptCard.lineItems.slice(0, 10).map((item, i) => (
                <li key={i}>{item.itemName} — {item.amount} ({item.category})</li>
              ))}
              {receiptCard.lineItems.length > 10 && <li>… +{receiptCard.lineItems.length - 10} more</li>}
            </ul>
            {canAddToSheet && onAddReceiptToSheet && (
              <button type="button" onClick={() => { onAddReceiptToSheet(receiptCard); setReceiptCard(null) }} style={{ marginTop: 8, padding: '6px 12px', fontSize: 12, border: 'none', borderRadius: 4, background: '#1976d2', color: '#fff' }}>
                Add to sheet
              </button>
            )}
            <button type="button" onClick={() => setReceiptCard(null)} style={{ marginLeft: 8, marginTop: 8, padding: '6px 12px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, background: '#fff' }}>Dismiss</button>
          </div>
        )}

        {mpesaCard && (
          <div style={cardStyle}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>💳 M-Pesa analysis</div>
            <div style={{ marginBottom: 4 }}>{mpesaCard.insight}</div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
              Revenue: KES {mpesaCard.summary.totalRevenue.toLocaleString()} · Expenses: KES {mpesaCard.summary.totalExpenses.toLocaleString()} · Net: KES {mpesaCard.summary.netProfit.toLocaleString()} · {mpesaCard.summary.transactionCount} transactions
            </div>
            {canAddToSheet && onAddMpesaToSheet && (
              <button type="button" onClick={() => { onAddMpesaToSheet(mpesaCard); setMpesaCard(null) }} style={{ marginTop: 8, padding: '6px 12px', fontSize: 12, border: 'none', borderRadius: 4, background: '#2e7d32', color: '#fff' }}>
                Add to sheet
              </button>
            )}
            <button type="button" onClick={() => setMpesaCard(null)} style={{ marginLeft: 8, marginTop: 8, padding: '6px 12px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, background: '#fff' }}>Dismiss</button>
          </div>
        )}

        {reportContent && (
          <div style={cardStyle}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>📊 Business report</div>
            {reportContent.financialSummary && (
              <>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-end',
                    marginBottom: 8,
                    height: 80,
                  }}
                >
                  {['Revenue', 'Expenses', 'P/L'].map((label, idx) => {
                    const fs = reportContent.financialSummary!
                    const value =
                      label === 'Revenue'
                        ? fs.monthlyRevenue ?? 0
                        : label === 'Expenses'
                        ? fs.monthlyExpenses ?? 0
                        : fs.profitLoss ?? 0
                    const max =
                      Math.max(
                        fs.monthlyRevenue ?? 0,
                        fs.monthlyExpenses ?? 0,
                        Math.abs(fs.profitLoss ?? 0)
                      ) || 1
                    const height = Math.max(8, (Math.abs(value) / max) * 70)
                    const isNegative = value < 0 && label === 'P/L'
                    return (
                      <div key={label} style={{ flex: 1, textAlign: 'center', fontSize: 11 }}>
                        <div
                          style={{
                            margin: '0 auto 4px',
                            width: 20,
                            height,
                            borderRadius: 4,
                            background: isNegative ? '#c62828' : idx === 0 ? '#1976d2' : '#f9a825',
                          }}
                        />
                        <div>{label}</div>
                        <div style={{ fontSize: 10, color: '#555' }}>
                          {fs.currency ?? ''} {value.toLocaleString()}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
            {reportContent.insights?.length > 0 && (
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                {reportContent.insights.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
            {reportContent.narrative && <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{reportContent.narrative}</p>}
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              {onAddReportToSheet && documentId && (
                <button
                  type="button"
                  onClick={() => onAddReportToSheet(reportContent)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    border: 'none',
                    borderRadius: 4,
                    background: '#1976d2',
                    color: '#fff',
                  }}
                >
                  Add to sheet
                </button>
              )}
              <button
                type="button"
                onClick={() => setReportContent(null)}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  background: '#fff',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '8px 12px',
              borderRadius: 8,
              background: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
            }}
          >
            <span style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{msg.role === 'user' ? 'You' : 'Assistant'}</span>
            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', padding: 8, color: '#666' }}>Thinking...</div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 16, borderTop: '1px solid #e0e0e0' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {onAttachFile && (
            <button type="button" onClick={handleAttachClick} disabled={isLoading} title="Attach file" style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5C7 20.54 9.46 23 12.5 23c3.04 0 5.5-2.46 5.5-5.5V6h-1.5z" /></svg>
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            style={{ flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6 }}
          />
          <button type="submit" disabled={isLoading || !input.trim()} style={{ padding: '10px 16px', border: 'none', borderRadius: 6, background: '#1976d2', color: '#fff' }}>
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

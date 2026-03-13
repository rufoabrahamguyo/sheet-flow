import React, { useState } from 'react'

type UploadMode = 'upload' | 'paste' | 'camera'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadFile: (file: File) => Promise<void>
  onUploadText: (text: string, scanHandwriting: boolean) => Promise<void>
  isLoading: boolean
  error: string | null
}

export function UploadModal({
  isOpen,
  onClose,
  onUploadFile,
  onUploadText,
  isLoading,
  error,
}: UploadModalProps) {
  const [mode, setMode] = useState<UploadMode>('upload')
  const [pastedText, setPastedText] = useState('')
  const [scanHandwriting, setScanHandwriting] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'upload' && file) {
      await onUploadFile(file)
      setFile(null)
    } else if (mode === 'paste' && pastedText.trim()) {
      await onUploadText(pastedText.trim(), scanHandwriting)
      setPastedText('')
    } else if (mode === 'camera') {
      // Camera would typically open device; for now treat like paste or file
      await onUploadText('', scanHandwriting)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: 24,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Upload</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: 4,
              background: '#fff',
            }}
          >
            Close
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['upload', 'paste', 'camera'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: 6,
                background: mode === m ? '#e3f2fd' : '#fff',
                textTransform: 'capitalize',
              }}
            >
              {m}
            </button>
          ))}
        </div>
        {error && (
          <div style={{ color: '#c00', marginBottom: 12, fontSize: 14 }}>{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          {mode === 'upload' && (
            <div style={{ marginBottom: 16 }}>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                style={{ marginBottom: 12 }}
              />
              {file && <span style={{ fontSize: 14 }}>{file.name}</span>}
            </div>
          )}
          {mode === 'paste' && (
            <div style={{ marginBottom: 16 }}>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste content here..."
                rows={6}
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                }}
              />
            </div>
          )}
          {mode === 'camera' && (
            <div style={{ marginBottom: 16, color: '#666' }}>
              Camera capture would open device. For demo, use Upload or Paste.
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={scanHandwriting}
              onChange={(e) => setScanHandwriting(e.target.checked)}
            />
            <span>Scan handwriting</span>
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                border: '1px solid #ddd',
                borderRadius: 6,
                background: '#fff',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                (mode === 'upload' && !file) ||
                (mode === 'paste' && !pastedText.trim())
              }
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: 6,
                background: '#1976d2',
                color: '#fff',
              }}
            >
              {isLoading ? 'Uploading...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import React from 'react'

interface SidebarProps {
  onUpload: () => void
  onCamera: () => void
  onPaste: () => void
  onHistory: () => void
}

export function Sidebar({ onUpload, onCamera, onPaste, onHistory }: SidebarProps) {
  return (
    <aside
      style={{
        width: 200,
        borderRight: '1px solid #e0e0e0',
        padding: 16,
        background: '#fafafa',
      }}
    >
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          type="button"
          onClick={onUpload}
          style={navButtonStyle}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={onCamera}
          style={navButtonStyle}
        >
          Camera
        </button>
        <button
          type="button"
          onClick={onPaste}
          style={navButtonStyle}
        >
          Paste
        </button>
        <button
          type="button"
          onClick={onHistory}
          style={navButtonStyle}
        >
          History
        </button>
      </nav>
    </aside>
  )
}

const navButtonStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #ddd',
  borderRadius: 6,
  background: '#fff',
  textAlign: 'left',
}

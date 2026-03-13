import React, { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '../types'

interface AIChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  messages: ChatMessage[]
  onSendMessage: (content: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

export function AIChatSidebar({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading,
  error,
}: AIChatSidebarProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await onSendMessage(text)
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 360,
        maxWidth: '90vw',
        height: '100%',
        background: '#fff',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>AI Assistant</h2>
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
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {messages.length === 0 && !isLoading && !error && (
          <p style={{ color: '#666', fontSize: 14 }}>
            Send a message to start the conversation.
          </p>
        )}
        {error && (
          <div style={{ color: '#c00', fontSize: 14, padding: 8, background: '#ffebee' }}>
            {error}
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
            <span style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
              {msg.role === 'user' ? 'You' : 'Assistant'}
            </span>
            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', padding: 8, color: '#666' }}>
            Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={handleSubmit}
        style={{
          padding: 16,
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: 6,
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: 6,
              background: '#1976d2',
              color: '#fff',
            }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

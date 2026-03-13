import React, { useState } from 'react'

export function AuthPanel({
  mode,
  onModeChange,
  onSubmit,
  loading,
  error,
}: {
  mode: 'login' | 'register'
  onModeChange: (m: 'login' | 'register') => void
  onSubmit: (email: string, password: string) => Promise<void>
  loading: boolean
  error: string | null
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => onModeChange('login')}
          style={{
            padding: '8px 14px',
            border: '1px solid #ddd',
            borderRadius: 8,
            background: mode === 'login' ? '#e3f2fd' : '#fff',
          }}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => onModeChange('register')}
          style={{
            padding: '8px 14px',
            border: '1px solid #ddd',
            borderRadius: 8,
            background: mode === 'register' ? '#e3f2fd' : '#fff',
          }}
        >
          Register
        </button>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
        {mode === 'login' ? 'Welcome back' : 'Create your account'}
      </h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Sign in to access your documents.
      </p>

      {error && (
        <div style={{ color: '#c00', marginBottom: 12, background: '#ffebee', padding: 10, borderRadius: 8 }}>
          {error}
        </div>
      )}

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          await onSubmit(email.trim(), password)
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#444' }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#444' }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }}
            />
          </label>
          <button
            type="submit"
            disabled={loading || !email.trim() || password.length < 8}
            style={{
              padding: '10px 14px',
              border: 'none',
              borderRadius: 8,
              background: '#1976d2',
              color: '#fff',
              fontWeight: 700,
              marginTop: 4,
            }}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  )
}


const BASE_URL = import.meta.env.VITE_API_URL ?? ''

const TOKEN_KEY = 'sf_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (!token) localStorage.removeItem(TOKEN_KEY)
  else localStorage.setItem(TOKEN_KEY, token)
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  const token = getToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error((errBody as { message?: string }).message ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export const api = {
  async register(email: string, password: string) {
    return request<import('../types').AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async login(email: string, password: string) {
    return request<import('../types').AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async me() {
    return request<import('../types').MeResponse>('/api/auth/me')
  },

  async logout() {
    return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
  },

  async listDocuments() {
    return request<import('../types').ListDocumentsResponse>('/api/documents')
  },

  async createDocument(title?: string) {
    return request<import('../types').CreateDocumentResponse>('/api/documents', {
      method: 'POST',
      body: JSON.stringify({ title }),
    })
  },

  async exportCsv(documentId: string) {
    const token = getToken()
    const url = `${BASE_URL}/api/documents/${documentId}/export/csv`
    const res = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new Error((errBody as { message?: string }).message ?? res.statusText)
    }
    return res.text()
  },

  async importCsv(documentId: string, csv: string, sheetId?: string) {
    return request<{ ok: boolean; document: import('../types').DocumentData }>(
      `/api/documents/${documentId}/import/csv`,
      {
        method: 'POST',
        body: JSON.stringify({ csv, sheetId }),
      }
    )
  },

  async getDocument(id: string) {
    return request<import('../types').GetDocumentResponse>(`/api/documents/${id}`)
  },

  async putDocument(id: string, document: import('../types').DocumentData) {
    return request<{ ok: boolean }>(`/api/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ document }),
    })
  },

  async chat(messages: import('../types').ChatMessage[]) {
    return request<import('../types').ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    })
  },

  async uploadFile(file: File) {
    const form = new FormData()
    form.append('file', file)
    const url = `${BASE_URL}/api/upload`
    const token = getToken()
    const res = await fetch(url, {
      method: 'POST',
      body: form,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }, // no Content-Type so browser sets multipart boundary
    })
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new Error((errBody as { message?: string }).message ?? res.statusText)
    }
    return res.json() as Promise<import('../types').UploadResponse>
  },

  async uploadText(text: string, scanHandwriting?: boolean) {
    return request<import('../types').UploadResponse>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ text, scanHandwriting: !!scanHandwriting }),
    })
  },
}

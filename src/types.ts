// Shared types for API contracts and app state

export interface CellFormat {
  bold?: boolean
  italic?: boolean
}

export interface CellData {
  value: string
  format?: CellFormat
  raw?: string
}

export interface SheetData {
  id: string
  name: string
  cells: Record<string, CellData> // key: "row,col" e.g. "0,0"
}

export interface DocumentData {
  id: string
  name?: string
  sheets: SheetData[]
  activeSheetId: string
}

// API request/response types
export interface GetDocumentResponse {
  document: DocumentData
}

export interface PutDocumentRequest {
  document: DocumentData
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
}

export interface ChatResponse {
  message: ChatMessage
}

export interface UploadResponse {
  success: boolean
  message?: string
  data?: { text?: string; extracted?: string }
}

export interface AuthUser {
  id: string
  email: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface MeResponse {
  user: AuthUser
}

export interface DocumentListItem {
  id: string
  title: string | null
  updated_at: string
  created_at: string
}

export interface ListDocumentsResponse {
  documents: DocumentListItem[]
}

export interface CreateDocumentResponse {
  document: DocumentData
}

export function cellKey(row: number, col: number): string {
  return `${row},${col}`
}

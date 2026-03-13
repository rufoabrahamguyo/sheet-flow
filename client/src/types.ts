// Shared types for API contracts and app state

export type HorizontalAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'middle' | 'bottom'
export type NumberFormat = 'general' | 'number' | 'currency' | 'percentage' | 'date'

export interface CellFormat {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  fontFamily?: string
  fontSize?: number
  fontColor?: string
  fillColor?: string
  horizontalAlign?: HorizontalAlign
  verticalAlign?: VerticalAlign
  wrapText?: boolean
  numberFormat?: NumberFormat
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

// Receipt extraction (document intelligence)
export interface ReceiptLineItem {
  itemName: string
  quantity: number
  unitPrice: number
  amount: number
  category: string
}

export interface ReceiptExtractResult {
  date?: string
  supplier?: string
  total?: number | null
  currency?: string | null
  lineItems: ReceiptLineItem[]
  error?: string
}

// M-Pesa analysis
export interface MpesaTransaction {
  date: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  category?: string
}

export interface MpesaAnalysisResult {
  transactions: MpesaTransaction[]
  summary: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    transactionCount: number
  }
  insight: string
}

// Business report
export interface ReportResult {
  financialSummary: {
    monthlyRevenue?: number | null
    monthlyExpenses?: number | null
    profitLoss?: number | null
    currency?: string
  } | null
  insights: string[]
  narrative: string
}

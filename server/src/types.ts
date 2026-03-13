export interface CellFormat {
  bold?: boolean
  italic?: boolean
}

export interface CellData {
  value: string
  format?: CellFormat
}

export interface SheetData {
  id: string
  name: string
  cells: Record<string, CellData>
}

export interface DocumentData {
  id: string
  name?: string
  sheets: SheetData[]
  activeSheetId: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

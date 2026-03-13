import { Router, Request, Response } from 'express'
import { getDocumentForUser } from '../db.js'
import type { AuthedRequest } from '../middleware/auth.js'
import { optionalAuth } from '../middleware/auth.js'
import { callGeminiText } from '../lib/gemini.js'

const router = Router()

const ROWS = 25
const COLS = 15
const COL_LETTERS = 'ABCDEFGHIJKLMNO'.split('')

function sheetToTableText(sheet: { cells: Record<string, { value?: string }> }, sheetName: string): string {
  const lines: string[] = [`Sheet: ${sheetName}`]
  for (let r = 0; r < ROWS; r++) {
    const row: string[] = []
    for (let c = 0; c < COLS; c++) {
      const key = `${r},${c}`
      const cell = sheet.cells[key]
      row.push((cell?.value ?? '').trim() || '')
    }
    if (row.some((c) => c)) lines.push(row.join('\t'))
  }
  return lines.join('\n')
}

const REPORT_PROMPT = `You are a business data analyst. Below is spreadsheet data from a small business (possibly receipts, M-Pesa, or manual entries).

Return a JSON object (no markdown, no code fence) with exactly these keys:
1. "financialSummary": { "monthlyRevenue": number or null, "monthlyExpenses": number or null, "profitLoss": number or null, "currency": "KES" }
2. "insights": [ "string", "string" ] - 2 to 4 short bullet insights (e.g. "Best selling: X", "Highest expense: Y", "Cash flow trend: Z")
3. "narrative": "One short paragraph (2-3 sentences) with a notable finding, e.g. 'Inventory costs increased by 30% this month, reducing your profit margin.'"

If the data is empty or not financial, set financialSummary fields to null and write insights/narrative based on what you can infer. Use only the data provided.`

router.post('/generate', optionalAuth, async (req: Request, res: Response) => {
  const docId = (req.body as { documentId?: string })?.documentId
  if (!docId || typeof docId !== 'string') {
    res.status(400).json({ message: 'Body must include documentId' })
    return
  }
  const r = req as AuthedRequest
  const doc = await getDocumentForUser(r.user.id, docId)
  if (!doc) {
    res.status(404).json({ message: 'Document not found' })
    return
  }
  const tables = doc.sheets
    .map((s) => sheetToTableText(s, s.name))
    .join('\n\n')
  const dataBlob = tables || 'No data in spreadsheet.'
  try {
    const raw = await callGeminiText([
      { role: 'user', parts: [{ text: `${REPORT_PROMPT}\n\n---\n${dataBlob}` }] },
    ])

    // Gemini sometimes wraps JSON in ```json fences or adds prose; try hard to extract the JSON object.
    let jsonText = raw
    const fenceMatch = raw.match(/```json([\s\S]*?)```/i)
    if (fenceMatch && fenceMatch[1]) {
      jsonText = fenceMatch[1]
    } else {
      const firstBrace = raw.indexOf('{')
      const lastBrace = raw.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonText = raw.slice(firstBrace, lastBrace + 1)
      }
    }
    const cleaned = jsonText.replace(/^```\w*\n?|\n?```$/g, '').trim()

    let parsed: { financialSummary?: object | null; insights?: string[]; narrative?: string }
    try {
      parsed = JSON.parse(cleaned) as typeof parsed
    } catch {
      parsed = { financialSummary: undefined, insights: [], narrative: raw.slice(0, 500) }
    }
    res.json({
      success: true,
      financialSummary: parsed.financialSummary ?? null,
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      narrative: typeof parsed.narrative === 'string' ? parsed.narrative : '',
    })
  } catch (e) {
    console.error('Report generate error:', e)
    res.status(500).json({
      message: e instanceof Error ? e.message : 'Report generation failed',
    })
  }
})

export default router

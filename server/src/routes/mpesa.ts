import { Router, Request, Response } from 'express'
import multer from 'multer'
import { optionalAuth } from '../middleware/auth.js'
import { callGeminiText } from '../lib/gemini.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

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

/** Simple parser: look for lines with numbers that could be amounts (KES or plain). */
function parseMpesaText(text: string): MpesaTransaction[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  const transactions: MpesaTransaction[] = []
  const amountRegex = /([+-]?)\s*([\d,]+(?:\.\d{2})?)\s*(?:KES)?/i
  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})/

  for (const line of lines) {
    const trimmed = line.trim()
    const match = trimmed.match(amountRegex)
    if (!match) continue
    const sign = match[1]
    const amountStr = (match[2] ?? '0').replace(/,/g, '')
    const amount = parseFloat(amountStr) || 0
    if (amount <= 0) continue
    const isCredit = sign === '+' || /credit|received|deposit|paybill|buy goods|sent to you/i.test(trimmed)
    const dateMatch = trimmed.match(dateRegex)
    const date = dateMatch ? dateMatch[1]! : ''
    transactions.push({
      date: date || 'Unknown',
      description: trimmed.slice(0, 120),
      amount,
      type: isCredit ? 'credit' : 'debit',
    })
  }
  return transactions
}

/** Categorize and aggregate; get insight from Gemini. */
async function analyzeTransactions(transactions: MpesaTransaction[]): Promise<MpesaAnalysisResult> {
  const totalRevenue = transactions
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0)
  const netProfit = totalRevenue - totalExpenses

  let insight = ''
  const key = process.env.GEMINI_API_KEY
  if (key && transactions.length > 0) {
    try {
      const sample = transactions.slice(0, 15).map((t) => `${t.date} ${t.description} ${t.type} ${t.amount}`).join('\n')
      const prompt = `You are a business analyst. Based on this M-Pesa transaction summary:
- Total revenue (credits): ${totalRevenue.toLocaleString()} KES
- Total expenses (debits): ${totalExpenses.toLocaleString()} KES
- Net: ${netProfit.toLocaleString()} KES
- Sample transactions:\n${sample}

Write ONE short sentence (under 30 words) summarizing the business's M-Pesa activity this period. Example: "Your business received KES 145,000 in sales this month through M-Pesa."`
      insight = await callGeminiText([{ role: 'user', parts: [{ text: prompt }] }])
    } catch (e) {
      console.error('Gemini insight error:', e)
      insight = `Revenue: KES ${totalRevenue.toLocaleString()}. Expenses: KES ${totalExpenses.toLocaleString()}. Net: KES ${netProfit.toLocaleString()}.`
    }
  } else {
    insight = `Revenue: KES ${totalRevenue.toLocaleString()}. Expenses: KES ${totalExpenses.toLocaleString()}. Net: KES ${netProfit.toLocaleString()}.`
  }

  return {
    transactions,
    summary: {
      totalRevenue,
      totalExpenses,
      netProfit,
      transactionCount: transactions.length,
    },
    insight: insight.trim() || 'No insight generated.',
  }
}

router.post(
  '/analyze',
  optionalAuth,
  upload.single('file'),
  async (req: Request, res: Response) => {
    let text = ''
    if (req.file) {
      text = req.file.buffer.toString('utf-8')
    } else {
      const body = req.body as { text?: string }
      if (typeof body?.text === 'string') text = body.text
    }
    if (!text.trim()) {
      res.status(400).json({ message: 'Send a file (multipart) or JSON body with "text" (M-Pesa statement content)' })
      return
    }
    try {
      const transactions = parseMpesaText(text)
      const result = await analyzeTransactions(transactions)
      res.json({ success: true, ...result })
    } catch (e) {
      console.error('M-Pesa analyze error:', e)
      res.status(500).json({
        message: e instanceof Error ? e.message : 'M-Pesa analysis failed',
      })
    }
  }
)

export default router

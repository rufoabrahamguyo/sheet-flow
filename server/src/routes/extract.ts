import { Router, Request, Response } from 'express'
import multer from 'multer'
import { optionalAuth } from '../middleware/auth.js'
import { callGeminiWithImage } from '../lib/gemini.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

const RECEIPT_PROMPT = `You are a document intelligence system. Analyze this receipt or invoice image and extract structured data.
Return a single JSON object (no markdown, no code block) with this exact structure:
{
  "date": "YYYY-MM-DD or original date string",
  "supplier": "vendor or store name",
  "total": number or null,
  "currency": "e.g. KES, USD or null",
  "lineItems": [
    { "itemName": "string", "quantity": number, "unitPrice": number, "amount": number, "category": "Inventory|Utilities|Transport|Supplies|Other" }
  ]
}
If you cannot read the image or it is not a receipt/invoice, return {"error": "Could not parse receipt"} with empty lineItems.`

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

function parseReceiptJson(text: string): ReceiptExtractResult {
  const cleaned = text.replace(/^```\w*\n?|\n?```$/g, '').trim()
  try {
    const obj = JSON.parse(cleaned) as ReceiptExtractResult
    if (!Array.isArray(obj.lineItems)) obj.lineItems = []
    return obj
  } catch {
    return { lineItems: [], error: 'Invalid extraction response' }
  }
}

router.post('/receipt', optionalAuth, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: 'Upload an image file (receipt or invoice)' })
    return
  }
  const mime = req.file.mimetype
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
    res.status(400).json({ message: 'File must be JPEG, PNG, or WebP' })
    return
  }
  const base64 = req.file.buffer.toString('base64')
  try {
    const raw = await callGeminiWithImage(base64, mime, RECEIPT_PROMPT)
    const result = parseReceiptJson(raw)
    if (result.error && result.lineItems.length === 0) {
      res.status(422).json({ message: result.error, result })
      return
    }
    res.json({ success: true, result })
  } catch (e) {
    console.error('Extract receipt error:', e)
    res.status(500).json({
      message: e instanceof Error ? e.message : 'Receipt extraction failed',
    })
  }
})

export default router

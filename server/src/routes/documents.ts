import { Router, Request, Response } from 'express'
import {
  createDocumentForUser,
  getDocumentForUser,
  listDocumentsForUser,
  putDocumentForUser,
} from '../db.js'
import { validateDocumentId, validatePutDocumentBody } from '../middleware/validation.js'
import type { DocumentData } from '../types.js'
import type { AuthedRequest } from '../middleware/auth.js'
import { z } from 'zod'

const router = Router()

function createDefaultDocument(id: string): DocumentData {
  return {
    id,
    sheets: [
      { id: 'sheet-1', name: 'Sheet 1', cells: {} },
      { id: 'sheet-2', name: 'Sheet 2', cells: {} },
    ],
    activeSheetId: 'sheet-1',
  }
}

function newDocId(): string {
  return `doc_${crypto.randomUUID()}`
}

router.get('/', async (req: Request, res: Response) => {
  const r = req as AuthedRequest
  const items = await listDocumentsForUser(r.user.id)
  res.json({ documents: items })
})

router.post('/', async (req: Request, res: Response) => {
  const r = req as AuthedRequest
  const title = typeof req.body?.title === 'string' ? (req.body.title as string).slice(0, 200) : 'Untitled spreadsheet'
  const id = newDocId()
  const doc: DocumentData = { ...createDefaultDocument(id), id, name: title }
  await createDocumentForUser(r.user.id, doc)
  res.status(201).json({ document: doc })
})

router.get('/:id/export/csv', validateDocumentId, async (req: Request, res: Response) => {
  const r = req as AuthedRequest
  const id = req.params.id as string
  const doc = await getDocumentForUser(r.user.id, id)
  if (!doc) return res.status(404).json({ message: 'Document not found' })
  const sheet = doc.sheets.find((s) => s.id === doc.activeSheetId) ?? doc.sheets[0]
  const rows = 25
  const cols = 15
  const lines: string[] = []
  for (let rr = 0; rr < rows; rr++) {
    const fields: string[] = []
    for (let cc = 0; cc < cols; cc++) {
      const v = sheet?.cells?.[`${rr},${cc}`]?.value ?? ''
      fields.push(v.includes('"') || v.includes(',') || v.includes('\n') ? `"${v.replaceAll('"', '""')}"` : v)
    }
    lines.push(fields.join(','))
  }
  const csv = lines.join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${(doc.name ?? id).replaceAll('"', '')}.csv"`)
  res.status(200).send(csv)
})

const importSchema = z.object({
  sheetId: z.string().optional(),
  csv: z.string().min(1),
})

router.post('/:id/import/csv', validateDocumentId, async (req: Request, res: Response) => {
  const r = req as AuthedRequest
  const id = req.params.id as string
  const doc = await getDocumentForUser(r.user.id, id)
  if (!doc) return res.status(404).json({ message: 'Document not found' })

  const parsed = importSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid CSV import payload' })

  const { csv, sheetId } = parsed.data
  const targetSheetId = sheetId ?? doc.activeSheetId
  const target = doc.sheets.find((s) => s.id === targetSheetId)
  if (!target) return res.status(400).json({ message: 'Invalid sheetId' })

  const text = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows = text.split('\n').slice(0, 25).map((line) => line.split(','))
  const nextCells = { ...target.cells }
  for (let rr = 0; rr < rows.length; rr++) {
    const row = rows[rr]!
    for (let cc = 0; cc < Math.min(row.length, 15); cc++) {
      const value = row[cc] ?? ''
      nextCells[`${rr},${cc}`] = { ...(nextCells[`${rr},${cc}`] ?? { value: '' }), value }
    }
  }
  const nextSheets = doc.sheets.map((s) => (s.id === target.id ? { ...s, cells: nextCells } : s))
  const nextDoc: DocumentData = { ...doc, sheets: nextSheets }
  await putDocumentForUser(r.user.id, nextDoc)
  res.json({ ok: true, document: nextDoc })
})

router.get('/:id', validateDocumentId, async (req: Request, res: Response) => {
  const r = req as AuthedRequest
  const id = req.params.id as string
  const doc = await getDocumentForUser(r.user.id, id)

  // Back-compat: GET /api/documents/default creates the per-user default doc
  if (!doc && id === 'default') {
    const document = createDefaultDocument(id)
    createDocumentForUser(r.user.id, document)
    res.json({ document })
    return
  }

  if (!doc) {
    res.status(404).json({ message: 'Document not found' })
    return
  }
  res.json({ document: doc })
})

router.put('/:id', validateDocumentId, validatePutDocumentBody, async (req: Request, res: Response) => {
  const r = req as AuthedRequest
  const id = req.params.id as string
  const { document } = req.body as { document: DocumentData }
  if (document.id !== id) {
    res.status(400).json({ message: 'Document id in URL and body must match' })
    return
  }
  await putDocumentForUser(r.user.id, document)
  res.json({ ok: true })
})

export default router

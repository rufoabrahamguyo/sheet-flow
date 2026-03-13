import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

export function validateChatBody(req: Request, res: Response, next: NextFunction): void {
  const schema = z.object({
    messages: z
      .array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string().min(1).max(20_000),
        })
      )
      .min(1),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid chat payload (messages array required, min 1 message)' })
    return
  }
  next()
}

export function validateDocumentId(req: Request, res: Response, next: NextFunction): void {
  const id = req.params.id
  if (!id || typeof id !== 'string' || id.length > 200) {
    res.status(400).json({ message: 'Invalid document id' })
    return
  }
  next()
}

const cellFormatSchema = z
  .object({
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    underline: z.boolean().optional(),
    strikethrough: z.boolean().optional(),
    fontFamily: z.string().max(100).optional(),
    fontSize: z.number().int().min(8).max(200).optional(),
    fontColor: z.string().max(50).optional(),
    fillColor: z.string().max(50).optional(),
    horizontalAlign: z.enum(['left', 'center', 'right']).optional(),
    verticalAlign: z.enum(['top', 'middle', 'bottom']).optional(),
    wrapText: z.boolean().optional(),
    numberFormat: z.enum(['general', 'number', 'currency', 'percentage', 'date']).optional(),
  })
  .optional()

export function validatePutDocumentBody(req: Request, res: Response, next: NextFunction): void {
  const schema = z.object({
    document: z.object({
      id: z.string().min(1).max(200),
      name: z.string().max(200).optional(),
      activeSheetId: z.string().min(1).max(200),
      sheets: z.array(
        z.object({
          id: z.string().min(1).max(200),
          name: z.string().min(1).max(200),
          cells: z.record(
            z.object({
              value: z.string().max(50_000),
              raw: z.string().max(50_000).optional(),
              format: cellFormatSchema,
            })
          ),
        })
      ),
    }),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid document payload' })
    return
  }
  next()
}

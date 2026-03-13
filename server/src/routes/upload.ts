import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

function maybeMulter(req: Request, res: Response, next: NextFunction): void {
  const contentType = req.headers['content-type'] ?? ''
  if (contentType.includes('multipart/form-data')) {
    upload.single('file')(req, res, next)
  } else {
    next()
  }
}

// Stub: in production, integrate OCR/handwriting scan (e.g. Google Vision, Azure)
function stubExtractText(_buffer: Buffer, _scanHandwriting: boolean): string {
  return 'Extracted text placeholder. Integrate OCR/handwriting API for production.'
}

router.post('/', maybeMulter, (req: Request, res: Response) => {
  if (req.file) {
    const scanHandwriting = req.body?.scanHandwriting === 'true' || req.body?.scanHandwriting === true
    const extracted = stubExtractText(req.file.buffer, scanHandwriting)
    return res.json({
      success: true,
      data: { text: extracted, extracted },
    })
  }
  const body = req.body as { text?: string; scanHandwriting?: boolean } | undefined
  if (body && typeof body.text === 'string') {
    const scanHandwriting = Boolean(body.scanHandwriting)
    const text = body.text
    if (scanHandwriting) {
      return res.json({
        success: true,
        data: { text, extracted: stubExtractText(Buffer.from(text), true) },
      })
    }
    return res.json({ success: true, data: { text } })
  }
  res.status(400).json({ message: 'Send either a file (multipart) or JSON body with text' })
})

export default router

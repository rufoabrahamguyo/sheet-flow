import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { pinoHttp } from 'pino-http'
import { initDb } from './db.js'
import documentsRouter from './routes/documents.js'
import chatRouter from './routes/chat.js'
import uploadRouter from './routes/upload.js'
import authRouter from './routes/auth.js'
import { errorHandler } from './middleware/errorHandler.js'
import {
  validateDocumentId,
  validateChatBody,
} from './middleware/validation.js'
import { requireAuth } from './middleware/auth.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

app.disable('x-powered-by')
app.use(helmet())
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
)
app.use(express.json({ limit: '1mb' }))

app.use(
  pinoHttp({
    redact: ['req.headers.authorization'],
  })
)

app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 240,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })
)

app.use(
  '/api/auth',
  rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }),
  authRouter
)

// Temporary: protect documents behind auth now; will be fully refactored per-user in next todo.
app.use('/api/documents', requireAuth, validateDocumentId, documentsRouter)
app.use('/api/chat', validateChatBody, chatRouter)
app.use('/api/upload', uploadRouter)

app.use(errorHandler)

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`)
    })
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to initialise database', err)
    process.exit(1)
  })

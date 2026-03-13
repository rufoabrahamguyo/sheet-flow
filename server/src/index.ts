import 'dotenv/config'
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
import extractRouter from './routes/extract.js'
import mpesaRouter from './routes/mpesa.js'
import reportRouter from './routes/report.js'
import { errorHandler } from './middleware/errorHandler.js'
import { validateChatBody } from './middleware/validation.js'
import { optionalAuth } from './middleware/auth.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173"

app.disable("x-powered-by")
app.use(helmet())
app.use(
	cors({
		origin: corsOrigin,
		credentials: true,
	}),
)
app.use(express.json({ limit: "1mb" }))

app.use(
	pinoHttp({
		redact: ["req.headers.authorization"],
	}),
)

app.use(
	rateLimit({
		windowMs: 60_000,
		limit: 240,
		standardHeaders: "draft-7",
		legacyHeaders: false,
	}),
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

// Auth disabled for now; optionalAuth treats no token as anonymous user
app.use('/api/documents', optionalAuth, documentsRouter)
app.use('/api/chat', optionalAuth, validateChatBody, chatRouter)
app.use('/api/upload', optionalAuth, uploadRouter)
app.use('/api/extract', extractRouter)
app.use('/api/mpesa', mpesaRouter)
app.use('/api/report', reportRouter)

app.use(errorHandler)

initDb()
  .then(() => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(
        `Server running at http://localhost:${port} (MongoDB db: ${
          process.env.MONGODB_DB ?? 'sheetflow'
        })`
      )
    })
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to initialise database', err)
    process.exit(1)
  })

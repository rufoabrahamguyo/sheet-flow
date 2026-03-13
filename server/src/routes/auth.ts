import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getDb } from '../db.js'
import { signAccessToken } from '../auth/jwt.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'

const router = Router()

const registerSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
})

const loginSchema = registerSchema

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

router.post('/register', async (req: Request, res: Response) => {
  if (!process.env.JWT_SECRET) {
    res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET not set' })
    return
  }
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid registration payload (need email and password min 8 chars)' })
    return
  }
  const { email, password } = parsed.data
  try {
    const db = getDb()
    const existing = (await db.collection('users').findOne({ email })) as { id: string } | null
    if (existing) {
      res.status(409).json({ message: 'Email already registered' })
      return
    }

    const password_hash = bcrypt.hashSync(password, 12)
    const id = newId('usr')
    const now = new Date().toISOString()
    await db.collection('users').insertOne({
      id,
      email,
      password_hash,
      createdAt: now,
    })

    const token = signAccessToken({ sub: id, email })
    res.json({ token, user: { id, email } })
  } catch (err: unknown) {
    const mongoErr = err as { code?: number }
    if (mongoErr?.code === 11000) {
      res.status(409).json({ message: 'Email already registered' })
      return
    }
    console.error('Register error', err)
    res.status(500).json({ message: 'Registration failed. Check server logs.' })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  if (!process.env.JWT_SECRET) {
    res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET not set' })
    return
  }
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid login payload' })
    return
  }
  const { email, password } = parsed.data
  try {
    const db = getDb()
    const row = (await db
      .collection('users')
      .findOne({ email }, { projection: { _id: 0, id: 1, email: 1, password_hash: 1 } })) as
      | { id: string; email: string; password_hash: string }
      | null
    if (!row) {
      res.status(401).json({ message: 'Invalid email or password' })
      return
    }

    const ok = bcrypt.compareSync(password, row.password_hash)
    if (!ok) {
      res.status(401).json({ message: 'Invalid email or password' })
      return
    }

    const token = signAccessToken({ sub: row.id, email: row.email })
    res.json({ token, user: { id: row.id, email: row.email } })
  } catch (err) {
    console.error('Login error', err)
    res.status(500).json({ message: 'Login failed. Check server logs.' })
  }
})

router.post('/logout', (_req: Request, res: Response) => {
  // JWT logout is client-side (delete token). Server can implement revocation later.
  res.json({ ok: true })
})

router.get('/me', requireAuth, (req: Request, res: Response) => {
  const r = req as AuthedRequest
  res.json({ user: { id: r.user.id, email: r.user.email } })
})

export default router


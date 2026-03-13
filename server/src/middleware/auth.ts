import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../auth/jwt.js'

export type AuthedRequest = Request & { user: { id: string; email: string } }

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization ?? ''
  const [scheme, token] = auth.split(' ')
  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ message: 'Missing Bearer token' })
    return
  }
  try {
    const payload = verifyAccessToken(token)
    ;(req as AuthedRequest).user = { id: payload.sub, email: payload.email }
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}


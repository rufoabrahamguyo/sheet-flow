import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../auth/jwt.js'

export type AuthedRequest = Request & { user: { id: string; email: string } }

const ANONYMOUS = { id: 'anonymous', email: 'anonymous' }

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

/** Sets req.user from JWT if present, otherwise anonymous. Use for routes that work without login. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const auth = req.headers.authorization ?? ''
  const [scheme, token] = auth.split(' ')
  if (scheme === 'Bearer' && token) {
    try {
      const payload = verifyAccessToken(token)
      ;(req as AuthedRequest).user = { id: payload.sub, email: payload.email }
    } catch {
      ;(req as AuthedRequest).user = ANONYMOUS
    }
  } else {
    ;(req as AuthedRequest).user = ANONYMOUS
  }
  next()
}


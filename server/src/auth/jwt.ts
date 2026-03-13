import jwt from 'jsonwebtoken'

export type JwtPayload = {
  sub: string
  email: string
}

const jwtSecret = process.env.JWT_SECRET ?? ''

export function assertJwtConfigured(): void {
  if (!jwtSecret) {
    throw new Error('JWT_SECRET must be set')
  }
}

export function signAccessToken(payload: JwtPayload): string {
  assertJwtConfigured()
  return jwt.sign(payload, jwtSecret, { expiresIn: '15m' })
}

export function verifyAccessToken(token: string): JwtPayload {
  assertJwtConfigured()
  return jwt.verify(token, jwtSecret) as JwtPayload
}


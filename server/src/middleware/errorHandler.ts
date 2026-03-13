import type { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? 500
  const message = err.message ?? 'Internal Server Error'
  console.error('[error]', status, message, err.stack)
  res.status(status).json({ message })
}

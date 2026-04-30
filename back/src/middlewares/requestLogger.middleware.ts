import type { NextFunction, Request, Response } from 'express';

/**
 * Logs each incoming HTTP request (method + URL) and query string parameters when present.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const stamp = new Date().toISOString();
  console.log(`[${stamp.split('T')[1].split('.')[0]}] ${req.method} ${req.originalUrl}`);

  if (Object.keys(req.query).length > 0) {
    console.log('  query:', req.query);
  }

  next();
}

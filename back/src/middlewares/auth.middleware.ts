import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      /** Set by {@link requireAuth} after a valid Bearer JWT. */
      auth?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Requires `Authorization: Bearer <jwt>`. Sets `req.auth` on success.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Se requiere autenticación (Bearer token).' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Token vacío.' });
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
    return;
  }

  req.auth = { userId: payload.sub, email: payload.email };
  next();
}

/**
 * Same as {@link requireAuth}, then ensures the URL `:id` matches the authenticated user.
 */
export function requireAuthSelf(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const id = req.params.id as string;
    if (!req.auth || id !== req.auth.userId) {
      res.status(403).json({ error: 'No podés modificar otro usuario.' });
      return;
    }
    next();
  });
}

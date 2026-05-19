import jwt from 'jsonwebtoken';

const DEFAULT_EXPIRES = '7d';

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set (min 16 characters) in production.');
  }
  console.warn('[auth] JWT_SECRET not set; using insecure dev default. Set JWT_SECRET in .env.');
  return 'dev-only-insecure-jwt-secret';
}

/**
 * Issues a signed JWT for an authenticated user.
 */
export function signAccessToken(userId: string, email: string): string {
  const payload: AccessTokenPayload = { sub: userId, email };
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? DEFAULT_EXPIRES) as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, getSecret(), { expiresIn });
}

/**
 * Verifies a Bearer JWT and returns the payload, or null if invalid/expired.
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as jwt.JwtPayload & AccessTokenPayload;
    if (typeof decoded.sub !== 'string' || typeof decoded.email !== 'string') {
      return null;
    }
    return { sub: decoded.sub, email: decoded.email };
  } catch {
    return null;
  }
}

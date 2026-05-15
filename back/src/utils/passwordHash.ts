import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SALT_BYTES = 16;
const KEY_BYTES = 32;

/**
 * Derives a salted key from a plain password (scrypt).
 */
export function hashPassword(plain: string): string {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derived = scryptSync(plain, salt, KEY_BYTES) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

/**
 * Verifies a plain password against a stored `salt:hexkey` string from {@link hashPassword}.
 */
export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, keyHex] = stored.split(':');
  if (!salt || !keyHex) return false;
  const derived = scryptSync(plain, salt, KEY_BYTES) as Buffer;
  let keyBuf: Buffer;
  try {
    keyBuf = Buffer.from(keyHex, 'hex');
  } catch {
    return false;
  }
  if (keyBuf.length !== derived.length) return false;
  return timingSafeEqual(keyBuf, derived);
}

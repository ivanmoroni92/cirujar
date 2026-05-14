import { randomBytes, scryptSync } from 'crypto';

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

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Resolves .env from common dev layouts (monorepo root vs back package cwd).
 * Must be imported before any module that reads process.env.
 */
const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'back', '.env'),
  path.resolve(__dirname, '..', '.env'),
];

for (const envPath of candidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

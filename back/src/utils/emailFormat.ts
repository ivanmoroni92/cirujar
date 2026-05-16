/**
 * Loose format check: local part, @, domain with at least one dot (e.g. example.com).
 */
export function isValidEmailFormat(email: string): boolean {
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

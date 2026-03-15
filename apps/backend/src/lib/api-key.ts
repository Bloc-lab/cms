import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Hash API key with SHA-256 for secure storage.
 * Use this when storing a newly generated key.
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey, 'utf8').digest('hex');
}

/**
 * Constant-time comparison to verify API key against stored hash.
 * Prevents timing attacks.
 */
export function verifyApiKey(apiKey: string, storedHash: string): boolean {
  const inputHash = hashApiKey(apiKey);
  if (inputHash.length !== storedHash.length) return false;
  try {
    return timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

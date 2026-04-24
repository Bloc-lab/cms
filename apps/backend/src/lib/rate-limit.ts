import { LRUCache } from 'lru-cache';

type Counter = { count: number; resetAt: number };

const WINDOW_MS = parseInt(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS ?? '60000', 10); // 60s
const MAX_REQUESTS = parseInt(process.env.PUBLIC_RATE_LIMIT_MAX ?? '10', 10); // per window

const cache = new LRUCache<string, Counter>({
  max: 10_000,
  ttl: WINDOW_MS * 2,
});

export function rateLimitKeyFromRequest(info: { ip?: string; tenantId?: string; route?: string }): string {
  const ip = (info.ip ?? '').trim() || 'unknown';
  const tenant = (info.tenantId ?? '').trim() || 'unknown';
  const route = (info.route ?? '').trim() || 'unknown';
  return `${route}:${tenant}:${ip}`;
}

export function checkAndBumpRateLimit(key: string): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = cache.get(key);
  if (!existing || existing.resetAt <= now) {
    cache.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (existing.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { ok: false, retryAfterSeconds };
  }

  existing.count += 1;
  cache.set(key, existing);
  return { ok: true };
}


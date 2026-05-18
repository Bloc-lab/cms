import { LRUCache } from 'lru-cache';

const TTL_MS = parseInt(process.env.CACHE_TTL_MS ?? '300000', 10); // 5 min default
const MAX_ITEMS = parseInt(process.env.CACHE_MAX_ITEMS ?? '1000', 10);

/**
 * In-memory LRU cache for content API responses.
 * Key format: `tenantId:slug:lang` for pages.
 */
const contentCache = new LRUCache<string, object>({
  max: MAX_ITEMS,
  ttl: TTL_MS,
});

export function getCached<T>(key: string): T | undefined {
  return contentCache.get(key) as T | undefined;
}

export function setCached<T extends object>(key: string, value: T): void {
  contentCache.set(key, value);
}

/**
 * Invalidate all cached content for a tenant.
 * Call this on any PUT/POST/DELETE in admin for that tenant.
 */
export function invalidateTenantCache(tenantId: string): void {
  const keysToDelete: string[] = [];
  for (const key of contentCache.keys()) {
    if (key.startsWith(`${tenantId}:`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach((k) => contentCache.delete(k));
}

export function cacheKey(tenantId: string, slug: string, lang: string): string {
  return `${tenantId}:${slug}:${lang}`;
}

/** SHA-256 hex of API key → tenant id (avoids scanning all tenants on every request). */
export function apiKeyTenantCacheKey(keyHash: string): string {
  return `apikey:${keyHash}`;
}

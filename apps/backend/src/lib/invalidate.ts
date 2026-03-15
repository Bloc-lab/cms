/**
 * Call this from admin routes after any PUT/POST/DELETE that affects content.
 * Invalidates in-memory cache for the tenant so clients see changes immediately.
 */
import { invalidateTenantCache } from './cache.js';

export function invalidateContentCache(tenantId: string): void {
  invalidateTenantCache(tenantId);
}

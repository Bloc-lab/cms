import type { FastifyReply } from 'fastify';

/** CDN / browser cache for published public GET responses (seconds). */
const PUBLIC_S_MAXAGE = parseInt(process.env.PUBLIC_CACHE_S_MAXAGE ?? '60', 10);
const PUBLIC_SWR = parseInt(process.env.PUBLIC_CACHE_STALE_WHILE_REVALIDATE ?? '300', 10);

/**
 * Cache published read-only API responses at the edge (Vercel CDN).
 * Preview and admin responses must use {@link setNoStoreCacheHeaders}.
 */
export function setPublicCacheHeaders(reply: FastifyReply, vary: string | string[]): void {
  const varyList = Array.isArray(vary) ? vary : [vary];
  reply.header('Cache-Control', `public, s-maxage=${PUBLIC_S_MAXAGE}, stale-while-revalidate=${PUBLIC_SWR}`);
  reply.header('Vary', varyList.join(', '));
}

export function setNoStoreCacheHeaders(reply: FastifyReply): void {
  reply.header('Cache-Control', 'no-store');
}

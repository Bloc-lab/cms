import crypto from 'node:crypto';
import { supabaseAdmin } from './supabase.js';

const PREVIEW_TTL_MS = 60 * 60 * 1000; // 1 hour

export function hashPreviewToken(plain: string): string {
  return crypto.createHash('sha256').update(plain, 'utf8').digest('hex');
}

/** Query / copy-paste: trim, optional decodeURIComponent, lowercase 64-char hex tokens (hash must match insert). */
export function normalizePlainPreviewToken(plain: string): string {
  let t = plain.trim();
  try {
    if (/%[0-9A-Fa-f]{2}/.test(t)) {
      t = decodeURIComponent(t);
    }
  } catch {
    /* keep t */
  }
  t = t.trim();
  if (/^[0-9a-fA-F]{64}$/.test(t)) {
    return t.toLowerCase();
  }
  return t;
}

/** Fastify may expose repeated query keys as string[]. */
export function parsePreviewTokenFromRequestQuery(query: Record<string, unknown>): string | undefined {
  const raw = query.previewToken ?? query.preview_token;
  if (Array.isArray(raw)) {
    const first = raw.find((x): x is string => typeof x === 'string' && x.trim().length > 0);
    return first ? normalizePlainPreviewToken(first) : undefined;
  }
  if (typeof raw === 'string' && raw.trim()) {
    return normalizePlainPreviewToken(raw);
  }
  return undefined;
}

export function generatePreviewTokenPlain(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function insertContentPreviewToken(params: {
  tenantId: string;
  pageId: string;
  userId: string | undefined;
}): Promise<{ plainToken: string; expiresAt: string }> {
  if (!supabaseAdmin) throw new Error('Server misconfiguration');
  const plainToken = generatePreviewTokenPlain();
  const tokenHash = hashPreviewToken(plainToken);
  const expiresAt = new Date(Date.now() + PREVIEW_TTL_MS).toISOString();

  const row = {
    tenant_id: params.tenantId,
    page_id: params.pageId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by: params.userId ?? null,
  };

  let { error } = await supabaseAdmin.from('content_preview_tokens').insert(row);

  if (
    error &&
    params.userId &&
    isFkToAuthUsersError(error)
  ) {
    ({ error } = await supabaseAdmin.from('content_preview_tokens').insert({
      ...row,
      created_by: null,
    }));
  }

  if (error) {
    const msg = error.message ?? '';
    if (/does not exist|could not find the table/i.test(msg) || (error as { code?: string }).code === '42P01') {
      throw new Error('Preview tokens table missing - apply migration 011_content_preview_tokens.sql');
    }
    throw new Error(error.message);
  }

  return { plainToken, expiresAt };
}

function isFkToAuthUsersError(error: { message?: string; code?: string; details?: string }): boolean {
  const m = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
  if (error.code === '23503') return true;
  return /foreign key|violates foreign key constraint/i.test(m);
}

/**
 * Returns page_id from token if valid for this tenant and not expired; otherwise null.
 * @deprecated Prefer resolvePreviewFromPlainToken for public preview - token_hash is globally unique
 * and must not depend on the client sending the matching X-API-KEY.
 */
export async function resolvePreviewTokenPageId(
  tenantId: string,
  plainToken: string | undefined
): Promise<string | null> {
  const full = await resolvePreviewFromPlainToken(plainToken);
  if (!full) return null;
  if (full.tenantId !== tenantId) return null;
  return full.pageId;
}

export type PreviewTokenResolution = { tenantId: string; pageId: string };

export type PreviewResolveFailure = 'missing' | 'not_found' | 'expired' | 'no_service';

/**
 * Looks up preview by plain token. `token_hash` is UNIQUE - tenant comes from the row.
 */
export async function resolvePreviewFromPlainToken(
  plainToken: string | undefined
): Promise<PreviewTokenResolution | null> {
  const r = await resolvePreviewFromPlainTokenDetails(plainToken);
  return r.ok ? { tenantId: r.tenantId, pageId: r.pageId } : null;
}

export async function resolvePreviewFromPlainTokenDetails(
  plainToken: string | undefined
): Promise<
  | { ok: true; tenantId: string; pageId: string }
  | { ok: false; reason: PreviewResolveFailure }
> {
  if (!supabaseAdmin) {
    return { ok: false, reason: 'no_service' };
  }
  if (!plainToken?.trim()) {
    return { ok: false, reason: 'missing' };
  }

  const normalized = normalizePlainPreviewToken(plainToken);
  if (!normalized) {
    return { ok: false, reason: 'missing' };
  }

  const tokenHash = hashPreviewToken(normalized);

  const { data, error } = await supabaseAdmin
    .from('content_preview_tokens')
    .select('tenant_id, page_id, expires_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error) {
    const msg = error.message ?? '';
    if (/does not exist|could not find the table/i.test(msg) || (error as { code?: string }).code === '42P01') {
      return { ok: false, reason: 'not_found' };
    }
    return { ok: false, reason: 'not_found' };
  }

  const row = data as { tenant_id?: string; page_id?: string; expires_at?: string } | null;
  if (!row?.tenant_id || !row.page_id) {
    return { ok: false, reason: 'not_found' };
  }

  const exp = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  if (!exp || Number.isNaN(exp) || exp <= Date.now()) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, tenantId: row.tenant_id, pageId: row.page_id };
}

import crypto from 'node:crypto';
import { supabaseAdmin } from './supabase.js';

const PREVIEW_TTL_MS = 60 * 60 * 1000; // 1 hour

export function hashPreviewToken(plain: string): string {
  return crypto.createHash('sha256').update(plain, 'utf8').digest('hex');
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

  const { error } = await supabaseAdmin.from('content_preview_tokens').insert({
    tenant_id: params.tenantId,
    page_id: params.pageId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by: params.userId ?? null,
  });

  if (error) {
    const msg = error.message ?? '';
    if (/does not exist|could not find the table/i.test(msg) || (error as { code?: string }).code === '42P01') {
      throw new Error('Preview tokens table missing - apply migration 011_content_preview_tokens.sql');
    }
    throw new Error(error.message);
  }

  return { plainToken, expiresAt };
}

/**
 * Returns page_id from token if valid for this tenant and not expired; otherwise null.
 */
export async function resolvePreviewTokenPageId(
  tenantId: string,
  plainToken: string | undefined
): Promise<string | null> {
  if (!plainToken?.trim() || !supabaseAdmin) return null;
  const tokenHash = hashPreviewToken(plainToken.trim());

  const { data, error } = await supabaseAdmin
    .from('content_preview_tokens')
    .select('page_id')
    .eq('tenant_id', tenantId)
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) {
    const msg = error.message ?? '';
    if (/does not exist|could not find the table/i.test(msg) || (error as { code?: string }).code === '42P01') {
      return null;
    }
    return null;
  }

  return data?.page_id ?? null;
}

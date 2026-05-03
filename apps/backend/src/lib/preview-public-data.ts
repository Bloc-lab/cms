import { legacyContentKeyToStorageKey, sitePagesConfig, toPublicContentKey } from '@nase-cms/shared';
import { supabaseAdmin } from './supabase.js';
import { rowsToPublicContentMap } from './public-content-map.js';
import {
  DEFAULT_ADMIN_SITE_SETTINGS,
  toAdminSiteSettings,
  toDbAdminSiteSettings,
  toPublicSiteSettings,
  validateAndNormalizeAdminSiteSettings,
  type SiteSettingsAdmin,
} from './site-settings.js';

export function applyDraftToPublicMap(
  base: Record<string, string>,
  draftRows: Array<{ key: string; value: string | null }>
): Record<string, string> {
  const out = { ...base };
  for (const e of draftRows) {
    const raw = e.key;
    const v = e.value ?? '';
    if (raw.startsWith('admin.')) {
      out[raw] = v;
      continue;
    }
    const normalized = legacyContentKeyToStorageKey(raw);
    const publicKey = toPublicContentKey(normalized);
    out[publicKey] = v;
  }
  return out;
}

function deepMergeRecords(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (v === undefined) continue;
    const existing = out[k];
    if (
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      existing &&
      typeof existing === 'object' &&
      !Array.isArray(existing)
    ) {
      out[k] = deepMergeRecords(existing as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export type PreviewPayload = {
  lang: string;
  content: Record<string, string>;
  siteSettings?: ReturnType<typeof toPublicSiteSettings>;
};

/**
 * Merged published + draft content for one page and language (same shape as admin content-preview).
 */
export async function loadPreviewPayload(
  tenantId: string,
  pageId: string,
  lang: string
): Promise<PreviewPayload> {
  if (!supabaseAdmin) {
    throw new Error('Server misconfiguration');
  }
  if (!sitePagesConfig[pageId as keyof typeof sitePagesConfig]) {
    throw new Error('Unknown page');
  }

  const { data: publishedRows, error: pErr } = await supabaseAdmin
    .from('content_entries')
    .select('key, value')
    .eq('tenant_id', tenantId)
    .eq('lang', lang);

  if (pErr) {
    throw new Error(pErr.message);
  }

  const { data: draftRows, error: dErr } = await supabaseAdmin
    .from('content_entry_drafts')
    .select('key, value')
    .eq('tenant_id', tenantId)
    .eq('page_id', pageId)
    .eq('lang', lang);

  if (dErr && !/does not exist|could not find the table/i.test(dErr.message ?? '')) {
    throw new Error(dErr.message);
  }

  let content = rowsToPublicContentMap(publishedRows ?? []);
  if (draftRows?.length) {
    content = applyDraftToPublicMap(content, draftRows);
  }

  const out: PreviewPayload = { lang, content };

  if (pageId === 'main') {
    const { data: siteRow } = await supabaseAdmin
      .from('site_settings')
      .select(
        'template_id, theme_primary, theme_secondary1, theme_secondary2, cta_variant, cta_submit_label, cta_success_message, cta_form_layout, lead_notification_email, lead_formspree_url'
      )
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const publishedAdmin = siteRow
      ? toAdminSiteSettings(siteRow as Parameters<typeof toAdminSiteSettings>[0])
      : null;

    const { data: draftS } = await supabaseAdmin
      .from('site_settings_drafts')
      .select('settings')
      .eq('tenant_id', tenantId)
      .eq('page_id', 'main')
      .maybeSingle();

    let mergedAdmin: SiteSettingsAdmin;
    if (publishedAdmin && draftS?.settings && typeof draftS.settings === 'object') {
      const mergedRaw = deepMergeRecords(
        publishedAdmin as unknown as Record<string, unknown>,
        draftS.settings as Record<string, unknown>
      );
      const parsed = validateAndNormalizeAdminSiteSettings(mergedRaw);
      mergedAdmin = parsed.ok ? parsed.value : publishedAdmin;
    } else if (publishedAdmin) {
      mergedAdmin = publishedAdmin;
    } else if (draftS?.settings) {
      const parsed = validateAndNormalizeAdminSiteSettings(draftS.settings);
      mergedAdmin = parsed.ok ? parsed.value : DEFAULT_ADMIN_SITE_SETTINGS;
    } else {
      mergedAdmin = DEFAULT_ADMIN_SITE_SETTINGS;
    }

    const dbShape = toDbAdminSiteSettings(mergedAdmin);
    out.siteSettings = toPublicSiteSettings({
      template_id: dbShape.template_id,
      theme_primary: dbShape.theme_primary,
      theme_secondary1: dbShape.theme_secondary1,
      theme_secondary2: dbShape.theme_secondary2,
      cta_variant: dbShape.cta_variant,
      cta_submit_label: dbShape.cta_submit_label,
      cta_success_message: dbShape.cta_success_message,
      cta_form_layout: dbShape.cta_form_layout,
    });
  }

  return out;
}

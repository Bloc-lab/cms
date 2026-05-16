import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ADMIN_ENABLED_LANGS_KEY,
  ADMIN_SHOW_TRANSLATION_BADGES_KEY,
  getDefaultContentConfigForTemplate,
  resolveSeedValueByLang,
} from '@nase-cms/shared';

const ADMIN_KEYS_CS_ONLY = new Set([ADMIN_ENABLED_LANGS_KEY, ADMIN_SHOW_TRANSLATION_BADGES_KEY]);

export function parseSeedLangs(raw: string | undefined): string[] {
  if (!raw?.trim()) return ['cs', 'en'];
  const parts = raw
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (parts.length === 0) return ['cs', 'en'];
  if (!parts.includes('cs')) parts.unshift('cs');
  return [...new Set(parts)];
}

type Row = { tenant_id: string; key: string; lang: string; value: string; updated_at: string };

/**
 * Naplní content_entries výchozími hodnotami pro danou šablonu (shared resolveSeedValueByLang).
 */
export async function seedDefaultTemplateContent(
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    templateId: string;
    langs?: string[];
    overwrite?: boolean;
  }
): Promise<{ upsertedCount: number }> {
  const langs = params.langs ?? parseSeedLangs(undefined);
  const overwrite = params.overwrite === true;
  const templateId = params.templateId;
  const tenantId = params.tenantId;

  const configKeys = Object.keys(getDefaultContentConfigForTemplate(templateId));
  const now = new Date().toISOString();
  const candidateRows: Row[] = [];

  for (const lang of langs) {
    for (const key of configKeys) {
      if (ADMIN_KEYS_CS_ONLY.has(key) && lang !== 'cs') continue;
      let value = resolveSeedValueByLang(key, lang, templateId);
      if (key === ADMIN_ENABLED_LANGS_KEY) {
        value = 'cs,en';
      }
      if (key === ADMIN_SHOW_TRANSLATION_BADGES_KEY) value = '1';
      candidateRows.push({
        tenant_id: tenantId,
        key,
        lang,
        value,
        updated_at: now,
      });
    }
  }

  let rows = candidateRows;
  if (!overwrite) {
    const { data: existing, error: readErr } = await supabase
      .from('content_entries')
      .select('key,lang,value')
      .eq('tenant_id', tenantId);
    if (readErr) {
      throw new Error(`Cannot read content_entries: ${readErr.message}`);
    }
    const hasValue = new Set<string>();
    for (const row of existing ?? []) {
      const r = row as { key: string; lang: string; value: string | null };
      if ((r.value ?? '').trim().length > 0) {
        hasValue.add(`${r.key}\0${r.lang}`);
      }
    }
    rows = candidateRows.filter((r) => !hasValue.has(`${r.key}\0${r.lang}`));
  }

  if (rows.length === 0) {
    return { upsertedCount: 0 };
  }

  const chunk = 200;
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk);
    const { error } = await supabase.from('content_entries').upsert(part, {
      onConflict: 'tenant_id,key,lang',
    });
    if (error) {
      throw new Error(`content_entries upsert: ${error.message}`);
    }
  }

  return { upsertedCount: rows.length };
}

/**
 * Vyplní content_entries výchozími texty (REDUS) pro jednoho tenanta.
 *
 * Vyžaduje service role klíč (obchází RLS).
 *
 * Použití z apps/backend:
 *   npx tsx scripts/seed-tenant-default-content.ts
 *
 * Proměnné prostředí (apps/backend/.env nebo export):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SEED_TENANT_ID=<uuid> NEBO
 *   SEED_ADMIN_SUBDOMAIN=vas-tenant   (sloupec tenants.admin_subdomain)
 *
 * Volitelně:
 *   SEED_LANGS=cs,en,it     (výchozí cs,en,it)
 *   SEED_OVERWRITE=1        (přepíše i neprázdné hodnoty)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  ADMIN_ENABLED_LANGS_KEY,
  ADMIN_SHOW_TRANSLATION_BADGES_KEY,
  CMS_TEMPLATE_ARCH,
  getDefaultContentConfigForTemplate,
  resolveSeedValueByLang,
} from '@nase-cms/shared';

const ADMIN_KEYS_CS_ONLY = new Set([ADMIN_ENABLED_LANGS_KEY, ADMIN_SHOW_TRANSLATION_BADGES_KEY]);

function parseLangs(raw: string | undefined): string[] {
  if (!raw?.trim()) return ['cs', 'en', 'it'];
  const parts = raw
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (parts.length === 0) return ['cs', 'en', 'it'];
  if (!parts.includes('cs')) parts.unshift('cs');
  return [...new Set(parts)];
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const tenantIdEnv = process.env.SEED_TENANT_ID?.trim();
  const subdomain = process.env.SEED_ADMIN_SUBDOMAIN?.trim().toLowerCase();
  const langs = parseLangs(process.env.SEED_LANGS);
  const overwrite = process.env.SEED_OVERWRITE === '1' || process.env.SEED_OVERWRITE === 'true';

  if (!url || !serviceKey) {
    console.error('Chybí SUPABASE_URL nebo SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let tenantId = tenantIdEnv ?? '';
  if (!tenantId) {
    if (!subdomain) {
      console.error('Nastavte SEED_TENANT_ID nebo SEED_ADMIN_SUBDOMAIN.');
      process.exit(1);
    }
    const { data, error } = await supabase.from('tenants').select('id').eq('admin_subdomain', subdomain).single();
    if (error || !data?.id) {
      console.error('Tenant nenalezen pro admin_subdomain:', subdomain, error?.message ?? '');
      process.exit(1);
    }
    tenantId = data.id;
  }

  let templateId = 'template1';
  {
    const { data: siteRow } = await supabase
      .from('site_settings')
      .select('template_id')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    templateId = ((siteRow as { template_id?: string | null } | null)?.template_id ?? '').trim() || 'template1';
  }

  const configKeys = Object.keys(getDefaultContentConfigForTemplate(templateId));

  type Row = { tenant_id: string; key: string; lang: string; value: string; updated_at: string };
  const now = new Date().toISOString();
  const candidateRows: Row[] = [];
  for (const lang of langs) {
    for (const key of configKeys) {
      if (ADMIN_KEYS_CS_ONLY.has(key) && lang !== 'cs') continue;
      let value = resolveSeedValueByLang(key, lang, templateId);
      if (key === ADMIN_ENABLED_LANGS_KEY) {
        value = templateId === CMS_TEMPLATE_ARCH ? 'cs,en' : 'cs,en,it';
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
      console.error('Nelze načíst obsah:', readErr.message);
      process.exit(1);
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
    console.log('Nic k doplnění - všechny hodnoty už jsou vyplněné (nebo použij SEED_OVERWRITE=1).');
    return;
  }

  const chunk = 200;
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk);
    const { error } = await supabase.from('content_entries').upsert(part, {
      onConflict: 'tenant_id,key,lang',
    });
    if (error) {
      console.error('Upsert chyba:', error.message);
      process.exit(1);
    }
  }
  console.log(`Hotovo: upsert ${rows.length} řádků, tenant ${tenantId}, jazyky: ${langs.join(', ')}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

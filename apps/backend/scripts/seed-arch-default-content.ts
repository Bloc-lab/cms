/**
 * Naplní databázi výchozími texty šablony ARCH.
 * Zdroj textů: balíček shared (`arch-flat-cs.ts`, `arch-flat-en.ts` → úložné klíče přes `arch-public-defaults`).
 *
 * Vyžaduje Supabase service role (obchází RLS).
 *
 * Z apps/backend:
 *   npx tsx scripts/seed-arch-default-content.ts
 *
 * Nebo:
 *   npm run seed:arch -w @nase-cms/backend
 *
 * Proměnné prostředí (`.env` v apps/backend nebo export):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SEED_TENANT_ID=<uuid>  NEBO  SEED_ADMIN_SUBDOMAIN=subdomena
 *
 * Volitelně:
 *   SEED_LANGS=cs,en           (výchozí cs, en)
 *   SEED_OVERWRITE=1           přepíše i už neprázdné hodnoty
 *   SEED_SYNC_SITE_TEMPLATE=1  nastaví site_settings.template_id na arch u daného tenanta
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { CMS_TEMPLATE_ARCH } from '@nase-cms/shared';
import {
  parseSeedLangs,
  seedDefaultTemplateContent,
} from '../src/lib/seed-default-template-content.js';

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const tenantIdEnv = process.env.SEED_TENANT_ID?.trim();
  const subdomain = process.env.SEED_ADMIN_SUBDOMAIN?.trim().toLowerCase();
  const langs = parseSeedLangs(process.env.SEED_LANGS);
  const overwrite = process.env.SEED_OVERWRITE === '1' || process.env.SEED_OVERWRITE === 'true';
  const syncTemplate = process.env.SEED_SYNC_SITE_TEMPLATE === '1' || process.env.SEED_SYNC_SITE_TEMPLATE === 'true';

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

  const templateId = CMS_TEMPLATE_ARCH;

  if (syncTemplate) {
    const { data: existing } = await supabase
      .from('site_settings')
      .select('tenant_id')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (existing) {
      const { error: uErr } = await supabase
        .from('site_settings')
        .update({ template_id: templateId })
        .eq('tenant_id', tenantId);
      if (uErr) {
        console.error('Nepodařilo se aktualizovat template_id:', uErr.message);
        process.exit(1);
      }
      console.log(`site_settings.template_id → ${templateId}`);
    } else {
      const { error: iErr } = await supabase.from('site_settings').insert({
        tenant_id: tenantId,
        template_id: templateId,
      });
      if (iErr) {
        console.error('Nepodařilo se vytvořit site_settings:', iErr.message);
        process.exit(1);
      }
      console.log(`Vytvořen site_settings řádek s template_id → ${templateId}`);
    }
  }

  try {
    const { upsertedCount } = await seedDefaultTemplateContent(supabase, {
      tenantId,
      templateId,
      langs,
      overwrite,
    });
    if (upsertedCount === 0) {
      console.log('Nic k doplnění - všechny hodnoty už jsou vyplněné (nebo použij SEED_OVERWRITE=1).');
      return;
    }
    console.log(
      `Hotovo (ARCH): upsert ${upsertedCount} řádků, tenant ${tenantId}, šablona ${templateId}, jazyky: ${langs.join(', ')}.`
    );
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

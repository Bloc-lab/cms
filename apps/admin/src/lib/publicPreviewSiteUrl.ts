import { CMS_TEMPLATE_ARCH } from '@nase-cms/shared';

/** Trailing slashes stripped; empty → undefined */
function normalizeSiteBase(raw: string | undefined): string | undefined {
  const t = raw?.trim();
  if (!t) return undefined;
  return t.replace(/\/$/, '');
}

/**
 * JSON map of `{ "template_id": "https://site.example.com" }` keyed by lowercase `site_settings.template_id`.
 * Overrides per-template env vars below; useful for many templates without one env each.
 *
 * Example: `VITE_PUBLIC_SITE_URL_MAP={"template1":"https://mono.example.com","arch":"https://arch.example.com"}`
 */
function parseTemplateUrlMap(): Record<string, string> {
  const raw = import.meta.env.VITE_PUBLIC_SITE_URL_MAP?.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const key = k.trim().toLowerCase();
      if (!key) continue;
      const base = normalizeSiteBase(typeof v === 'string' ? v : undefined);
      if (base) out[key] = base;
    }
    return out;
  } catch {
    return {};
  }
}

/** Default MONO content template id used when unset. */
export const CMS_DEFAULT_TEMPLATE_ID = 'template1';

/**
 * Base URL for the public site iframe preview (`VITE_PUBLIC_*` env only).
 *
 * Resolution order per `template_id` (lowercased): `VITE_PUBLIC_SITE_URL_MAP[template]` → optional
 * `VITE_PUBLIC_SITE_URL_TEMPLATE1` | `VITE_PUBLIC_SITE_URL_ARCH` → `VITE_PUBLIC_SITE_URL`.
 */
export function resolvePublicPreviewSiteBase(templateId: string | null | undefined): string | undefined {
  const id = ((templateId ?? '').trim().toLowerCase() || CMS_DEFAULT_TEMPLATE_ID) as string;

  const fromMap = parseTemplateUrlMap()[id];
  if (fromMap) return fromMap;

  const env = import.meta.env;
  let specific: string | undefined;

  switch (id) {
    case CMS_DEFAULT_TEMPLATE_ID:
      specific = normalizeSiteBase(env.VITE_PUBLIC_SITE_URL_TEMPLATE1);
      break;
    case CMS_TEMPLATE_ARCH:
      specific = normalizeSiteBase(env.VITE_PUBLIC_SITE_URL_ARCH);
      break;
    default:
      specific = undefined;
  }

  return specific ?? normalizeSiteBase(env.VITE_PUBLIC_SITE_URL);
}

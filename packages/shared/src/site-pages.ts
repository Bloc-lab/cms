import type { ContentConfig } from './types.js';

/** One logical site page: URL segment plus content fields (as in “Site content”). */
export interface SitePageDefinition {
  /**
   * Path segment without a leading slash. Empty string = home page (/).
   * For example `o-nas` maps to `/o-nas`.
   */
  slug: string;
  /** Label shown in the admin UI */
  label: string;
  /** Same field shape as the old single flat map — keys like `hero.title` */
  fields: ContentConfig;
}

export type SitePagesConfigMap = Record<string, SitePageDefinition>;

/** DB key separator: `pageId` + ':' + `fieldKey` → e.g. `main:hero.title` */
export function storageKey(pageId: string, fieldKey: string): string {
  return `${pageId}:${fieldKey}`;
}

export function parseStorageKey(fullKey: string): { pageId: string; fieldKey: string } | null {
  const idx = fullKey.indexOf(':');
  if (idx <= 0) return null;
  return { pageId: fullKey.slice(0, idx), fieldKey: fullKey.slice(idx + 1) };
}

/** Legacy flat keys (no pageId) → new shape. `admin.*` keys stay unchanged. */
export function legacyContentKeyToStorageKey(key: string): string {
  if (key.startsWith('admin.')) return key;
  if (parseStorageKey(key)) return key;
  if (key.startsWith('about.')) return storageKey('about', key);
  return storageKey('main', key);
}

export function normalizeLoadedContentKey(rawKey: string): string {
  if (rawKey.startsWith('admin.')) return rawKey;
  return legacyContentKeyToStorageKey(rawKey);
}

function normalizeSlugSegment(s: string): string {
  return s.replace(/^\/+|\/+$/g, '').toLowerCase();
}

/**
 * Najde id stránky v konfiguraci podle slugu z DB (např. `o-nas`, `` pro home).
 */
export function getPageIdBySlug(slug: string, sitePages: SitePagesConfigMap): string | undefined {
  const n = normalizeSlugSegment(slug);
  for (const [id, def] of Object.entries(sitePages)) {
    const d = normalizeSlugSegment(def.slug);
    if (d === n) return id;
  }
  if (n === '' || n === 'home' || n === 'index') return 'main';
  return undefined;
}

export function flattenSitePagesFields(sitePages: SitePagesConfigMap): ContentConfig {
  const out: ContentConfig = {};
  for (const [pageId, def] of Object.entries(sitePages)) {
    for (const [fieldKey, field] of Object.entries(def.fields)) {
      out[storageKey(pageId, fieldKey)] = field;
    }
  }
  return out;
}

/**
 * Veřejné API vrací pro domovskou stránku stejné klíče jako dřív (`hero.title`).
 * Ostatní stránky: `about.text` z úložiště `about:about.text`.
 */
export function toPublicContentKey(storageKeyStr: string): string {
  const p = parseStorageKey(storageKeyStr);
  if (!p) return storageKeyStr;
  if (p.pageId === 'main') return p.fieldKey;
  if (p.fieldKey.startsWith(`${p.pageId}.`)) return p.fieldKey;
  return `${p.pageId}.${p.fieldKey}`;
}

export interface RawContentEntry {
  key: string;
  lang: string;
  value: string | null;
}

function hasNewStorageFormat(key: string): boolean {
  if (key.startsWith('admin.')) return false;
  return parseStorageKey(key) !== null;
}

/**
 * Sloučí řádky z API do mapy `úplnýKlíč:lang` → hodnota.
 * Nový formát (`main:hero.title`) přepíše starý (`hero.title`) pro stejný jazyk.
 */
export function mergeContentEntriesMap(entries: RawContentEntry[]): Record<string, string> {
  const sorted = [...entries].sort((a, b) => {
    const aNew = hasNewStorageFormat(a.key);
    const bNew = hasNewStorageFormat(b.key);
    if (aNew && !bNew) return 1;
    if (!aNew && bNew) return -1;
    return 0;
  });
  const map: Record<string, string> = {};
  for (const e of sorted) {
    const nk = normalizeLoadedContentKey(e.key);
    map[`${nk}:${e.lang}`] = e.value ?? '';
  }
  return map;
}

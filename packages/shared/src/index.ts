/**
 * Content config shared across CMS apps.
 * Defines named keys for content management - admin panel generates form from this,
 * frontend uses it for type-safe API response.
 */

export type { ContentField, ContentConfig } from './types.js';
export {
  type SitePageDefinition,
  type SitePagesConfigMap,
  type RawContentEntry,
  storageKey,
  parseStorageKey,
  legacyContentKeyToStorageKey,
  normalizeLoadedContentKey,
  getPageIdBySlug,
  flattenSitePagesFields,
  toPublicContentKey,
  mergeContentEntriesMap,
} from './site-pages.js';

import type { ContentConfig } from './types.js';
import { flattenSitePagesFields, type SitePagesConfigMap } from './site-pages.js';

/** Content keys for admin branding (sidebar, login via public API). */
export const ADMIN_SITE_NAME_KEY = 'admin.siteName';
export const ADMIN_LOGO_KEY = 'admin.logo';

/** Branding / CMS metadata (název, logo) — samostatná stránka v administraci. */
export const metadataConfig: ContentConfig = {
  [ADMIN_SITE_NAME_KEY]: {
    label: 'Název webu',
    type: 'text',
    required: true,
  },
  [ADMIN_LOGO_KEY]: {
    label: 'Logo webu (CMS)',
    type: 'image',
    required: true,
  },
};

/**
 * Všechny stránky a jejich pole. Klíč (`main`, `about`, …) je id stránky v CMS;
 * `slug` určuje URL; pole jsou jako dřív uvnitř jedné stránky (`hero.title`, …).
 */
export const sitePagesConfig: SitePagesConfigMap = {
  main: {
    slug: '',
    label: 'Domů',
    fields: {
      'hero.title': { label: 'Hlavní nadpis' },
      'hero.subtitle': { label: 'Podnadpis' },
      'hero.image': { label: 'Hlavní obrázek', type: 'image' },
      'services.title': { label: 'Služby - nadpis' },
      'services.desc': { label: 'Služby - popis', type: 'textarea' },
      'contact.phone': { label: 'Telefon' },
      'contact.email': { label: 'Email' },
      'contact.address': { label: 'Adresa' },
    },
  },
  about: {
    slug: 'o-nas',
    label: 'O nás',
    fields: {
      'about.text': { label: 'O nás', type: 'textarea' },
    },
  },
};

/** Flat mapa pro validaci / uložení: `main:hero.title`, `about:about.text`, … */
export const siteContentConfig: ContentConfig = flattenSitePagesFields(sitePagesConfig);

/** Kompletní konfigurace polí (metadata + obsah). */
export const defaultConfig: ContentConfig = {
  ...metadataConfig,
  ...siteContentConfig,
};

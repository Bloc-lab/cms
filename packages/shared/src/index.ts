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
export const ADMIN_ENABLED_LANGS_KEY = 'admin.enabledLangs';
export const ADMIN_SHOW_TRANSLATION_BADGES_KEY = 'admin.showTranslationBadges';

/** Branding / CMS metadata (název, logo) — samostatná stránka v administraci. */
export const metadataConfig: ContentConfig = {
  [ADMIN_SITE_NAME_KEY]: {
    label: 'Název webu',
    type: 'text',
    required: true,
    helpText: 'Zobrazí se v administraci a může se použít i na webu (např. ve footeru).',
  },
  [ADMIN_LOGO_KEY]: {
    label: 'Logo webu (CMS)',
    type: 'image',
    required: true,
    helpText: 'Použije se v administraci (sidebar, přihlášení). Doporučeno PNG/SVG s průhledným pozadím.',
  },
  [ADMIN_ENABLED_LANGS_KEY]: {
    label: 'Jazyky webu',
    type: 'text',
    helpText: 'Interní nastavení administrace (zobrazuje se jako přepínače).',
    advanced: true,
  },
  [ADMIN_SHOW_TRANSLATION_BADGES_KEY]: {
    label: 'Upozornění na chybějící překlady',
    type: 'text',
    helpText: 'Interní nastavení administrace.',
    advanced: true,
  },
};

/**
 * Globální údaje, které se nemají míchat do editace konkrétní stránky.
 * Klíče pro kontakty zachováváme v public tvaru `contact.*` (ukládá se do `main:contact.*`),
 * aby se nezměnil kontrakt pro web.
 */
export const siteSettingsConfig: ContentConfig = {
  'main:contact.phone': {
    label: 'Telefon',
    type: 'text',
    helpText: 'Zobrazí se v kontaktní sekci webu.',
    section: 'Kontakt',
  },
  'main:contact.email': {
    label: 'Email',
    type: 'text',
    helpText: 'Hlavní kontaktní email.',
    section: 'Kontakt',
  },
  'main:contact.address': {
    label: 'Adresa',
    type: 'textarea',
    helpText: 'Zobrazí se ve footeru nebo v kontaktní sekci.',
    section: 'Kontakt',
  },
  'company.name': {
    label: 'Název firmy',
    type: 'text',
    helpText: 'Nepovinné.',
    section: 'Firma',
  },
  'company.ico': {
    label: 'IČO',
    type: 'text',
    helpText: 'Nepovinné.',
    section: 'Firma',
    advanced: true,
  },
  'company.dic': {
    label: 'DIČ',
    type: 'text',
    helpText: 'Nepovinné.',
    section: 'Firma',
    advanced: true,
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
      'hero.title': {
        label: 'Hlavní nadpis',
        section: 'Hero',
        helpText: 'Krátký a výstižný nadpis. Doporučeno max. 50 znaků.',
        recommendedMaxLength: 50,
        maxLength: 80,
        placeholder: 'Např. Pomáháme firmám růst',
      },
      'hero.subtitle': {
        label: 'Podnadpis',
        section: 'Hero',
        helpText: 'Jedna věta, která vysvětlí hodnotu. Doporučeno max. 120 znaků.',
        recommendedMaxLength: 120,
        maxLength: 180,
        placeholder: 'Např. Weby a marketing, které dávají smysl',
      },
      'hero.image': {
        label: 'Hlavní obrázek',
        type: 'image',
        section: 'Hero',
        helpText: 'Ideálně široký obrázek (min. 1600 px).',
      },
      'services.title': {
        label: 'Nadpis sekce Služby',
        section: 'Služby',
        recommendedMaxLength: 40,
        maxLength: 80,
        placeholder: 'Naše služby',
      },
      'services.desc': {
        label: 'Popis sekce Služby',
        type: 'textarea',
        section: 'Služby',
        helpText: 'Krátký odstavec. Doporučeno max. 300 znaků.',
        recommendedMaxLength: 300,
        maxLength: 600,
      },
    },
  },
  about: {
    slug: 'o-nas',
    label: 'O nás',
    fields: {
      'about.text': {
        label: 'Text stránky',
        type: 'textarea',
        section: 'Obsah',
        helpText: 'Hlavní obsah stránky „O nás“.',
      },
    },
  },
};

/** Flat mapa pro validaci / uložení: `main:hero.title`, `about:about.text`, … */
export const siteContentConfig: ContentConfig = flattenSitePagesFields(sitePagesConfig);

/** Kompletní konfigurace polí (metadata + obsah). */
export const defaultConfig: ContentConfig = {
  ...metadataConfig,
  ...siteSettingsConfig,
  ...siteContentConfig,
};

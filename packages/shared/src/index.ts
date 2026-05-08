/**
 * Content config shared across CMS apps.
 * Defines named keys for content management - admin panel generates form from this,
 * frontend uses it for type-safe API response.
 */

export type { ContentField, ContentConfig } from './types.js';
export {
  REDUS_PUBLIC_DEFAULTS_CS,
  REDUS_PUBLIC_DEFAULTS_EN,
  resolveRedusSeedValue,
  resolveRedusSeedValueByLang,
} from './redus-public-defaults.js';
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
export const ADMIN_TAGLINE_KEY = 'admin.tagline';
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
  [ADMIN_TAGLINE_KEY]: {
    label: 'Tagline (krátký popisek)',
    type: 'text',
    helpText: 'Krátký text pod názvem webu (např. v headeru).',
    placeholder: 'Např. ÚČETNÍ A DAŇOVÁ KANCELÁŘ',
    recommendedMaxLength: 40,
    maxLength: 80,
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
  'nav.services': {
    label: 'Menu – Služby (label)',
    type: 'text',
    helpText: 'Text položky v hlavním menu (odkaz na sekci Služby na homepage).',
    section: 'Navigace',
    recommendedMaxLength: 18,
    maxLength: 40,
  },
  'nav.about': {
    label: 'Menu – O nás (label)',
    type: 'text',
    helpText: 'Text položky v hlavním menu (odkaz na stránku „O nás“).',
    section: 'Navigace',
    recommendedMaxLength: 18,
    maxLength: 40,
  },
  'nav.pricing': {
    label: 'Menu – Ceník (label)',
    type: 'text',
    helpText: 'Text položky v hlavním menu (odkaz na sekci Ceník).',
    section: 'Navigace',
    recommendedMaxLength: 18,
    maxLength: 40,
  },
  'nav.tax': {
    label: 'Menu – Daňové poradenství (label)',
    type: 'text',
    helpText: 'Text položky v hlavním menu (odkaz na sekci Daňové poradenství).',
    section: 'Navigace',
    recommendedMaxLength: 28,
    maxLength: 60,
  },
  'nav.ctaContact': {
    label: 'Menu – CTA tlačítko (label)',
    type: 'text',
    helpText: 'Text akčního tlačítka vpravo (odkaz #kontakt).',
    section: 'Navigace',
    recommendedMaxLength: 22,
    maxLength: 60,
  },

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
  'footer.blurb': {
    label: 'Text ve footeru (krátký popis)',
    type: 'textarea',
    helpText: 'Krátký text pod názvem webu ve footeru.',
    section: 'Footer',
    recommendedMaxLength: 200,
    maxLength: 600,
  },
  'footer.billing': {
    label: 'Fakturační údaje',
    type: 'textarea',
    helpText: 'Zobrazí se ve footeru. Můžete používat více řádků.',
    section: 'Footer',
  },
  'footer.headingContact': {
    label: 'Footer – nadpis „Kontaktní údaje“',
    type: 'text',
    helpText: 'Nadpis sloupce s adresou/telefonem/email.',
    section: 'Footer',
    recommendedMaxLength: 24,
    maxLength: 60,
  },
  'footer.headingBilling': {
    label: 'Footer – nadpis „Fakturační údaje“',
    type: 'text',
    helpText: 'Nadpis sloupce s fakturačními údaji.',
    section: 'Footer',
    recommendedMaxLength: 24,
    maxLength: 60,
  },
  'footer.linkedinHref': {
    label: 'Footer – LinkedIn odkaz (URL)',
    type: 'text',
    helpText: 'URL profilu/firemní stránky. Prázdné = použije se výchozí.',
    section: 'Footer',
    maxLength: 500,
    advanced: true,
  },
  'footer.linkPrivacyLabel': {
    label: 'Footer – odkaz 1 (label)',
    type: 'text',
    helpText: 'Např. Ochrana soukromí / Privacy policy.',
    section: 'Footer · odkazy',
    recommendedMaxLength: 22,
    maxLength: 60,
  },
  'footer.linkPrivacyHref': {
    label: 'Footer – odkaz 1 (href)',
    type: 'text',
    helpText: 'Cesta nebo URL (např. /ochrana-soukromi).',
    section: 'Footer · odkazy',
    maxLength: 500,
    advanced: true,
  },
  'footer.linkTermsLabel': {
    label: 'Footer – odkaz 2 (label)',
    type: 'text',
    helpText: 'Např. Obchodní podmínky / Terms & conditions.',
    section: 'Footer · odkazy',
    recommendedMaxLength: 22,
    maxLength: 60,
  },
  'footer.linkTermsHref': {
    label: 'Footer – odkaz 2 (href)',
    type: 'text',
    helpText: 'Cesta nebo URL (např. /obchodni-podminky).',
    section: 'Footer · odkazy',
    maxLength: 500,
    advanced: true,
  },
  'footer.copyright': {
    label: 'Copyright',
    type: 'text',
    helpText: 'Spodní řádek ve footeru.',
    section: 'Footer',
    recommendedMaxLength: 80,
    maxLength: 200,
  },

  'main:cta.form.submitLabel': {
    label: 'CTA formulář – text tlačítka (odeslat)',
    type: 'text',
    helpText: 'Text na submit tlačítku ve formuláři.',
    section: 'CTA · Formulář (UI)',
    recommendedMaxLength: 18,
    maxLength: 60,
  },
  'main:cta.form.sendingLabel': {
    label: 'CTA formulář – text při odesílání',
    type: 'text',
    helpText: 'Text na tlačítku během odesílání.',
    section: 'CTA · Formulář (UI)',
    recommendedMaxLength: 18,
    maxLength: 60,
    advanced: true,
  },
  'main:cta.form.successMessage': {
    label: 'CTA formulář – děkovná hláška po odeslání',
    type: 'textarea',
    helpText: 'Zobrazí se po úspěšném odeslání formuláře.',
    section: 'CTA · Formulář (UI)',
    recommendedMaxLength: 120,
    maxLength: 400,
    advanced: true,
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
  },
  'company.dic': {
    label: 'DIČ',
    type: 'text',
    helpText: 'Nepovinné.',
    section: 'Firma',
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
      'hero.enabled': {
        label: 'Zobrazit sekci Hero',
        type: 'choice',
        section: 'Hero',
        helpText: 'Skryje celou sekci na webu.',
        choices: [
          { value: 'show', label: 'Zobrazit' },
          { value: 'hide', label: 'Skrýt' },
        ],
        advanced: true,
      },
      'hero.badge': {
        label: 'Štítek nad nadpisem',
        section: 'Hero',
        helpText: 'Krátký text v badge (malý štítek nad hlavním nadpisem).',
        recommendedMaxLength: 60,
        maxLength: 120,
      },
      'hero.title': {
        label: 'Hlavní nadpis',
        section: 'Hero',
        helpText: 'Krátký a výstižný nadpis. Doporučeno max. 50 znaků.',
        recommendedMaxLength: 50,
        maxLength: 80,
        placeholder: 'Např. Pomáháme firmám růst',
      },
      'hero.titleAccent': {
        label: 'Zvýrazněné slovo v nadpisu',
        section: 'Hero',
        helpText: 'Část nadpisu, která se zvýrazní barvou (musí se v nadpisu vyskytovat).',
        recommendedMaxLength: 20,
        maxLength: 40,
        placeholder: 'Např. účetnictví',
      },
      'hero.subtitle': {
        label: 'Podnadpis',
        section: 'Hero',
        helpText: 'Jedna věta, která vysvětlí hodnotu. Doporučeno max. 120 znaků.',
        recommendedMaxLength: 120,
        maxLength: 180,
        placeholder: 'Např. Weby a marketing, které dávají smysl',
        advanced: true,
      },
      'hero.lead': {
        label: 'Perex (hlavní popis)',
        type: 'textarea',
        section: 'Hero',
        helpText: 'Krátký odstavec pod nadpisem.',
        recommendedMaxLength: 240,
        maxLength: 600,
      },
      'hero.image': {
        label: 'Hlavní obrázek',
        type: 'image',
        section: 'Hero',
        helpText: 'Ideálně široký obrázek (min. 1600 px).',
      },
      'hero.cardTitle': {
        label: 'Text karty na obrázku',
        section: 'Hero',
        helpText: 'Krátký text v malé kartě překryté přes obrázek.',
        recommendedMaxLength: 40,
        maxLength: 120,
      },
      'hero.ctaPrimary': {
        label: 'Primární tlačítko',
        section: 'Hero',
        helpText: 'Text hlavního CTA tlačítka.',
        recommendedMaxLength: 32,
        maxLength: 80,
      },
      'hero.ctaSecondary': {
        label: 'Sekundární tlačítko',
        section: 'Hero',
        helpText: 'Text vedlejšího CTA tlačítka.',
        recommendedMaxLength: 24,
        maxLength: 80,
      },
      'services.title': {
        label: 'Nadpis sekce Služby',
        section: 'Služby',
        recommendedMaxLength: 40,
        maxLength: 80,
        placeholder: 'Naše služby',
        advanced: true,
      },
      'services.desc': {
        label: 'Popis sekce Služby',
        type: 'textarea',
        section: 'Služby',
        helpText: 'Krátký odstavec. Doporučeno max. 300 znaků.',
        recommendedMaxLength: 300,
        maxLength: 600,
        advanced: true,
      },
      'services.sectionTitle': {
        label: 'Nadpis sekce',
        section: 'Služby',
        recommendedMaxLength: 60,
        maxLength: 120,
        placeholder: 'Např. Komplexní služby pro vaše podnikání',
      },
      'services.sectionDesc': {
        label: 'Popis sekce',
        type: 'textarea',
        section: 'Služby',
        recommendedMaxLength: 240,
        maxLength: 700,
      },
      'services.1.title': {
        label: 'Služba 1 – název',
        section: 'Služby',
        recommendedMaxLength: 40,
        maxLength: 100,
      },
      'services.1.desc': {
        label: 'Služba 1 – popis',
        type: 'textarea',
        section: 'Služby',
        recommendedMaxLength: 200,
        maxLength: 700,
      },
      'services.2.title': {
        label: 'Služba 2 – název',
        section: 'Služby',
        recommendedMaxLength: 40,
        maxLength: 100,
      },
      'services.2.desc': {
        label: 'Služba 2 – popis',
        type: 'textarea',
        section: 'Služby',
        recommendedMaxLength: 200,
        maxLength: 700,
      },
      'services.3.title': {
        label: 'Služba 3 – název',
        section: 'Služby',
        recommendedMaxLength: 40,
        maxLength: 100,
      },
      'services.3.desc': {
        label: 'Služba 3 – popis',
        type: 'textarea',
        section: 'Služby',
        recommendedMaxLength: 200,
        maxLength: 700,
      },
      'services.4.title': {
        label: 'Služba 4 – název',
        section: 'Služby',
        recommendedMaxLength: 40,
        maxLength: 100,
      },
      'services.4.desc': {
        label: 'Služba 4 – popis',
        type: 'textarea',
        section: 'Služby',
        recommendedMaxLength: 200,
        maxLength: 700,
      },
      'services.enabled': {
        label: 'Zobrazit sekci Služby',
        type: 'choice',
        section: 'Služby',
        helpText: 'Skryje celou sekci na webu.',
        choices: [
          { value: 'show', label: 'Zobrazit' },
          { value: 'hide', label: 'Skrýt' },
        ],
        advanced: true,
      },
      'why.title': {
        label: 'Nadpis sekce',
        section: 'Proč my',
        recommendedMaxLength: 60,
        maxLength: 120,
      },
      'why.text': {
        label: 'Popis sekce',
        type: 'textarea',
        section: 'Proč my',
        recommendedMaxLength: 260,
        maxLength: 900,
      },
      'why.bullet1': {
        label: 'Bod 1',
        section: 'Proč my',
        recommendedMaxLength: 40,
        maxLength: 120,
      },
      'why.bullet2': {
        label: 'Bod 2',
        section: 'Proč my',
        recommendedMaxLength: 40,
        maxLength: 120,
      },
      'why.bullet3': {
        label: 'Bod 3',
        section: 'Proč my',
        recommendedMaxLength: 40,
        maxLength: 120,
      },
      'why.quote': {
        label: 'Citát',
        type: 'textarea',
        section: 'Proč my',
        recommendedMaxLength: 220,
        maxLength: 900,
      },
      'why.quoteAuthor': {
        label: 'Autor citátu',
        section: 'Proč my',
        recommendedMaxLength: 60,
        maxLength: 160,
      },
      'why.image1': {
        label: 'Obrázek 1',
        type: 'image',
        section: 'Proč my',
        helpText: 'Levá/hlavní fotka v sekci.',
      },
      'why.image2': {
        label: 'Obrázek 2',
        type: 'image',
        section: 'Proč my',
        helpText: 'Doplňková fotka v sekci.',
      },
      'why.enabled': {
        label: 'Zobrazit sekci Proč my',
        type: 'choice',
        section: 'Proč my',
        helpText: 'Skryje celou sekci na webu.',
        choices: [
          { value: 'show', label: 'Zobrazit' },
          { value: 'hide', label: 'Skrýt' },
        ],
        advanced: true,
      },
      'pricing.enabled': {
        label: 'Zobrazit sekci Ceník',
        type: 'choice',
        section: 'Ceník',
        helpText: 'Skryje celý ceník (včetně tarifů) na webu.',
        choices: [
          { value: 'show', label: 'Zobrazit' },
          { value: 'hide', label: 'Skrýt' },
        ],
        advanced: true,
      },
      'pricing.billingMode': {
        label: 'Režim zobrazení cen',
        type: 'choice',
        section: 'Ceník',
        helpText:
          'Dvě varianty: přepínač měsíčně/ročně a u každé karty dvě ceny. Jen 3 karty: bez přepínače, u karty se zobrazí jedna cena (použije se roční, pokud je vyplněná, jinak měsíční).',
        choices: [
          { value: 'dual', label: 'Dvě varianty (měsíčně / ročně)' },
          { value: 'single', label: 'Jen 3 karty (jedna cena)' },
        ],
      },
      'pricing.title': {
        label: 'Ceník – nadpis (nad tarify)',
        section: 'Ceník',
        recommendedMaxLength: 40,
        maxLength: 120,
      },
      'pricing.teaser': {
        label: 'Ceník – úvodní text',
        type: 'textarea',
        section: 'Ceník',
        recommendedMaxLength: 220,
        maxLength: 800,
      },
      'pricing.billingMonthly': {
        label: 'Přepínač – měsíční fakturace',
        section: 'Ceník',
        helpText:
          'Použije se jen při režimu „Dvě varianty“. Text druhé volby přepínače (např. Měsíčně).',
        recommendedMaxLength: 24,
        maxLength: 60,
      },
      'pricing.billingYearly': {
        label: 'Přepínač – roční fakturace',
        section: 'Ceník',
        helpText:
          'Použije se jen při režimu „Dvě varianty“. Text první volby (např. Ročně – sleva 20 %).',
        recommendedMaxLength: 32,
        maxLength: 80,
      },
      'pricing.featuresHeading': {
        label: 'Nadpis seznamu benefitů u tarifu',
        section: 'Ceník',
        helpText: 'Zobrazí se u každé karty (např. Zahrnuje:).',
        recommendedMaxLength: 24,
        maxLength: 60,
      },
      'pricing.plan1.title': {
        label: 'Tarif 1 – název',
        section: 'Ceník · Tarif 1',
        maxLength: 80,
      },
      'pricing.plan1.priceMonthly': {
        label: 'Tarif 1 – cena (měsíčně)',
        section: 'Ceník · Tarif 1',
        helpText:
          'Režim dvě varianty: zobrazí se při přepínači „měsíčně“. Režim jen karty: volitelné; pokud nevyplníte roční cenu, použije se tato.',
        maxLength: 80,
      },
      'pricing.plan1.priceYearly': {
        label: 'Tarif 1 – cena (ročně)',
        section: 'Ceník · Tarif 1',
        helpText:
          'Režim dvě varianty: zobrazí se při přepínači „ročně“. Režim jen karty: zobrazí se tato cena (má přednost před měsíční).',
        maxLength: 80,
      },
      'pricing.plan1.desc': {
        label: 'Tarif 1 – popis',
        type: 'textarea',
        section: 'Ceník · Tarif 1',
        maxLength: 500,
      },
      'pricing.plan1.cta': {
        label: 'Tarif 1 – text tlačítka',
        section: 'Ceník · Tarif 1',
        maxLength: 80,
      },
      'pricing.plan1.ctaHref': {
        label: 'Tarif 1 – odkaz tlačítka',
        section: 'Ceník · Tarif 1',
        helpText: 'URL nebo kotva (např. #kontakt nebo mailto:…). Prázdné = #kontakt.',
        maxLength: 500,
        advanced: true,
      },
      'pricing.plan1.popularBadge': {
        label: 'Tarif 1 – odznak (prázdné = bez zvýraznění)',
        section: 'Ceník · Tarif 1',
        helpText: 'Vyplňte např. Nejoblíbenější pro zvýrazněnou kartu.',
        maxLength: 60,
        advanced: true,
      },
      'pricing.plan1.features': {
        label: 'Tarif 1 – body (jeden řádek = jedna položka)',
        type: 'textarea',
        section: 'Ceník · Tarif 1',
        helpText: 'Každý řádek jedna odrážka seznamu.',
        maxLength: 2000,
      },
      'pricing.plan2.title': {
        label: 'Tarif 2 – název',
        section: 'Ceník · Tarif 2',
        maxLength: 80,
      },
      'pricing.plan2.priceMonthly': {
        label: 'Tarif 2 – cena (měsíčně)',
        section: 'Ceník · Tarif 2',
        helpText:
          'Režim dvě varianty: při přepínači „měsíčně“. Režim jen karty: záloha, pokud chybí roční.',
        maxLength: 80,
      },
      'pricing.plan2.priceYearly': {
        label: 'Tarif 2 – cena (ročně)',
        section: 'Ceník · Tarif 2',
        helpText: 'Režim dvě varianty: při „ročně“. Režim jen karty: hlavní zobrazená cena.',
        maxLength: 80,
      },
      'pricing.plan2.desc': {
        label: 'Tarif 2 – popis',
        type: 'textarea',
        section: 'Ceník · Tarif 2',
        maxLength: 500,
      },
      'pricing.plan2.cta': {
        label: 'Tarif 2 – text tlačítka',
        section: 'Ceník · Tarif 2',
        maxLength: 80,
      },
      'pricing.plan2.ctaHref': {
        label: 'Tarif 2 – odkaz tlačítka',
        section: 'Ceník · Tarif 2',
        maxLength: 500,
        advanced: true,
      },
      'pricing.plan2.popularBadge': {
        label: 'Tarif 2 – odznak',
        section: 'Ceník · Tarif 2',
        maxLength: 60,
        advanced: true,
      },
      'pricing.plan2.features': {
        label: 'Tarif 2 – body',
        type: 'textarea',
        section: 'Ceník · Tarif 2',
        maxLength: 2000,
      },
      'pricing.plan3.title': {
        label: 'Tarif 3 – název',
        section: 'Ceník · Tarif 3',
        maxLength: 80,
      },
      'pricing.plan3.priceMonthly': {
        label: 'Tarif 3 – cena (měsíčně)',
        section: 'Ceník · Tarif 3',
        helpText:
          'Režim dvě varianty: při přepínači „měsíčně“. Režim jen karty: záloha, pokud chybí roční.',
        maxLength: 80,
      },
      'pricing.plan3.priceYearly': {
        label: 'Tarif 3 – cena (ročně)',
        section: 'Ceník · Tarif 3',
        helpText: 'Režim dvě varianty: při „ročně“. Režim jen karty: hlavní zobrazená cena.',
        maxLength: 80,
      },
      'pricing.plan3.desc': {
        label: 'Tarif 3 – popis',
        type: 'textarea',
        section: 'Ceník · Tarif 3',
        maxLength: 500,
      },
      'pricing.plan3.cta': {
        label: 'Tarif 3 – text tlačítka',
        section: 'Ceník · Tarif 3',
        maxLength: 80,
      },
      'pricing.plan3.ctaHref': {
        label: 'Tarif 3 – odkaz tlačítka',
        section: 'Ceník · Tarif 3',
        maxLength: 500,
        advanced: true,
      },
      'pricing.plan3.popularBadge': {
        label: 'Tarif 3 – odznak',
        section: 'Ceník · Tarif 3',
        maxLength: 60,
        advanced: true,
      },
      'pricing.plan3.features': {
        label: 'Tarif 3 – body',
        type: 'textarea',
        section: 'Ceník · Tarif 3',
        maxLength: 2000,
      },
      'tax.title': {
        label: 'Nadpis extra sekce',
        section: 'Extra sekce',
        recommendedMaxLength: 40,
        maxLength: 120,
      },
      'tax.teaser': {
        label: 'Text extra sekce',
        type: 'textarea',
        section: 'Extra sekce',
        recommendedMaxLength: 220,
        maxLength: 800,
      },
      'tax.enabled': {
        label: 'Zobrazit extra sekci',
        type: 'choice',
        section: 'Extra sekce',
        helpText: 'Skryje celou sekci na webu.',
        choices: [
          { value: 'show', label: 'Zobrazit' },
          { value: 'hide', label: 'Skrýt' },
        ],
        advanced: true,
      },
      'cta.enabled': {
        label: 'Zobrazit sekci CTA',
        type: 'choice',
        section: 'CTA',
        helpText: 'Skryje celou CTA sekci na webu.',
        choices: [
          { value: 'show', label: 'Zobrazit' },
          { value: 'hide', label: 'Skrýt' },
        ],
        advanced: true,
      },
      'cta.title': {
        label: 'CTA – nadpis',
        section: 'CTA',
        recommendedMaxLength: 70,
        maxLength: 140,
      },
      'cta.desc': {
        label: 'CTA – popis',
        type: 'textarea',
        section: 'CTA',
        recommendedMaxLength: 180,
        maxLength: 600,
      },
      'cta.btnPhone': {
        label: 'CTA – text levého tlačítka (telefon)',
        section: 'CTA',
        helpText:
          'Volitelné. Pokud necháte prázdné, zobrazí se číslo z kontaktu. Můžete zadat např. Zavolejte nám.',
        recommendedMaxLength: 28,
        maxLength: 80,
      },
      'cta.btnEmail': {
        label: 'CTA – text pravého tlačítka (e-mail)',
        section: 'CTA',
        helpText: 'Text u ikony obálky (např. Napište nám e-mail).',
        recommendedMaxLength: 32,
        maxLength: 80,
      },
      'cta.form.badge': {
        label: 'CTA form – štítek (badge)',
        section: 'CTA · Formulář',
        helpText: 'Krátký text nad nadpisem (jen pro layout „split“).',
        recommendedMaxLength: 40,
        maxLength: 120,
      },
      'cta.form.title': {
        label: 'CTA form – nadpis vlevo',
        section: 'CTA · Formulář',
        helpText: 'Nadpis intro části (jen pro layout „split“).',
        recommendedMaxLength: 70,
        maxLength: 180,
      },
      'cta.form.lead': {
        label: 'CTA form – text vlevo',
        type: 'textarea',
        section: 'CTA · Formulář',
        helpText: 'Krátký popis (jen pro layout „split“).',
        recommendedMaxLength: 220,
        maxLength: 800,
      },
      'cta.form.bullet1': {
        label: 'CTA form – bod 1',
        section: 'CTA · Formulář',
        maxLength: 140,
      },
      'cta.form.bullet2': {
        label: 'CTA form – bod 2',
        section: 'CTA · Formulář',
        maxLength: 140,
      },
      'cta.form.bullet3': {
        label: 'CTA form – bod 3',
        section: 'CTA · Formulář',
        maxLength: 140,
      },
      'cta.form.nameLabel': {
        label: 'CTA form – popisek pole Jméno',
        section: 'CTA · Formulář',
        recommendedMaxLength: 24,
        maxLength: 80,
      },
      'cta.form.phoneLabel': {
        label: 'CTA form – popisek pole Telefon',
        section: 'CTA · Formulář',
        recommendedMaxLength: 24,
        maxLength: 80,
      },
      'cta.form.emailLabel': {
        label: 'CTA form – popisek pole E-mail',
        section: 'CTA · Formulář',
        recommendedMaxLength: 24,
        maxLength: 80,
      },
      'cta.form.messageLabel': {
        label: 'CTA form – popisek pole Zpráva',
        section: 'CTA · Formulář',
        recommendedMaxLength: 24,
        maxLength: 80,
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

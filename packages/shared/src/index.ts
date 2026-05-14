/**
 * Shared content configuration for the CMS and the public site.
 * The admin builds forms from these definitions; saved values render on the site.
 */

export type { ContentField, ContentConfig } from './types.js';
export {
  REDUS_PUBLIC_DEFAULTS_CS,
  REDUS_PUBLIC_DEFAULTS_EN,
  resolveRedusSeedValue,
  resolveRedusSeedValueByLang,
} from './redus-public-defaults.js';
export {
  ARCH_SEED_DEFAULTS_CS,
  ARCH_SEED_DEFAULTS_EN,
  resolveArchSeedValue,
  resolveArchSeedValueByLang,
  archFlatPublicKeyToStorageKey,
} from './arch-public-defaults.js';
export { archSitePagesConfig, archSiteContentConfig } from './arch-site-pages.js';
export {
  applyArchNavPublicFallbacks,
  applyArchNavMenuHiding,
  stripArchNavDeprecatedKeys,
  ARCH_NAV_LABEL_AND_MENU,
  ARCH_NAV_DEPRECATED_PUBLIC_KEYS,
} from './arch-nav-public-fallbacks.js';
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
import { resolveRedusSeedValueByLang } from './redus-public-defaults.js';
import { resolveArchSeedValueByLang } from './arch-public-defaults.js';
import { archSitePagesConfig, archSiteContentConfig } from './arch-site-pages.js';

/** Internal field keys for branding (site name, logo) in the admin UI. */
export const ADMIN_SITE_NAME_KEY = 'admin.siteName';
export const ADMIN_LOGO_KEY = 'admin.logo';
export const ADMIN_TAGLINE_KEY = 'admin.tagline';
export const ADMIN_ENABLED_LANGS_KEY = 'admin.enabledLangs';
export const ADMIN_SHOW_TRANSLATION_BADGES_KEY = 'admin.showTranslationBadges';

/** Branding / CMS metadata (name, logo) — dedicated admin page. */
export const metadataConfig: ContentConfig = {
  [ADMIN_SITE_NAME_KEY]: {
    label: 'Název webu',
    type: 'text',
    required: true,
    helpText: 'Zobrazí se v administraci a může se použít i na webu (např. v patičce).',
  },
  [ADMIN_TAGLINE_KEY]: {
    label: 'Krátký popisek pod názvem',
    type: 'text',
    helpText: 'Krátký text pod názvem webu (např. v horní liště u návštěvníků).',
    placeholder: 'Např. ÚČETNÍ A DAŇOVÁ KANCELÁŘ',
    recommendedMaxLength: 40,
    maxLength: 80,
  },
  [ADMIN_LOGO_KEY]: {
    label: 'Logo webu',
    type: 'image',
    required: true,
    helpText:
      'Zobrazí se v administraci (postranní panel a přihlášení). Šablona ho může použít i na webu pro návštěvníky. Doporučeno PNG nebo SVG s průhledným pozadím.',
  },
  [ADMIN_ENABLED_LANGS_KEY]: {
    label: 'Jazyky webu',
    type: 'text',
    helpText: 'Nastavení pro překlady a přepínače jazyků v administraci.',
    advanced: true,
  },
  [ADMIN_SHOW_TRANSLATION_BADGES_KEY]: {
    label: 'Upozornění na chybějící překlady',
    type: 'text',
    helpText: 'Upozornění v editoru, pokud chybí text v jiném zapnutém jazyce.',
    advanced: true,
  },
};

/**
 * Globální údaje mimo jednotlivé stránky (menu v patičce, kontakty, odkazy v patičce).
 * Kontaktní údaje se na webu zobrazují stejně jako dříve v sekci kontakt.
 */
export const siteSettingsConfig: ContentConfig = {
  'nav.services': {
    label: 'Menu - text položky Služby',
    type: 'text',
    helpText: 'Text v horním menu; odkaz vede na sekci Služby na úvodní stránce.',
    section: 'Navigace',
    recommendedMaxLength: 18,
    maxLength: 40,
  },
  'nav.about': {
    label: 'Menu - text položky O nás',
    type: 'text',
    helpText: 'Text v horním menu; odkaz vede na stránku „O nás“.',
    section: 'Navigace',
    recommendedMaxLength: 18,
    maxLength: 40,
  },
  'nav.pricing': {
    label: 'Menu - text položky Ceník',
    type: 'text',
    helpText: 'Text v horním menu; odkaz vede na sekci Ceník na úvodní stránce.',
    section: 'Navigace',
    recommendedMaxLength: 18,
    maxLength: 40,
  },
  'nav.tax': {
    label: 'Menu - text položky Daňové poradenství',
    type: 'text',
    helpText: 'Text v horním menu; odkaz vede na příslušnou sekci na úvodní stránce.',
    section: 'Navigace',
    recommendedMaxLength: 28,
    maxLength: 60,
  },
  'nav.ctaContact': {
    label: 'Menu - text tlačítka vpravo',
    type: 'text',
    helpText: 'Text výrazného tlačítka vpravo; obvykle vede ke kontaktu na úvodní stránce.',
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
    label: 'E-mail',
    type: 'text',
    helpText: 'Hlavní kontaktní e-mail.',
    section: 'Kontakt',
  },
  'main:contact.address': {
    label: 'Adresa',
    type: 'textarea',
    helpText: 'Zobrazí se v patičce nebo v kontaktní sekci.',
    section: 'Kontakt',
  },
  'footer.blurb': {
    label: 'Patička – krátký popis pod názvem',
    type: 'textarea',
    helpText: 'Krátký text pod názvem webu v patičce.',
    section: 'Patička',
    recommendedMaxLength: 200,
    maxLength: 600,
  },
  'footer.billing': {
    label: 'Fakturační údaje',
    type: 'textarea',
    helpText: 'Zobrazí se v patičce. Můžete používat více řádků.',
    section: 'Patička',
  },
  'footer.headingContact': {
    label: 'Patička – nadpis sloupce s kontaktem',
    type: 'text',
    helpText: 'Nadpis sloupce s adresou/telefonem/email.',
    section: 'Patička',
    recommendedMaxLength: 24,
    maxLength: 60,
  },
  'footer.headingBilling': {
    label: 'Patička – nadpis nad fakturačními údaji',
    type: 'text',
    helpText: 'Nadpis sloupce s fakturačními údaji.',
    section: 'Patička',
    recommendedMaxLength: 24,
    maxLength: 60,
  },
  'footer.linkedinHref': {
    label: 'Patička – odkaz na LinkedIn',
    type: 'text',
    helpText: 'Odkaz na váš profil nebo firmu. Pokud necháte prázdné, použije se výchozí z šablony.',
    section: 'Patička',
    maxLength: 500,
    advanced: true,
  },
  'footer.linkPrivacyLabel': {
    label: 'Patička – text prvního odkazu',
    type: 'text',
    helpText: 'Např. Ochrana osobních údajů.',
    section: 'Patička · odkazy',
    recommendedMaxLength: 22,
    maxLength: 60,
  },
  'footer.linkPrivacyHref': {
    label: 'Patička – adresa stránky k prvnímu odkazu',
    type: 'text',
    helpText: 'Adresa stránky na webu (např. /ochrana-soukromi) nebo celý odkaz zkopírovaný z prohlížeče.',
    section: 'Patička · odkazy',
    maxLength: 500,
    advanced: true,
  },
  'footer.linkTermsLabel': {
    label: 'Patička – text druhého odkazu',
    type: 'text',
    helpText: 'Např. Obchodní podmínky.',
    section: 'Patička · odkazy',
    recommendedMaxLength: 22,
    maxLength: 60,
  },
  'footer.linkTermsHref': {
    label: 'Patička – adresa stránky ke druhému odkazu',
    type: 'text',
    helpText: 'Adresa stránky na webu (např. /obchodni-podminky) nebo celý odkaz zkopírovaný z prohlížeče.',
    section: 'Patička · odkazy',
    maxLength: 500,
    advanced: true,
  },
  'footer.copyright': {
    label: 'Copyright',
    type: 'text',
    helpText: 'Spodní řádek v patičce (obvykle rok a název firmy).',
    section: 'Patička',
    recommendedMaxLength: 80,
    maxLength: 200,
  },

  'main:cta.form.submitLabel': {
    label: 'Formulář – text tlačítka Odeslat',
    type: 'text',
    helpText: 'Text na tlačítku „Odeslat“ ve formuláři.',
    section: 'Spodní blok · Formulář',
    recommendedMaxLength: 18,
    maxLength: 60,
  },
  'main:cta.form.sendingLabel': {
    label: 'Formulář – text při odesílání',
    type: 'text',
    helpText: 'Text na tlačítku během odesílání.',
    section: 'Spodní blok · Formulář',
    recommendedMaxLength: 18,
    maxLength: 60,
    advanced: true,
  },
  'main:cta.form.successMessage': {
    label: 'Formulář – poděkování po odeslání',
    type: 'textarea',
    helpText: 'Zobrazí se po úspěšném odeslání formuláře.',
    section: 'Spodní blok · Formulář',
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
 * Jednotlivé stránky webu a jejich pole. Každá stránka má adresu (slug) a vlastní obsahová pole.
 */
export const sitePagesConfig: SitePagesConfigMap = {
  main: {
    slug: '',
    label: 'Domů',
    fields: {
      'hero.enabled': {
        label: 'Zobrazit horní úvodní blok',
        type: 'choice',
        section: 'Úvodní blok',
        helpText: 'Skryje celou horní část úvodní stránky (obrázek, nadpisy, tlačítka).',
        choices: [
          { value: 'show', label: 'Zobrazit' },
          { value: 'hide', label: 'Skrýt' },
        ],
        advanced: true,
      },
      'hero.badge': {
        label: 'Štítek nad nadpisem',
        section: 'Úvodní blok',
        helpText: 'Krátký text v malém štítku nad hlavním nadpisem.',
        recommendedMaxLength: 60,
        maxLength: 120,
      },
      'hero.title': {
        label: 'Hlavní nadpis',
        section: 'Úvodní blok',
        helpText: 'Krátký a výstižný nadpis. Doporučeno max. 50 znaků.',
        recommendedMaxLength: 50,
        maxLength: 80,
        placeholder: 'Např. Pomáháme firmám růst',
      },
      'hero.titleAccent': {
        label: 'Zvýrazněné slovo v nadpisu',
        section: 'Úvodní blok',
        helpText: 'Část nadpisu, která se zvýrazní barvou (musí se v nadpisu vyskytovat).',
        recommendedMaxLength: 20,
        maxLength: 40,
        placeholder: 'Např. účetnictví',
      },
      'hero.subtitle': {
        label: 'Podnadpis',
        section: 'Úvodní blok',
        helpText: 'Jedna věta, která vysvětlí hodnotu. Doporučeno max. 120 znaků.',
        recommendedMaxLength: 120,
        maxLength: 180,
        placeholder: 'Např. Weby a marketing, které dávají smysl',
        advanced: true,
      },
      'hero.lead': {
        label: 'Krátký úvodní text',
        type: 'textarea',
        section: 'Úvodní blok',
        helpText: 'Krátký odstavec pod nadpisem.',
        recommendedMaxLength: 240,
        maxLength: 600,
      },
      'hero.image': {
        label: 'Hlavní obrázek',
        type: 'image',
        section: 'Úvodní blok',
        helpText: 'Ideálně široký obrázek (min. 1600 px).',
      },
      'hero.cardTitle': {
        label: 'Text karty na obrázku',
        section: 'Úvodní blok',
        helpText: 'Krátký text v malé kartě překryté přes obrázek.',
        recommendedMaxLength: 40,
        maxLength: 120,
      },
      'hero.ctaPrimary': {
        label: 'Hlavní tlačítko',
        section: 'Úvodní blok',
        helpText: 'Text hlavního výrazného tlačítka.',
        recommendedMaxLength: 32,
        maxLength: 80,
      },
      'hero.ctaSecondary': {
        label: 'Druhé tlačítko',
        section: 'Úvodní blok',
        helpText: 'Text druhého tlačítka vedle hlavního.',
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
        label: 'Jak zobrazit ceny u tarifů',
        type: 'choice',
        section: 'Ceník',
        helpText:
          'Buď přepínač měsíčně / ročně a u každého tarifu dvě ceny, nebo tři karty s jednou cenou bez přepínače (pokud vyplníte obě částky, zobrazí se přednostně roční).',
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
          'Zobrazí se jen při volbě „Dvě varianty (měsíčně / ročně)“. Text druhé možnosti přepínače (např. Měsíčně).',
        recommendedMaxLength: 24,
        maxLength: 60,
      },
      'pricing.billingYearly': {
        label: 'Přepínač – roční fakturace',
        section: 'Ceník',
        helpText:
          'Zobrazí se jen při volbě „Dvě varianty (měsíčně / ročně)“. Text první možnosti (např. Ročně – sleva 20 %).',
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
          'Při přepínači „měsíčně / ročně“: cena pro měsíční variantu. Pokud na kartě zobrazujete jen jednu cenu a roční nevyplníte, použije se tato.',
        maxLength: 80,
      },
      'pricing.plan1.priceYearly': {
        label: 'Tarif 1 – cena (ročně)',
        section: 'Ceník · Tarif 1',
        helpText:
          'Při přepínači „měsíčně / ročně“: cena pro roční variantu. Pokud na kartě zobrazujete jen jednu cenu, bere se tato hodnota jako hlavní.',
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
        helpText:
          'Kam má tlačítko po kliknutí vést: stránka na webu (např. /kontakt), nebo krátký odkaz na část úvodní stránky s kontaktem. Když pole zůstane prázdné, otevře se kontakt na úvodní stránce.',
        maxLength: 500,
        advanced: true,
      },
      'pricing.plan1.popularBadge': {
        label: 'Tarif 1 – štítek zvýrazněné karty',
        section: 'Ceník · Tarif 1',
        helpText: 'Volitelné. Prázdné pole znamená stejný vzhled jako u ostatních karet; např. Nejoblíbenější zvýrazní tuto kartu.',
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
          'Při přepínači „měsíčně / ročně“: měsíční varianta. Jedna cena na kartě: doplněte i roční, jinak se použije tato.',
        maxLength: 80,
      },
      'pricing.plan2.priceYearly': {
        label: 'Tarif 2 – cena (ročně)',
        section: 'Ceník · Tarif 2',
        helpText: 'Při přepínači „měsíčně / ročně“: roční varianta. Jedna cena na kartě: hlavní zobrazená cena.',
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
        helpText:
          'Kam má tlačítko po kliknutí vést: stránka na webu (např. /kontakt), nebo krátký odkaz na část úvodní stránky s kontaktem. Když pole zůstane prázdné, otevře se kontakt na úvodní stránce.',
        maxLength: 500,
        advanced: true,
      },
      'pricing.plan2.popularBadge': {
        label: 'Tarif 2 – štítek zvýrazněné karty',
        section: 'Ceník · Tarif 2',
        helpText: 'Volitelné. Prázdné pole znamená stejný vzhled jako u ostatních karet; např. Nejoblíbenější zvýrazní tuto kartu.',
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
          'Při přepínači „měsíčně / ročně“: měsíční varianta. Jedna cena na kartě: doplněte i roční, jinak se použije tato.',
        maxLength: 80,
      },
      'pricing.plan3.priceYearly': {
        label: 'Tarif 3 – cena (ročně)',
        section: 'Ceník · Tarif 3',
        helpText: 'Při přepínači „měsíčně / ročně“: roční varianta. Jedna cena na kartě: hlavní zobrazená cena.',
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
        helpText:
          'Kam má tlačítko po kliknutí vést: stránka na webu (např. /kontakt), nebo krátký odkaz na část úvodní stránky s kontaktem. Když pole zůstane prázdné, otevře se kontakt na úvodní stránce.',
        maxLength: 500,
        advanced: true,
      },
      'pricing.plan3.popularBadge': {
        label: 'Tarif 3 – štítek zvýrazněné karty',
        section: 'Ceník · Tarif 3',
        helpText: 'Volitelné. Prázdné pole znamená stejný vzhled jako u ostatních karet; např. Nejoblíbenější zvýrazní tuto kartu.',
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
        label: 'Nadpis doplňkové sekce',
        section: 'Doplňková sekce',
        recommendedMaxLength: 40,
        maxLength: 120,
      },
      'tax.teaser': {
        label: 'Text doplňkové sekce',
        type: 'textarea',
        section: 'Doplňková sekce',
        recommendedMaxLength: 220,
        maxLength: 800,
      },
      'tax.enabled': {
        label: 'Zobrazit doplňkovou sekci',
        type: 'choice',
        section: 'Doplňková sekce',
        helpText: 'Skryje celou tuto sekci na webu (např. daňové poradenství).',
        choices: [
          { value: 'show', label: 'Zobrazit' },
          { value: 'hide', label: 'Skrýt' },
        ],
        advanced: true,
      },
      'cta.enabled': {
        label: 'Zobrazit spodní blok s kontaktem',
        type: 'choice',
        section: 'Spodní blok',
        helpText: 'Skryje dolní část úvodní stránky s výzvou ke kontaktu nebo formulářem.',
        choices: [
          { value: 'show', label: 'Zobrazit' },
          { value: 'hide', label: 'Skrýt' },
        ],
        advanced: true,
      },
      'cta.title': {
        label: 'Spodní blok – nadpis',
        section: 'Spodní blok',
        recommendedMaxLength: 70,
        maxLength: 140,
      },
      'cta.desc': {
        label: 'Spodní blok – popis',
        type: 'textarea',
        section: 'Spodní blok',
        recommendedMaxLength: 180,
        maxLength: 600,
      },
      'cta.btnPhone': {
        label: 'Spodní blok – text tlačítka s telefonem',
        section: 'Spodní blok',
        helpText:
          'Volitelné. Pokud necháte prázdné, zobrazí se číslo z kontaktu. Můžete zadat např. Zavolejte nám.',
        recommendedMaxLength: 28,
        maxLength: 80,
      },
      'cta.btnEmail': {
        label: 'Spodní blok – text tlačítka s e-mailem',
        section: 'Spodní blok',
        helpText: 'Text u ikony obálky (např. Napište nám e-mail).',
        recommendedMaxLength: 32,
        maxLength: 80,
      },
      'cta.form.badge': {
        label: 'Formulář – malý štítek nad nadpisem',
        section: 'Spodní blok · Formulář',
        helpText: 'Krátký text nad nadpisem (jen u rozložení se dvěma sloupci).',
        recommendedMaxLength: 40,
        maxLength: 120,
      },
      'cta.form.title': {
        label: 'Formulář – nadpis vlevo',
        section: 'Spodní blok · Formulář',
        helpText: 'Nadpis vlevo od formuláře (jen u rozložení se dvěma sloupci).',
        recommendedMaxLength: 70,
        maxLength: 180,
      },
      'cta.form.lead': {
        label: 'Formulář – krátký text vlevo',
        type: 'textarea',
        section: 'Spodní blok · Formulář',
        helpText: 'Krátký popis vlevo od formuláře (jen u rozložení se dvěma sloupci).',
        recommendedMaxLength: 220,
        maxLength: 800,
      },
      'cta.form.bullet1': {
        label: 'Formulář – první odrážka vlevo',
        section: 'Spodní blok · Formulář',
        maxLength: 140,
      },
      'cta.form.bullet2': {
        label: 'Formulář – druhá odrážka vlevo',
        section: 'Spodní blok · Formulář',
        maxLength: 140,
      },
      'cta.form.bullet3': {
        label: 'Formulář – třetí odrážka vlevo',
        section: 'Spodní blok · Formulář',
        maxLength: 140,
      },
      'cta.form.nameLabel': {
        label: 'Formulář – popisek pole Jméno',
        section: 'Spodní blok · Formulář',
        recommendedMaxLength: 24,
        maxLength: 80,
      },
      'cta.form.phoneLabel': {
        label: 'Formulář – popisek pole Telefon',
        section: 'Spodní blok · Formulář',
        recommendedMaxLength: 24,
        maxLength: 80,
      },
      'cta.form.emailLabel': {
        label: 'Formulář – popisek pole E-mail',
        section: 'Spodní blok · Formulář',
        recommendedMaxLength: 24,
        maxLength: 80,
      },
      'cta.form.messageLabel': {
        label: 'Formulář – popisek pole Zpráva',
        section: 'Spodní blok · Formulář',
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

/** Flattened list of all page fields (validation and CMS persistence). */
export const siteContentConfig: ContentConfig = flattenSitePagesFields(sitePagesConfig);

/** Full field configuration (metadata + content). */
export const defaultConfig: ContentConfig = {
  ...metadataConfig,
  ...siteSettingsConfig,
  ...siteContentConfig,
};

/** ARCH template id (second site type in this CMS). */
export const CMS_TEMPLATE_ARCH = 'arch' as const;

export function getSitePagesForTemplate(templateId: string | null | undefined): SitePagesConfigMap {
  if ((templateId ?? '').trim() === CMS_TEMPLATE_ARCH) {
    return archSitePagesConfig;
  }
  return sitePagesConfig;
}

export function getDefaultContentConfigForTemplate(templateId: string | null | undefined): ContentConfig {
  if ((templateId ?? '').trim() === CMS_TEMPLATE_ARCH) {
    return { ...metadataConfig, ...archSiteContentConfig };
  }
  return defaultConfig;
}

export function getContactSettingsConfigForTemplate(templateId: string | null | undefined): ContentConfig {
  if ((templateId ?? '').trim() === CMS_TEMPLATE_ARCH) {
    const m = archSitePagesConfig.main.fields;
    return {
      'main:contact.phone': m['contact.phone']!,
      'main:contact.email': m['contact.email']!,
      'main:contact.address': m['contact.address']!,
    };
  }
  return siteSettingsConfig;
}

export function resolveSeedValueByLang(
  fullKey: string,
  lang: string,
  templateId: string | null | undefined
): string {
  if ((templateId ?? '').trim() === CMS_TEMPLATE_ARCH) {
    return resolveArchSeedValueByLang(fullKey, lang);
  }
  return resolveRedusSeedValueByLang(fullKey, lang);
}

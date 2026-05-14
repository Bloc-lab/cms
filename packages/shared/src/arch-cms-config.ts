/**
 * Popisy polí šablony ARCH v administraci (texty a obrázky na webu).
 */

import type { ContentConfig, ContentField } from './types.js';

function f(label: string, section: string, rest: Partial<ContentField> = {}): ContentField {
  return { label, section, ...rest };
}

export const archCmsConfig: ContentConfig = {
  // -- Admin-only fields
  'admin.siteName': f('Název webu (značka)', 'Administrace', {
    required: true,
    helpText: 'Zobrazí se v administraci a nahoře na webu; obvykle název studia nebo značka.',
    recommendedMaxLength: 40,
    maxLength: 80,
  }),
  'admin.logo': f('Logo', 'Administrace', {
    type: 'image',
    helpText: 'Logo v administraci a podle šablony i na webu. Může zůstat prázdné, pokud stačí textový název.',
  }),

  // -- Navigation (ARCH template: About, Pricing, Contact pages only; no anchors into home sections)
  'nav.about': f('Menu - O nás', 'Navigace', {
    recommendedMaxLength: 24,
    maxLength: 48,
    helpText:
      'Vlastní text v horním menu. Prázdné pole doplní název stránky „O nás“ (odkaz vede na tuto stránku v sekci Stránky).',
  }),
  'nav.contact': f('Menu - Kontakt', 'Navigace', {
    recommendedMaxLength: 24,
    maxLength: 48,
    helpText:
      'Vlastní text v horním menu. Prázdné pole doplní název stránky „Kontakt“ (odkaz na stránku ze sekce Stránky).',
  }),
  'nav.pricing': f('Menu - Ceník', 'Navigace', {
    recommendedMaxLength: 24,
    maxLength: 48,
    helpText:
      'Vlastní text v horním menu. Prázdné pole doplní název stránky „Ceník“ (odkaz na stránku ze sekce Stránky).',
  }),

  'nav.menuAbout': f('O nás - zobrazení v menu', 'Navigace', {
    type: 'choice',
    choices: [
      { value: '1', label: 'V menu' },
      { value: '0', label: 'Skrýt' },
    ],
    helpText: 'Při „Skrýt“ se položka v horním menu na webu nezobrazí.',
  }),
  'nav.menuPricing': f('Ceník - zobrazení v menu', 'Navigace', {
    type: 'choice',
    choices: [
      { value: '1', label: 'V menu' },
      { value: '0', label: 'Skrýt' },
    ],
    helpText: 'Při „Skrýt“ se položka v horním menu na webu nezobrazí.',
  }),
  'nav.menuContact': f('Kontakt - zobrazení v menu', 'Navigace', {
    type: 'choice',
    choices: [
      { value: '1', label: 'V menu' },
      { value: '0', label: 'Skrýt' },
    ],
    helpText: 'Při „Skrýt“ se položka v horním menu na webu nezobrazí.',
  }),

  // -- Home · Intro
  'hero.image': f('Úvod - hlavní obrázek', 'Domů · Úvod', {
    type: 'image',
    helpText: 'Velký obrázek nahoře na stránce (doporučeno alespoň kolem 1600 px šířky).',
  }),
  'hero.imageAlt': f('Úvod - krátký popis obrázku', 'Domů · Úvod', {
    helpText: 'Krátký text pro návštěvníky, kteří obrázek nevidí (např. čtečka obrazovky). Doporučeno vyplnit.',
    recommendedMaxLength: 120,
    maxLength: 280,
  }),
  'hero.badge': f('Úvod - malý štítek nad nadpisem', 'Domů · Úvod', {
    recommendedMaxLength: 48,
    maxLength: 100,
  }),
  'hero.title': f('Úvod - hlavní nadpis', 'Domů · Úvod', {
    recommendedMaxLength: 64,
    maxLength: 120,
  }),
  'hero.lead': f('Úvod - krátký úvodní text', 'Domů · Úvod', {
    type: 'textarea',
    recommendedMaxLength: 280,
    maxLength: 720,
  }),
  'hero.ctaPrimary': f('Úvod - hlavní tlačítko', 'Domů · Úvod', {
    recommendedMaxLength: 32,
    maxLength: 72,
  }),
  'hero.scrollHint': f('Úvod - text pod tlačítky', 'Domů · Úvod', {
    helpText: 'Krátký text pod hlavním tlačítkem (např. pozvánka posunout stránku níž k další části).',
    recommendedMaxLength: 36,
    maxLength: 80,
  }),

  // -- Home · Portfolio
  'portfolio.title': f('Portfolio - nadpis sekce', 'Domů · Portfolio', {
    recommendedMaxLength: 48,
    maxLength: 100,
  }),
  'portfolio.desc': f('Portfolio - úvodní text', 'Domů · Portfolio', {
    type: 'textarea',
    recommendedMaxLength: 220,
    maxLength: 600,
  }),
  'portfolio.tag1': f('Portfolio - štítek 1', 'Domů · Portfolio', {
    recommendedMaxLength: 24,
    maxLength: 48,
  }),
  'portfolio.tag2': f('Portfolio - štítek 2', 'Domů · Portfolio', {
    recommendedMaxLength: 24,
    maxLength: 48,
  }),
  'portfolio.tag3': f('Portfolio - štítek 3', 'Domů · Portfolio', {
    recommendedMaxLength: 24,
    maxLength: 48,
  }),

  'portfolio.card1.location': f('Karta 1 - lokalita', 'Domů · Portfolio · Karta 1', {
    recommendedMaxLength: 32,
    maxLength: 64,
  }),
  'portfolio.card1.title': f('Karta 1 - titulek', 'Domů · Portfolio · Karta 1', {
    recommendedMaxLength: 48,
    maxLength: 100,
  }),
  'portfolio.card1.image': f('Karta 1 - obrázek', 'Domů · Portfolio · Karta 1', { type: 'image' }),
  'portfolio.card1.imageAlt': f('Karta 1 - popis obrázku', 'Domů · Portfolio · Karta 1', {
    maxLength: 280,
  }),

  'portfolio.card2.location': f('Karta 2 - lokalita', 'Domů · Portfolio · Karta 2', {
    recommendedMaxLength: 32,
    maxLength: 64,
  }),
  'portfolio.card2.title': f('Karta 2 - titulek', 'Domů · Portfolio · Karta 2', {
    recommendedMaxLength: 48,
    maxLength: 100,
  }),
  'portfolio.card2.image': f('Karta 2 - obrázek', 'Domů · Portfolio · Karta 2', { type: 'image' }),
  'portfolio.card2.imageAlt': f('Karta 2 - popis obrázku', 'Domů · Portfolio · Karta 2', {
    maxLength: 280,
  }),

  'portfolio.beforeLabel': f('Před/po - popisek „Před“', 'Domů · Portfolio · Před a po', {
    maxLength: 24,
  }),
  'portfolio.afterLabel': f('Před/po - popisek „Po“', 'Domů · Portfolio · Před a po', { maxLength: 24 }),
  'portfolio.beforeImage': f('Před/po - obrázek před', 'Domů · Portfolio · Před a po', { type: 'image' }),
  'portfolio.beforeImageAlt': f('Před/po - popis obrázku „před“', 'Domů · Portfolio · Před a po', { maxLength: 280 }),
  'portfolio.afterImage': f('Před/po - obrázek po', 'Domů · Portfolio · Před a po', { type: 'image' }),
  'portfolio.afterImageAlt': f('Před/po - popis obrázku „po“', 'Domů · Portfolio · Před a po', { maxLength: 280 }),

  'portfolio.detail1.image': f('Detail 1 - obrázek', 'Domů · Portfolio · Detaily', { type: 'image' }),
  'portfolio.detail1.imageAlt': f('Detail 1 - popis obrázku', 'Domů · Portfolio · Detaily', { maxLength: 280 }),
  'portfolio.detail2.image': f('Detail 2 - obrázek', 'Domů · Portfolio · Detaily', { type: 'image' }),
  'portfolio.detail2.imageAlt': f('Detail 2 - popis obrázku', 'Domů · Portfolio · Detaily', { maxLength: 280 }),
  'portfolio.detail3.image': f('Detail 3 - obrázek', 'Domů · Portfolio · Detaily', { type: 'image' }),
  'portfolio.detail3.imageAlt': f('Detail 3 - popis obrázku', 'Domů · Portfolio · Detaily', { maxLength: 280 }),

  // -- Home · Block (image, text, bullets — generic block name in CMS)
  'craft.image': f('Blok - obrázek', 'Domů · Blok', { type: 'image' }),
  'craft.imageAlt': f('Blok - popis obrázku', 'Domů · Blok', { maxLength: 280 }),
  'craft.label': f('Blok - malý štítek', 'Domů · Blok', { maxLength: 40 }),
  'craft.title': f('Blok - nadpis', 'Domů · Blok', { recommendedMaxLength: 64, maxLength: 120 }),
  'craft.lead': f('Blok - krátký úvodní text', 'Domů · Blok', {
    type: 'textarea',
    recommendedMaxLength: 260,
    maxLength: 720,
  }),
  'craft.bullet1.title': f('Blok - bod 1 nadpis', 'Domů · Blok · Body', { maxLength: 80 }),
  'craft.bullet1.desc': f('Blok - bod 1 popis', 'Domů · Blok · Body', {
    type: 'textarea',
    maxLength: 400,
  }),
  'craft.bullet2.title': f('Blok - bod 2 nadpis', 'Domů · Blok · Body', { maxLength: 80 }),
  'craft.bullet2.desc': f('Blok - bod 2 popis', 'Domů · Blok · Body', {
    type: 'textarea',
    maxLength: 400,
  }),

  // -- Home · Contact block
  'cta.bgImage': f('Kontaktní blok - obrázek na pozadí', 'Domů · Kontaktní blok', { type: 'image' }),
  'cta.bgImageAlt': f('Kontaktní blok - popis pozadí', 'Domů · Kontaktní blok', { maxLength: 280 }),
  'cta.title': f('Kontaktní blok - nadpis', 'Domů · Kontaktní blok', { recommendedMaxLength: 72, maxLength: 140 }),
  'cta.lead': f('Kontaktní blok - text', 'Domů · Kontaktní blok', {
    type: 'textarea',
    recommendedMaxLength: 200,
    maxLength: 600,
  }),
  'cta.btnPrimary': f('Kontaktní blok - první tlačítko', 'Domů · Kontaktní blok', { maxLength: 80 }),
  'cta.btnSecondary': f('Kontaktní blok - druhé tlačítko', 'Domů · Kontaktní blok', { maxLength: 80 }),

  // -- Site footer (main page)
  'footer.blurb': f('Patička - krátký popis', 'Patička', {
    type: 'textarea',
    recommendedMaxLength: 200,
    maxLength: 500,
  }),
  'footer.columnExpertise': f('Patička - nadpis sloupce Odbornost', 'Patička', { maxLength: 48 }),
  'footer.linkExp1': f('Odbornost - viditelný text 1', 'Patička · Odbornost', { maxLength: 80 }),
  'footer.linkExp1Href': f('Odbornost - adresa pro odkaz 1', 'Patička · Odbornost', {
    helpText:
      'Kam má vést po kliknutí: stránka na webu (např. /cenik), kotva na úvodní stránce (např. #portfolio) nebo celý odkaz zkopírovaný z prohlížeče. Prázdné: zobrazí se jen text bez prokliku (podle šablony webu).',
    maxLength: 500,
  }),
  'footer.linkExp2': f('Odbornost - viditelný text 2', 'Patička · Odbornost', { maxLength: 80 }),
  'footer.linkExp2Href': f('Odbornost - adresa pro odkaz 2', 'Patička · Odbornost', {
    helpText:
      'Kam má vést po kliknutí: stránka na webu, kotva nebo celý odkaz. Prázdné: jen text bez prokliku.',
    maxLength: 500,
  }),
  'footer.linkExp3': f('Odbornost - viditelný text 3', 'Patička · Odbornost', { maxLength: 80 }),
  'footer.linkExp3Href': f('Odbornost - adresa pro odkaz 3', 'Patička · Odbornost', {
    helpText:
      'Kam má vést po kliknutí: stránka na webu, kotva nebo celý odkaz. Prázdné: jen text bez prokliku.',
    maxLength: 500,
  }),
  'footer.linkExp4': f('Odbornost - viditelný text 4', 'Patička · Odbornost', { maxLength: 80 }),
  'footer.linkExp4Href': f('Odbornost - adresa pro odkaz 4', 'Patička · Odbornost', {
    helpText:
      'Kam má vést po kliknutí: stránka na webu, kotva nebo celý odkaz. Prázdné: jen text bez prokliku.',
    maxLength: 500,
  }),
  'footer.columnNavigation': f('Patička - nadpis sloupce Navigace', 'Patička', { maxLength: 48 }),
  'footer.linkNav1': f('Navigace - viditelný text 1', 'Patička · Navigace', { maxLength: 80 }),
  'footer.linkNav1Href': f('Navigace - adresa pro odkaz 1', 'Patička · Navigace', {
    helpText:
      'Kam má vést po kliknutí: stránka na webu (např. /cenik), kotva nebo celý odkaz. Prázdné: jen text bez prokliku.',
    maxLength: 500,
  }),
  'footer.linkNav2': f('Navigace - viditelný text 2', 'Patička · Navigace', { maxLength: 80 }),
  'footer.linkNav2Href': f('Navigace - adresa pro odkaz 2', 'Patička · Navigace', {
    helpText:
      'Kam má vést po kliknutí: stránka na webu, kotva nebo celý odkaz. Prázdné: jen text bez prokliku.',
    maxLength: 500,
  }),
  'footer.linkNav3': f('Navigace - viditelný text 3', 'Patička · Navigace', { maxLength: 80 }),
  'footer.linkNav3Href': f('Navigace - adresa pro odkaz 3', 'Patička · Navigace', {
    helpText: 'Např. odkaz na sociální síť (https://…). Prázdné: jen text bez prokliku.',
    maxLength: 500,
  }),
  'footer.linkNav4': f('Navigace - viditelný text 4', 'Patička · Navigace', { maxLength: 80 }),
  'footer.linkNav4Href': f('Navigace - adresa pro odkaz 4', 'Patička · Navigace', {
    helpText: 'Např. odkaz na sociální síť (https://…). Prázdné: jen text bez prokliku.',
    maxLength: 500,
  }),
  'footer.columnConnect': f('Patička - nadpis sloupce Kontakt', 'Patička', { maxLength: 48 }),
  'footer.addressLine1': f('Patička - adresa řádek 1', 'Patička · Kontakt', { maxLength: 120 }),
  'footer.addressLine2': f('Patička - adresa řádek 2', 'Patička · Kontakt', { maxLength: 120 }),
  'footer.email': f('Patička - e-mail', 'Patička · Kontakt', { maxLength: 120 }),
  'footer.copyright': f('Patička - copyright', 'Patička', { maxLength: 200 }),
  'footer.privacyLabel': f('Patička - popisek ochrany soukromí', 'Patička · Právní', { maxLength: 48 }),
  'footer.termsLabel': f('Patička - popisek obchodních podmínek', 'Patička · Právní', { maxLength: 48 }),
  'footer.linkPrivacyHref': f('Patička - adresa stránky o ochraně soukromí', 'Patička · Právní', {
    helpText: 'Krátká adresa na vašem webu (např. /ochrana-soukromi) nebo celý odkaz zkopírovaný z prohlížeče.',
    maxLength: 500,
  }),
  'footer.linkTermsHref': f('Patička - adresa stránky obchodních podmínek', 'Patička · Právní', {
    helpText: 'Krátká adresa na vašem webu (např. /obchodni-podminky) nebo celý odkaz zkopírovaný z prohlížeče.',
    maxLength: 500,
  }),
  'footer.socialInstagramHref': f('Patička - odkaz Instagram (ikona pod logem)', 'Patička · Sociální sítě', {
    helpText: 'Celá adresa profilu (https://…). Prázdné: ikona se nezobrazí.',
    maxLength: 500,
  }),
  'footer.socialLinkedinHref': f('Patička - odkaz LinkedIn (ikona pod logem)', 'Patička · Sociální sítě', {
    helpText: 'Celá adresa profilu nebo stránky firmy (https://…). Prázdné: ikona se nezobrazí.',
    maxLength: 500,
  }),
  'footer.socialFacebookHref': f('Patička - odkaz Facebook (ikona pod logem)', 'Patička · Sociální sítě', {
    helpText: 'Volitelné. Celá adresa (https://…). Prázdné: ikona se nezobrazí.',
    maxLength: 500,
  }),

  // -- Global contact (outside footer)
  'contact.phone': f('Kontakt - telefon', 'Kontakt (všechny stránky)', { maxLength: 40 }),
  'contact.email': f('Kontakt - e-mail', 'Kontakt (všechny stránky)', { maxLength: 120 }),
  'contact.address': f('Kontakt - adresa', 'Kontakt (všechny stránky)', {
    type: 'textarea',
    maxLength: 300,
  }),

  'about.text': f('O nás - text', 'Stránka O nás', {
    type: 'textarea',
    helpText: 'Hlavní text stránky „O nás“, který uvidí návštěvníci webu.',
    maxLength: 4000,
  }),

  // -- Pricing page (standalone page with tiers and cards)
  'pricingPage.hero.badge': f('Ceník - malý štítek v úvodu', 'Ceník', { maxLength: 64 }),
  'pricingPage.hero.title': f('Ceník - hlavní nadpis v úvodu', 'Ceník', { maxLength: 120 }),
  'pricingPage.hero.lead': f('Ceník - úvodní text', 'Ceník', {
    type: 'textarea',
    maxLength: 720,
  }),
  'pricingPage.hero.image': f('Ceník - obrázek v úvodu', 'Ceník', { type: 'image' }),
  'pricingPage.hero.imageAlt': f('Ceník - popis obrázku v úvodu', 'Ceník', { maxLength: 280 }),

  'pricingPage.journey.title': f('Ceník - cesta nadpis', 'Ceník', { maxLength: 100 }),
  'pricingPage.journey.lead': f('Ceník - cesta úvod', 'Ceník', {
    type: 'textarea',
    maxLength: 500,
  }),
  'pricingPage.journey.step1.title': f('Ceník - krok 1 nadpis', 'Ceník', { maxLength: 80 }),
  'pricingPage.journey.step1.desc': f('Ceník - krok 1 popis', 'Ceník', {
    type: 'textarea',
    maxLength: 600,
  }),
  'pricingPage.journey.step2.title': f('Ceník - krok 2 nadpis', 'Ceník', { maxLength: 80 }),
  'pricingPage.journey.step2.desc': f('Ceník - krok 2 popis', 'Ceník', {
    type: 'textarea',
    maxLength: 600,
  }),
  'pricingPage.journey.step3.title': f('Ceník - krok 3 nadpis', 'Ceník', { maxLength: 80 }),
  'pricingPage.journey.step3.desc': f('Ceník - krok 3 popis', 'Ceník', {
    type: 'textarea',
    maxLength: 600,
  }),

  'pricingPage.tiers.eyebrow': f('Ceník - tarify drobný nadpis', 'Ceník', { maxLength: 64 }),
  'pricingPage.tiers.title': f('Ceník - tarify hlavní nadpis', 'Ceník', { maxLength: 100 }),

  'pricingPage.plan1.category': f('Tarif 1 - kategorie', 'Ceník · Tarif 1', { maxLength: 48 }),
  'pricingPage.plan1.title': f('Tarif 1 - název', 'Ceník · Tarif 1', { maxLength: 100 }),
  'pricingPage.plan1.pricePrefix': f('Tarif 1 - slovo před cenou (např. „od“)', 'Ceník · Tarif 1', {
    maxLength: 16,
  }),
  'pricingPage.plan1.price': f('Tarif 1 - cena', 'Ceník · Tarif 1', { maxLength: 48 }),
  'pricingPage.plan1.desc': f('Tarif 1 - popis', 'Ceník · Tarif 1', { type: 'textarea', maxLength: 600 }),
  'pricingPage.plan1.cta': f('Tarif 1 - tlačítko', 'Ceník · Tarif 1', { maxLength: 80 }),

  'pricingPage.plan2.category': f('Tarif 2 - kategorie', 'Ceník · Tarif 2', { maxLength: 48 }),
  'pricingPage.plan2.title': f('Tarif 2 - název', 'Ceník · Tarif 2', { maxLength: 100 }),
  'pricingPage.plan2.pricePrefix': f('Tarif 2 - slovo před cenou', 'Ceník · Tarif 2', { maxLength: 16 }),
  'pricingPage.plan2.price': f('Tarif 2 - cena', 'Ceník · Tarif 2', { maxLength: 48 }),
  'pricingPage.plan2.desc': f('Tarif 2 - popis', 'Ceník · Tarif 2', { type: 'textarea', maxLength: 600 }),
  'pricingPage.plan2.cta': f('Tarif 2 - tlačítko', 'Ceník · Tarif 2', { maxLength: 80 }),
  'pricingPage.plan2.badgePopular': f('Tarif 2 - štítek zvýrazněné karty', 'Ceník · Tarif 2', { maxLength: 32 }),

  'pricingPage.plan3.category': f('Tarif 3 - kategorie', 'Ceník · Tarif 3', { maxLength: 48 }),
  'pricingPage.plan3.title': f('Tarif 3 - název', 'Ceník · Tarif 3', { maxLength: 100 }),
  'pricingPage.plan3.pricePrefix': f('Tarif 3 - slovo před cenou', 'Ceník · Tarif 3', { maxLength: 16 }),
  'pricingPage.plan3.price': f('Tarif 3 - cena', 'Ceník · Tarif 3', { maxLength: 48 }),
  'pricingPage.plan3.desc': f('Tarif 3 - popis', 'Ceník · Tarif 3', { type: 'textarea', maxLength: 600 }),
  'pricingPage.plan3.cta': f('Tarif 3 - tlačítko', 'Ceník · Tarif 3', { maxLength: 80 }),

  'pricingPage.standard.title': f('Ceník - standard nadpis', 'Standard', { maxLength: 100 }),
  'pricingPage.standard.lead': f('Ceník - úvodní text u standardních karet', 'Standard', {
    type: 'textarea',
    maxLength: 500,
  }),
  'pricingPage.standard.row1.label': f('Standard - řádek 1 popisek', 'Standard', { maxLength: 80 }),
  'pricingPage.standard.row2.label': f('Standard - řádek 2 popisek', 'Standard', { maxLength: 80 }),
  'pricingPage.standard.card1.title': f('Nadpis', 'Standard', {
    maxLength: 100,
    helpText: 'Nadpis karty; stejný text se ukáže i v přepínači karet výše na této stránce.',
  }),
  'pricingPage.standard.card1.desc': f('Popis', 'Standard', {
    type: 'textarea',
    maxLength: 400,
    helpText: 'Delší popis pod nadpisem této karty.',
  }),
  'pricingPage.standard.card2.title': f('Nadpis', 'Standard', {
    maxLength: 100,
    helpText: 'Nadpis druhé karty (a text v přepínači).',
  }),
  'pricingPage.standard.card2.desc': f('Popis', 'Standard', {
    type: 'textarea',
    maxLength: 400,
    helpText: 'Text druhé karty.',
  }),
  'pricingPage.standard.card3.title': f('Nadpis', 'Standard', {
    maxLength: 100,
    helpText: 'Nadpis třetí karty (a text v přepínači).',
  }),
  'pricingPage.standard.card3.desc': f('Popis', 'Standard', {
    type: 'textarea',
    maxLength: 400,
    helpText: 'Text třetí karty.',
  }),
  'pricingPage.standard.card4.title': f('Nadpis', 'Standard', {
    maxLength: 100,
    helpText: 'Nadpis čtvrté karty (a text v přepínači).',
  }),
  'pricingPage.standard.card4.desc': f('Popis', 'Standard', {
    type: 'textarea',
    maxLength: 400,
    helpText: 'Text čtvrté karty.',
  }),

  'pricingPage.final.title': f('Ceník - závěr nadpis', 'Závěr', { maxLength: 120 }),
  'pricingPage.final.lead': f('Ceník - závěr text', 'Závěr', {
    type: 'textarea',
    maxLength: 500,
  }),
  'pricingPage.final.btnPrimary': f('Ceník - závěr, hlavní tlačítko', 'Závěr', { maxLength: 80 }),
  'pricingPage.final.btnSecondary': f('Ceník - závěr, druhé tlačítko', 'Závěr', { maxLength: 80 }),

  // -- Contact page
  'contactPage.hero.badge': f('Kontakt - malý štítek v úvodu', 'Kontakt · Úvod', { maxLength: 64 }),
  'contactPage.hero.title': f('Kontakt - hlavní nadpis v úvodu', 'Kontakt · Úvod', { maxLength: 120 }),
  'contactPage.hero.lead': f('Kontakt - úvodní text', 'Kontakt · Úvod', {
    type: 'textarea',
    maxLength: 720,
  }),

  'contactPage.trust1.title': f('Kontakt - důvěra 1 nadpis', 'Kontakt · Důvěra', { maxLength: 100 }),
  'contactPage.trust1.desc': f('Kontakt - důvěra 1 popis', 'Kontakt · Důvěra', {
    type: 'textarea',
    maxLength: 500,
  }),
  'contactPage.trust2.title': f('Kontakt - důvěra 2 nadpis', 'Kontakt · Důvěra', { maxLength: 100 }),
  'contactPage.trust2.desc': f('Kontakt - důvěra 2 popis', 'Kontakt · Důvěra', {
    type: 'textarea',
    maxLength: 500,
  }),

  'contactPage.office.label': f('Kontakt - štítek sídlo', 'Kontakt · Sídlo', { maxLength: 32 }),
  'contactPage.office.line1': f('Kontakt - sídlo řádek 1', 'Kontakt · Sídlo', { maxLength: 120 }),
  'contactPage.office.line2': f('Kontakt - sídlo řádek 2', 'Kontakt · Sídlo', { maxLength: 120 }),
  'contactPage.office.line3': f('Kontakt - sídlo řádek 3', 'Kontakt · Sídlo', { maxLength: 120 }),
  'contactPage.direct.label': f('Kontakt - štítek přímý kontakt', 'Kontakt · Přímý kontakt', { maxLength: 32 }),
  'contactPage.direct.email': f('Kontakt - přímý e-mail', 'Kontakt · Přímý kontakt', { maxLength: 120 }),
  'contactPage.direct.phone': f('Kontakt - přímý telefon', 'Kontakt · Přímý kontakt', { maxLength: 40 }),

  'contactPage.form.nameLabel': f('Formulář - popisek jméno', 'Kontakt · Formulář', { maxLength: 64 }),
  'contactPage.form.namePlaceholder': f('Formulář - nápověda v poli jméno', 'Kontakt · Formulář', {
    maxLength: 80,
  }),
  'contactPage.form.emailLabel': f('Formulář - popisek e-mail', 'Kontakt · Formulář', { maxLength: 64 }),
  'contactPage.form.emailPlaceholder': f('Formulář - nápověda v poli e-mail', 'Kontakt · Formulář', {
    maxLength: 80,
  }),
  'contactPage.form.projectTypeLabel': f('Formulář - popisek výběru typu projektu', 'Kontakt · Formulář', {
    maxLength: 64,
  }),
  'contactPage.form.projectTypePlaceholderOption': f('Formulář - nápověda u výběru typu', 'Kontakt · Formulář', {
    maxLength: 80,
  }),
  'contactPage.form.optionKitchen': f('Formulář - volba kuchyně', 'Kontakt · Formulář · Volby', {
    maxLength: 120,
  }),
  'contactPage.form.optionBathroom': f('Formulář - volba koupelna', 'Kontakt · Formulář · Volby', {
    maxLength: 120,
  }),
  'contactPage.form.optionFullHome': f('Formulář - volba celý domov', 'Kontakt · Formulář · Volby', {
    maxLength: 120,
  }),
  'contactPage.form.optionAddition': f('Formulář - volba přístavba', 'Kontakt · Formulář · Volby', {
    maxLength: 120,
  }),
  'contactPage.form.optionOutdoor': f('Formulář - volba exteriér', 'Kontakt · Formulář · Volby', {
    maxLength: 120,
  }),
  'contactPage.form.budgetLabel': f('Formulář - popisek výběru rozpočtu', 'Kontakt · Formulář', { maxLength: 64 }),
  'contactPage.form.budget1': f('Formulář - rozpočet varianta 1', 'Kontakt · Formulář · Rozpočet', {
    maxLength: 48,
  }),
  'contactPage.form.budget2': f('Formulář - rozpočet varianta 2', 'Kontakt · Formulář · Rozpočet', {
    maxLength: 48,
  }),
  'contactPage.form.budget3': f('Formulář - rozpočet varianta 3', 'Kontakt · Formulář · Rozpočet', {
    maxLength: 48,
  }),
  'contactPage.form.detailsLabel': f('Formulář - popisek pole pro zprávu', 'Kontakt · Formulář', { maxLength: 64 }),
  'contactPage.form.detailsPlaceholder': f('Formulář - nápověda v poli zpráva', 'Kontakt · Formulář', {
    type: 'textarea',
    maxLength: 200,
  }),
  'contactPage.form.submit': f('Formulář - odeslat', 'Kontakt · Formulář', { maxLength: 64 }),
  'contactPage.form.responseNote': f('Formulář - poznámka odezvy', 'Kontakt · Formulář', { maxLength: 120 }),

  'contactPage.banner.image': f('Kontakt - banner obrázek', 'Kontakt · Banner', { type: 'image' }),
  'contactPage.banner.imageAlt': f('Kontakt - popis obrázku v banneru', 'Kontakt · Banner', { maxLength: 280 }),
  'contactPage.banner.title': f('Kontakt - banner nadpis', 'Kontakt · Banner', { maxLength: 100 }),
  'contactPage.banner.cta': f('Kontakt - text tlačítka v banneru', 'Kontakt · Banner', { maxLength: 64 }),

  'contactPage.footer.copyright': f('Kontakt - patička, text copyrightu', 'Kontakt · Patička', { maxLength: 200 }),
  'contactPage.footer.linkPrivacy': f('Kontakt - patička, text odkazu ochrana soukromí', 'Kontakt · Patička', {
    maxLength: 80,
  }),
  'contactPage.footer.linkTerms': f('Kontakt - patička, text odkazu obchodní podmínky', 'Kontakt · Patička', {
    maxLength: 80,
  }),
  'contactPage.footer.linkSustainability': f('Kontakt - patička, text odkazu udržitelnost', 'Kontakt · Patička', {
    maxLength: 80,
  }),
  'contactPage.footer.linkAccessibility': f('Kontakt - patička, text odkazu přístupnost', 'Kontakt · Patička', {
    maxLength: 80,
  }),
};

/** Field order in the form (stable ordering in the admin UI). */
export const archCmsConfigKeyOrder = Object.keys(archCmsConfig);

/**
 * CMS metadata pro všechny klíče z arch-cs.json / arch-en.json.
 * Klíče odpovídají flat mapě obsahu na webu i v API.
 */

import type { ContentConfig, ContentField } from './cms-field-types';

function f(label: string, section: string, rest: Partial<ContentField> = {}): ContentField {
  return { label, section, ...rest };
}

export const archCmsConfig: ContentConfig = {
  // —— Administrace
  'admin.siteName': f('Název webu (značka)', 'Administrace', {
    required: true,
    helpText: 'Zobrazuje se v hlavičce a branding; obvykle ARCH&CO nebo název studia.',
    recommendedMaxLength: 40,
    maxLength: 80,
  }),
  'admin.logo': f('Logo (URL)', 'Administrace', {
    type: 'image',
    helpText: 'Logo pro CMS / web; lze použít i prázdné, pokud stačí textový název.',
  }),

  // —— Navigace
  'nav.portfolio': f('Menu — Portfolio', 'Navigace', { recommendedMaxLength: 24, maxLength: 48 }),
  'nav.process': f('Menu — Postup práce', 'Navigace', { recommendedMaxLength: 28, maxLength: 56 }),
  'nav.services': f('Menu — Služby', 'Navigace', { recommendedMaxLength: 24, maxLength: 48 }),
  'nav.about': f('Menu — O nás', 'Navigace', { recommendedMaxLength: 24, maxLength: 48 }),
  'nav.contact': f('Menu — Kontakt', 'Navigace', { recommendedMaxLength: 24, maxLength: 48 }),
  'nav.pricing': f('Menu — Ceník', 'Navigace', { recommendedMaxLength: 24, maxLength: 48 }),
  'nav.ctaQuote': f('Menu — CTA (poptávka)', 'Navigace', {
    helpText: 'Text primárního tlačítka / odkazu v menu.',
    recommendedMaxLength: 32,
    maxLength: 64,
  }),

  // —— Domů · Hero
  'hero.image': f('Hero — hlavní obrázek', 'Domů · Hero', {
    type: 'image',
    helpText: 'Široký vizuál (doporučeno min. ~1600 px šířky).',
  }),
  'hero.imageAlt': f('Hero — alt text obrázku', 'Domů · Hero', {
    helpText: 'Přístupný popis pro čtečky a SEO.',
    recommendedMaxLength: 120,
    maxLength: 280,
  }),
  'hero.badge': f('Hero — štítek nad nadpisem', 'Domů · Hero', {
    recommendedMaxLength: 48,
    maxLength: 100,
  }),
  'hero.title': f('Hero — hlavní nadpis', 'Domů · Hero', {
    recommendedMaxLength: 64,
    maxLength: 120,
  }),
  'hero.lead': f('Hero — perex', 'Domů · Hero', {
    type: 'textarea',
    recommendedMaxLength: 280,
    maxLength: 720,
  }),
  'hero.ctaPrimary': f('Hero — primární tlačítko', 'Domů · Hero', {
    recommendedMaxLength: 32,
    maxLength: 72,
  }),
  'hero.scrollHint': f('Hero — nápověda ke scrollu', 'Domů · Hero', {
    helpText: 'Krátký text pod CTA (např. „Prohlédnout portfolio“).',
    recommendedMaxLength: 36,
    maxLength: 80,
  }),

  // —— Domů · Portfolio
  'portfolio.title': f('Portfolio — nadpis sekce', 'Domů · Portfolio', {
    recommendedMaxLength: 48,
    maxLength: 100,
  }),
  'portfolio.desc': f('Portfolio — úvodní text', 'Domů · Portfolio', {
    type: 'textarea',
    recommendedMaxLength: 220,
    maxLength: 600,
  }),
  'portfolio.tag1': f('Portfolio — filtr / tag 1', 'Domů · Portfolio', {
    recommendedMaxLength: 24,
    maxLength: 48,
  }),
  'portfolio.tag2': f('Portfolio — filtr / tag 2', 'Domů · Portfolio', {
    recommendedMaxLength: 24,
    maxLength: 48,
  }),
  'portfolio.tag3': f('Portfolio — filtr / tag 3', 'Domů · Portfolio', {
    recommendedMaxLength: 24,
    maxLength: 48,
  }),

  'portfolio.card1.location': f('Karta 1 — lokalita', 'Domů · Portfolio · Karta 1', {
    recommendedMaxLength: 32,
    maxLength: 64,
  }),
  'portfolio.card1.title': f('Karta 1 — titulek', 'Domů · Portfolio · Karta 1', {
    recommendedMaxLength: 48,
    maxLength: 100,
  }),
  'portfolio.card1.image': f('Karta 1 — obrázek', 'Domů · Portfolio · Karta 1', { type: 'image' }),
  'portfolio.card1.imageAlt': f('Karta 1 — alt obrázku', 'Domů · Portfolio · Karta 1', {
    maxLength: 280,
  }),

  'portfolio.card2.location': f('Karta 2 — lokalita', 'Domů · Portfolio · Karta 2', {
    recommendedMaxLength: 32,
    maxLength: 64,
  }),
  'portfolio.card2.title': f('Karta 2 — titulek', 'Domů · Portfolio · Karta 2', {
    recommendedMaxLength: 48,
    maxLength: 100,
  }),
  'portfolio.card2.image': f('Karta 2 — obrázek', 'Domů · Portfolio · Karta 2', { type: 'image' }),
  'portfolio.card2.imageAlt': f('Karta 2 — alt obrázku', 'Domů · Portfolio · Karta 2', {
    maxLength: 280,
  }),

  'portfolio.beforeLabel': f('Před/po — popisek „Před“', 'Domů · Portfolio · Před a po', {
    maxLength: 24,
  }),
  'portfolio.afterLabel': f('Před/po — popisek „Po“', 'Domů · Portfolio · Před a po', { maxLength: 24 }),
  'portfolio.beforeImage': f('Před/po — obrázek před', 'Domů · Portfolio · Před a po', { type: 'image' }),
  'portfolio.beforeImageAlt': f('Před/po — alt před', 'Domů · Portfolio · Před a po', { maxLength: 280 }),
  'portfolio.afterImage': f('Před/po — obrázek po', 'Domů · Portfolio · Před a po', { type: 'image' }),
  'portfolio.afterImageAlt': f('Před/po — alt po', 'Domů · Portfolio · Před a po', { maxLength: 280 }),

  'portfolio.detail1.image': f('Detail 1 — obrázek', 'Domů · Portfolio · Detaily', { type: 'image' }),
  'portfolio.detail1.imageAlt': f('Detail 1 — alt', 'Domů · Portfolio · Detaily', { maxLength: 280 }),
  'portfolio.detail2.image': f('Detail 2 — obrázek', 'Domů · Portfolio · Detaily', { type: 'image' }),
  'portfolio.detail2.imageAlt': f('Detail 2 — alt', 'Domů · Portfolio · Detaily', { maxLength: 280 }),
  'portfolio.detail3.image': f('Detail 3 — obrázek', 'Domů · Portfolio · Detaily', { type: 'image' }),
  'portfolio.detail3.imageAlt': f('Detail 3 — alt', 'Domů · Portfolio · Detaily', { maxLength: 280 }),

  // —— Domů · Řemeslo
  'craft.image': f('Řemeslo — obrázek', 'Domů · Řemeslo', { type: 'image' }),
  'craft.imageAlt': f('Řemeslo — alt obrázku', 'Domů · Řemeslo', { maxLength: 280 }),
  'craft.label': f('Řemeslo — malý štítek', 'Domů · Řemeslo', { maxLength: 40 }),
  'craft.title': f('Řemeslo — nadpis', 'Domů · Řemeslo', { recommendedMaxLength: 64, maxLength: 120 }),
  'craft.lead': f('Řemeslo — perex', 'Domů · Řemeslo', {
    type: 'textarea',
    recommendedMaxLength: 260,
    maxLength: 720,
  }),
  'craft.bullet1.title': f('Řemeslo — bod 1 nadpis', 'Domů · Řemeslo · Body', { maxLength: 80 }),
  'craft.bullet1.desc': f('Řemeslo — bod 1 popis', 'Domů · Řemeslo · Body', {
    type: 'textarea',
    maxLength: 400,
  }),
  'craft.bullet2.title': f('Řemeslo — bod 2 nadpis', 'Domů · Řemeslo · Body', { maxLength: 80 }),
  'craft.bullet2.desc': f('Řemeslo — bod 2 popis', 'Domů · Řemeslo · Body', {
    type: 'textarea',
    maxLength: 400,
  }),

  // —— Domů · CTA blok
  'cta.bgImage': f('CTA — pozadí', 'Domů · CTA', { type: 'image' }),
  'cta.bgImageAlt': f('CTA — alt pozadí', 'Domů · CTA', { maxLength: 280 }),
  'cta.title': f('CTA — nadpis', 'Domů · CTA', { recommendedMaxLength: 72, maxLength: 140 }),
  'cta.lead': f('CTA — text', 'Domů · CTA', {
    type: 'textarea',
    recommendedMaxLength: 200,
    maxLength: 600,
  }),
  'cta.btnPrimary': f('CTA — primární tlačítko', 'Domů · CTA', { maxLength: 80 }),
  'cta.btnSecondary': f('CTA — sekundární tlačítko', 'Domů · CTA', { maxLength: 80 }),

  // —— Footer (hlavní stránka)
  'footer.blurb': f('Footer — krátký popis', 'Footer', {
    type: 'textarea',
    recommendedMaxLength: 200,
    maxLength: 500,
  }),
  'footer.columnExpertise': f('Footer — nadpis sloupce Odbornost', 'Footer', { maxLength: 48 }),
  'footer.linkExp1': f('Footer — odkaz odbornost 1', 'Footer · Odbornost', { maxLength: 80 }),
  'footer.linkExp2': f('Footer — odkaz odbornost 2', 'Footer · Odbornost', { maxLength: 80 }),
  'footer.linkExp3': f('Footer — odkaz odbornost 3', 'Footer · Odbornost', { maxLength: 80 }),
  'footer.linkExp4': f('Footer — odkaz odbornost 4', 'Footer · Odbornost', { maxLength: 80 }),
  'footer.columnNavigation': f('Footer — nadpis sloupce Navigace', 'Footer', { maxLength: 48 }),
  'footer.linkNav1': f('Footer — odkaz navigace 1', 'Footer · Navigace', { maxLength: 80 }),
  'footer.linkNav2': f('Footer — odkaz navigace 2', 'Footer · Navigace', { maxLength: 80 }),
  'footer.linkNav3': f('Footer — odkaz navigace 3', 'Footer · Navigace', { maxLength: 80 }),
  'footer.linkNav4': f('Footer — odkaz navigace 4', 'Footer · Navigace', { maxLength: 80 }),
  'footer.columnConnect': f('Footer — nadpis sloupce Kontakt', 'Footer', { maxLength: 48 }),
  'footer.addressLine1': f('Footer — adresa řádek 1', 'Footer · Kontakt', { maxLength: 120 }),
  'footer.addressLine2': f('Footer — adresa řádek 2', 'Footer · Kontakt', { maxLength: 120 }),
  'footer.email': f('Footer — e-mail', 'Footer · Kontakt', { maxLength: 120 }),
  'footer.copyright': f('Footer — copyright', 'Footer', { maxLength: 200 }),
  'footer.privacyLabel': f('Footer — popisek ochrany soukromí', 'Footer · Právní', { maxLength: 48 }),
  'footer.termsLabel': f('Footer — popisek obchodních podmínek', 'Footer · Právní', { maxLength: 48 }),
  'footer.linkPrivacyHref': f('Footer — URL ochrany soukromí', 'Footer · Právní', {
    helpText: 'Kotva nebo absolutní URL.',
    maxLength: 500,
    advanced: true,
  }),
  'footer.linkTermsHref': f('Footer — URL obchodních podmínek', 'Footer · Právní', {
    maxLength: 500,
    advanced: true,
  }),

  // —— Globální kontakt (mimo footer)
  'contact.phone': f('Kontakt — telefon', 'Kontakt (globální)', { maxLength: 40 }),
  'contact.email': f('Kontakt — e-mail', 'Kontakt (globální)', { maxLength: 120 }),
  'contact.address': f('Kontakt — adresa', 'Kontakt (globální)', {
    type: 'textarea',
    maxLength: 300,
  }),

  'about.text': f('O nás — text', 'Stránka O nás', {
    type: 'textarea',
    helpText: 'Hlavní text sekce / stránky O nás.',
    maxLength: 4000,
  }),

  // —— Stránka Ceník
  'pricingPage.hero.badge': f('Ceník — hero štítek', 'Ceník · Hero', { maxLength: 64 }),
  'pricingPage.hero.title': f('Ceník — hero nadpis', 'Ceník · Hero', { maxLength: 120 }),
  'pricingPage.hero.lead': f('Ceník — hero perex', 'Ceník · Hero', {
    type: 'textarea',
    maxLength: 720,
  }),
  'pricingPage.hero.image': f('Ceník — hero obrázek', 'Ceník · Hero', { type: 'image' }),
  'pricingPage.hero.imageAlt': f('Ceník — hero alt', 'Ceník · Hero', { maxLength: 280 }),

  'pricingPage.journey.title': f('Ceník — cesta nadpis', 'Ceník · Cesta rekonstrukce', { maxLength: 100 }),
  'pricingPage.journey.lead': f('Ceník — cesta úvod', 'Ceník · Cesta rekonstrukce', {
    type: 'textarea',
    maxLength: 500,
  }),
  'pricingPage.journey.step1.title': f('Ceník — krok 1 nadpis', 'Ceník · Cesta · Kroky', { maxLength: 80 }),
  'pricingPage.journey.step1.desc': f('Ceník — krok 1 popis', 'Ceník · Cesta · Kroky', {
    type: 'textarea',
    maxLength: 600,
  }),
  'pricingPage.journey.step2.title': f('Ceník — krok 2 nadpis', 'Ceník · Cesta · Kroky', { maxLength: 80 }),
  'pricingPage.journey.step2.desc': f('Ceník — krok 2 popis', 'Ceník · Cesta · Kroky', {
    type: 'textarea',
    maxLength: 600,
  }),
  'pricingPage.journey.step3.title': f('Ceník — krok 3 nadpis', 'Ceník · Cesta · Kroky', { maxLength: 80 }),
  'pricingPage.journey.step3.desc': f('Ceník — krok 3 popis', 'Ceník · Cesta · Kroky', {
    type: 'textarea',
    maxLength: 600,
  }),

  'pricingPage.tiers.eyebrow': f('Ceník — tarify drobný nadpis', 'Ceník · Tarify', { maxLength: 64 }),
  'pricingPage.tiers.title': f('Ceník — tarify hlavní nadpis', 'Ceník · Tarify', { maxLength: 100 }),

  'pricingPage.plan1.category': f('Tarif 1 — kategorie', 'Ceník · Tarif 1', { maxLength: 48 }),
  'pricingPage.plan1.title': f('Tarif 1 — název', 'Ceník · Tarif 1', { maxLength: 100 }),
  'pricingPage.plan1.pricePrefix': f('Tarif 1 — prefix ceny (např. „od“)', 'Ceník · Tarif 1', {
    maxLength: 16,
  }),
  'pricingPage.plan1.price': f('Tarif 1 — cena', 'Ceník · Tarif 1', { maxLength: 48 }),
  'pricingPage.plan1.desc': f('Tarif 1 — popis', 'Ceník · Tarif 1', { type: 'textarea', maxLength: 600 }),
  'pricingPage.plan1.cta': f('Tarif 1 — tlačítko', 'Ceník · Tarif 1', { maxLength: 80 }),

  'pricingPage.plan2.category': f('Tarif 2 — kategorie', 'Ceník · Tarif 2', { maxLength: 48 }),
  'pricingPage.plan2.title': f('Tarif 2 — název', 'Ceník · Tarif 2', { maxLength: 100 }),
  'pricingPage.plan2.pricePrefix': f('Tarif 2 — prefix ceny', 'Ceník · Tarif 2', { maxLength: 16 }),
  'pricingPage.plan2.price': f('Tarif 2 — cena', 'Ceník · Tarif 2', { maxLength: 48 }),
  'pricingPage.plan2.desc': f('Tarif 2 — popis', 'Ceník · Tarif 2', { type: 'textarea', maxLength: 600 }),
  'pricingPage.plan2.cta': f('Tarif 2 — tlačítko', 'Ceník · Tarif 2', { maxLength: 80 }),
  'pricingPage.plan2.badgePopular': f('Tarif 2 — odznak (oblíbené)', 'Ceník · Tarif 2', { maxLength: 32 }),

  'pricingPage.plan3.category': f('Tarif 3 — kategorie', 'Ceník · Tarif 3', { maxLength: 48 }),
  'pricingPage.plan3.title': f('Tarif 3 — název', 'Ceník · Tarif 3', { maxLength: 100 }),
  'pricingPage.plan3.pricePrefix': f('Tarif 3 — prefix ceny', 'Ceník · Tarif 3', { maxLength: 16 }),
  'pricingPage.plan3.price': f('Tarif 3 — cena', 'Ceník · Tarif 3', { maxLength: 48 }),
  'pricingPage.plan3.desc': f('Tarif 3 — popis', 'Ceník · Tarif 3', { type: 'textarea', maxLength: 600 }),
  'pricingPage.plan3.cta': f('Tarif 3 — tlačítko', 'Ceník · Tarif 3', { maxLength: 80 }),

  'pricingPage.standard.title': f('Ceník — standard nadpis', 'Ceník · Standard', { maxLength: 100 }),
  'pricingPage.standard.lead': f('Ceník — standard perex', 'Ceník · Standard', {
    type: 'textarea',
    maxLength: 500,
  }),
  'pricingPage.standard.row1.label': f('Standard — řádek 1 popisek', 'Ceník · Standard', { maxLength: 80 }),
  'pricingPage.standard.row2.label': f('Standard — řádek 2 popisek', 'Ceník · Standard', { maxLength: 80 }),
  'pricingPage.standard.card1.title': f('Standard — karta 1 nadpis', 'Ceník · Standard · Karty', {
    maxLength: 100,
  }),
  'pricingPage.standard.card1.desc': f('Standard — karta 1 popis', 'Ceník · Standard · Karty', {
    type: 'textarea',
    maxLength: 400,
  }),
  'pricingPage.standard.card2.title': f('Standard — karta 2 nadpis', 'Ceník · Standard · Karty', {
    maxLength: 100,
  }),
  'pricingPage.standard.card2.desc': f('Standard — karta 2 popis', 'Ceník · Standard · Karty', {
    type: 'textarea',
    maxLength: 400,
  }),
  'pricingPage.standard.card3.title': f('Standard — karta 3 nadpis', 'Ceník · Standard · Karty', {
    maxLength: 100,
  }),
  'pricingPage.standard.card3.desc': f('Standard — karta 3 popis', 'Ceník · Standard · Karty', {
    type: 'textarea',
    maxLength: 400,
  }),
  'pricingPage.standard.card4.title': f('Standard — karta 4 nadpis', 'Ceník · Standard · Karty', {
    maxLength: 100,
  }),
  'pricingPage.standard.card4.desc': f('Standard — karta 4 popis', 'Ceník · Standard · Karty', {
    type: 'textarea',
    maxLength: 400,
  }),

  'pricingPage.final.title': f('Ceník — závěr nadpis', 'Ceník · Závěr', { maxLength: 120 }),
  'pricingPage.final.lead': f('Ceník — závěr text', 'Ceník · Závěr', {
    type: 'textarea',
    maxLength: 500,
  }),
  'pricingPage.final.btnPrimary': f('Ceník — závěr primární tlačítko', 'Ceník · Závěr', { maxLength: 80 }),
  'pricingPage.final.btnSecondary': f('Ceník — závěr sekundární tlačítko', 'Ceník · Závěr', { maxLength: 80 }),

  'pricingPage.footer.blurb': f('Ceník footer — popis', 'Ceník · Footer', {
    type: 'textarea',
    maxLength: 400,
  }),
  'pricingPage.footer.columnCompany': f('Ceník footer — sloupec Společnost', 'Ceník · Footer', {
    maxLength: 48,
  }),
  'pricingPage.footer.linkPortfolio': f('Ceník footer — Portfolio', 'Ceník · Footer · Odkazy', { maxLength: 80 }),
  'pricingPage.footer.linkProcess': f('Ceník footer — Postup', 'Ceník · Footer · Odkazy', { maxLength: 80 }),
  'pricingPage.footer.linkSustainability': f('Ceník footer — Udržitelnost', 'Ceník · Footer · Odkazy', {
    maxLength: 80,
  }),
  'pricingPage.footer.columnLegal': f('Ceník footer — sloupec Právní', 'Ceník · Footer', { maxLength: 48 }),
  'pricingPage.footer.linkPrivacy': f('Ceník footer — Ochrana soukromí', 'Ceník · Footer · Právní', {
    maxLength: 80,
  }),
  'pricingPage.footer.linkTerms': f('Ceník footer — Obchodní podmínky', 'Ceník · Footer · Právní', {
    maxLength: 80,
  }),
  'pricingPage.footer.linkAccessibility': f('Ceník footer — Přístupnost', 'Ceník · Footer · Právní', {
    maxLength: 80,
  }),
  'pricingPage.footer.columnNewsletter': f('Ceník footer — Newsletter nadpis', 'Ceník · Footer', {
    maxLength: 48,
  }),
  'pricingPage.footer.newsletterPlaceholder': f('Ceník footer — placeholder e-mail', 'Ceník · Footer', {
    maxLength: 40,
  }),
  'pricingPage.footer.copyright': f('Ceník footer — copyright', 'Ceník · Footer', { maxLength: 200 }),

  // —— Stránka Kontakt
  'contactPage.hero.badge': f('Kontakt — hero štítek', 'Kontakt · Hero', { maxLength: 64 }),
  'contactPage.hero.title': f('Kontakt — hero nadpis', 'Kontakt · Hero', { maxLength: 120 }),
  'contactPage.hero.lead': f('Kontakt — hero perex', 'Kontakt · Hero', {
    type: 'textarea',
    maxLength: 720,
  }),

  'contactPage.trust1.title': f('Kontakt — důvěra 1 nadpis', 'Kontakt · Důvěra', { maxLength: 100 }),
  'contactPage.trust1.desc': f('Kontakt — důvěra 1 popis', 'Kontakt · Důvěra', {
    type: 'textarea',
    maxLength: 500,
  }),
  'contactPage.trust2.title': f('Kontakt — důvěra 2 nadpis', 'Kontakt · Důvěra', { maxLength: 100 }),
  'contactPage.trust2.desc': f('Kontakt — důvěra 2 popis', 'Kontakt · Důvěra', {
    type: 'textarea',
    maxLength: 500,
  }),

  'contactPage.office.label': f('Kontakt — štítek sídlo', 'Kontakt · Sídlo', { maxLength: 32 }),
  'contactPage.office.line1': f('Kontakt — sídlo řádek 1', 'Kontakt · Sídlo', { maxLength: 120 }),
  'contactPage.office.line2': f('Kontakt — sídlo řádek 2', 'Kontakt · Sídlo', { maxLength: 120 }),
  'contactPage.office.line3': f('Kontakt — sídlo řádek 3', 'Kontakt · Sídlo', { maxLength: 120 }),
  'contactPage.direct.label': f('Kontakt — štítek přímý kontakt', 'Kontakt · Přímý kontakt', { maxLength: 32 }),
  'contactPage.direct.email': f('Kontakt — přímý e-mail', 'Kontakt · Přímý kontakt', { maxLength: 120 }),
  'contactPage.direct.phone': f('Kontakt — přímý telefon', 'Kontakt · Přímý kontakt', { maxLength: 40 }),

  'contactPage.form.nameLabel': f('Formulář — popisek jméno', 'Kontakt · Formulář', { maxLength: 64 }),
  'contactPage.form.namePlaceholder': f('Formulář — placeholder jméno', 'Kontakt · Formulář', {
    maxLength: 80,
  }),
  'contactPage.form.emailLabel': f('Formulář — popisek e-mail', 'Kontakt · Formulář', { maxLength: 64 }),
  'contactPage.form.emailPlaceholder': f('Formulář — placeholder e-mail', 'Kontakt · Formulář', {
    maxLength: 80,
  }),
  'contactPage.form.projectTypeLabel': f('Formulář — typ projektu label', 'Kontakt · Formulář', {
    maxLength: 64,
  }),
  'contactPage.form.projectTypePlaceholderOption': f('Formulář — placeholder výběr typu', 'Kontakt · Formulář', {
    maxLength: 80,
  }),
  'contactPage.form.optionKitchen': f('Formulář — volba kuchyně', 'Kontakt · Formulář · Volby', {
    maxLength: 120,
  }),
  'contactPage.form.optionBathroom': f('Formulář — volba koupelna', 'Kontakt · Formulář · Volby', {
    maxLength: 120,
  }),
  'contactPage.form.optionFullHome': f('Formulář — volba celý domov', 'Kontakt · Formulář · Volby', {
    maxLength: 120,
  }),
  'contactPage.form.optionAddition': f('Formulář — volba přístavba', 'Kontakt · Formulář · Volby', {
    maxLength: 120,
  }),
  'contactPage.form.optionOutdoor': f('Formulář — volba exteriér', 'Kontakt · Formulář · Volby', {
    maxLength: 120,
  }),
  'contactPage.form.budgetLabel': f('Formulář — rozpočet label', 'Kontakt · Formulář', { maxLength: 64 }),
  'contactPage.form.budget1': f('Formulář — rozpočet varianta 1', 'Kontakt · Formulář · Rozpočet', {
    maxLength: 48,
  }),
  'contactPage.form.budget2': f('Formulář — rozpočet varianta 2', 'Kontakt · Formulář · Rozpočet', {
    maxLength: 48,
  }),
  'contactPage.form.budget3': f('Formulář — rozpočet varianta 3', 'Kontakt · Formulář · Rozpočet', {
    maxLength: 48,
  }),
  'contactPage.form.detailsLabel': f('Formulář — detaily label', 'Kontakt · Formulář', { maxLength: 64 }),
  'contactPage.form.detailsPlaceholder': f('Formulář — detaily placeholder', 'Kontakt · Formulář', {
    type: 'textarea',
    maxLength: 200,
  }),
  'contactPage.form.submit': f('Formulář — odeslat', 'Kontakt · Formulář', { maxLength: 64 }),
  'contactPage.form.responseNote': f('Formulář — poznámka odezvy', 'Kontakt · Formulář', { maxLength: 120 }),

  'contactPage.banner.image': f('Kontakt — banner obrázek', 'Kontakt · Banner', { type: 'image' }),
  'contactPage.banner.imageAlt': f('Kontakt — banner alt', 'Kontakt · Banner', { maxLength: 280 }),
  'contactPage.banner.title': f('Kontakt — banner nadpis', 'Kontakt · Banner', { maxLength: 100 }),
  'contactPage.banner.cta': f('Kontakt — banner CTA', 'Kontakt · Banner', { maxLength: 64 }),

  'contactPage.footer.copyright': f('Kontakt footer — copyright', 'Kontakt · Footer', { maxLength: 200 }),
  'contactPage.footer.linkPrivacy': f('Kontakt footer — ochrana soukromí', 'Kontakt · Footer', {
    maxLength: 80,
  }),
  'contactPage.footer.linkTerms': f('Kontakt footer — obchodní podmínky', 'Kontakt · Footer', {
    maxLength: 80,
  }),
  'contactPage.footer.linkSustainability': f('Kontakt footer — udržitelnost', 'Kontakt · Footer', {
    maxLength: 80,
  }),
  'contactPage.footer.linkAccessibility': f('Kontakt footer — přístupnost', 'Kontakt · Footer', {
    maxLength: 80,
  }),
};

/** Pořadí klíčů podle arch-cs.json (vhodné pro stabilní UI). */
export const archCmsConfigKeyOrder = Object.keys(archCmsConfig);

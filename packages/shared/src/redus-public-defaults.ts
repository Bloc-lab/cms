/**
 * Výchozí texty odpovídající REDUS webu (public klíče jako `hero.title`, `contact.phone`, …).
 * Slouží k vyplnění prázdného CMS; DB používá úložné klíče (`main:hero.title`, …).
 */
import { parseStorageKey } from './site-pages.js';

export const REDUS_PUBLIC_DEFAULTS: Record<string, string> = {
  'admin.siteName': 'REDUS',
  'admin.tagline': '\u00da\u010cETN\u00cd A DA\u0148OV\u00c1 KANCEL\u00c1\u0158',

  'hero.enabled': 'show',
  'hero.badge': 'Vaše finance v bezpečných rukou od roku 2003',
  'hero.title': 'Profesionální účetnictví a daňová řešení pro váš růst',
  'hero.titleAccent': 'účetnictví',
  'hero.lead':
    'Jsme tým zkušených účetních a daňových specialistů. Spolehlivost, transparentnost a osobní přístup jsou u nás na prvním místě.',
  'hero.image':
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  'hero.cardTitle': '18+ let zkušeností na trhu',
  'hero.ctaPrimary': 'Nezávazná konzultace zdarma',
  'hero.ctaSecondary': 'Naše služby',

  'services.enabled': 'show',
  'services.sectionTitle': 'Komplexní služby pro vaše podnikání',
  'services.sectionDesc':
    'Od vedení účetnictví přes daňová přiznání až po strategické poradenství — vše pod jednou střechou.',
  'services.1.title': 'Podvojné účetnictví',
  'services.1.desc':
    'Kompletní vedení účetnictví přizpůsobené typu vašeho podnikání a legislativním požadavkům.',
  'services.2.title': 'Daňová přiznání',
  'services.2.desc':
    'Přehledná příprava a podání přiznání včas, s důrazem na optimalizaci vaší daňové pozice.',
  'services.3.title': 'Mzdy a personalistika',
  'services.3.desc':
    'Zpracování mezd, komunikace s úřady a podpora při HR agendě pro menší i větší týmy.',
  'services.4.title': 'Právní a daňové poradenství',
  'services.4.desc':
    'Strategické konzultace při změnách ve firmě, investicích nebo restrukturalizacích.',

  'why.enabled': 'show',
  'why.title': 'Proč si vybrat REDUS?',
  'why.text':
    'Působíme na trhu dlouhodobě a kombinujeme odborné know-how s lidským přístupem ke každému klientovi.',
  'why.bullet1': 'Individuální přístup',
  'why.bullet2': 'Pojištění odpovědnosti',
  'why.bullet3': 'Odbornost',
  'why.quote':
    '„Nabízíme víc než jen účetnictví — společně hledáme řešení, která podporují růst vašeho podnikání.“',
  'why.quoteAuthor': 'Martin Rada, vedoucí kanceláře',
  'why.image1':
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  'why.image2':
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',

  'pricing.enabled': 'show',
  'tax.enabled': 'show',
  'cta.enabled': 'show',
  'cta.title': 'Připraveni optimalizovat své účetnictví?',
  'cta.desc': 'Domluvte si nezávaznou úvodní konzultaci — rádi vám ukážeme, jak můžeme pomoci.',
  'cta.btnPhone': '',
  'cta.btnEmail': 'Napište nám e-mail',

  'cta.form.badge': 'Nezávazně',
  'cta.form.title': 'Domluvme si úvodní konzultaci',
  'cta.form.lead': 'Vyplňte krátký formulář a ozveme se vám co nejdříve.',
  'cta.form.bullet1': 'Odpověď do 24 hodin',
  'cta.form.bullet2': 'Nezávazně a zdarma',
  'cta.form.bullet3': 'Individuální přístup',
  'cta.form.nameLabel': 'Jméno',
  'cta.form.phoneLabel': 'Telefon',
  'cta.form.emailLabel': 'E-mail',
  'cta.form.messageLabel': 'Zpráva',

  'pricing.title': 'Ceník',
  'pricing.teaser':
    'Transparentní ceny podle rozsahu spolupráce. Konkrétní nabídku připravíme po krátké konzultaci.',
  'pricing.billingMode': 'dual',
  'pricing.billingMonthly': 'Měsíčně',
  'pricing.billingYearly': 'Ročně – sleva 20 %',
  'pricing.featuresHeading': 'Zahrnuje:',
  'pricing.plan1.title': 'Základ',
  'pricing.plan1.priceMonthly': '690 Kč / měsíc',
  'pricing.plan1.priceYearly': '6 600 Kč / rok',
  'pricing.plan1.desc':
    'Vhodné pro menší firmy a živnostníky, které chtějí mít účetnictví v pořádku bez starostí.',
  'pricing.plan1.cta': 'Nezávazně poptat',
  'pricing.plan1.ctaHref': '',
  'pricing.plan1.popularBadge': '',
  'pricing.plan1.features':
    'Vedení účetnictví\nMěsíční přehled\nEmail podpora\nZákladní daňová agenda',
  'pricing.plan2.title': 'Business',
  'pricing.plan2.priceMonthly': '1 490 Kč / měsíc',
  'pricing.plan2.priceYearly': '14 300 Kč / rok',
  'pricing.plan2.desc':
    'Pro firmy, které potřebují víc než minimum — rychlejší reakce a širší rozsah služeb.',
  'pricing.plan2.cta': 'Nezávazně poptat',
  'pricing.plan2.ctaHref': '',
  'pricing.plan2.popularBadge': 'Nejoblíbenější',
  'pricing.plan2.features':
    'Vše ze Základ\nPrioritní podpora\nKonzultace k rozhodnutím\nHlubší daňové plánování\nSpolupráce s vaším právníkem',
  'pricing.plan3.title': 'Enterprise',
  'pricing.plan3.priceMonthly': 'Individuálně',
  'pricing.plan3.priceYearly': 'Individuálně',
  'pricing.plan3.desc':
    'Na míru pro větší organizace a složitější struktury — domluvíme rozsah podle vašich potřeb.',
  'pricing.plan3.cta': 'Domluvit konzultaci',
  'pricing.plan3.ctaHref': '',
  'pricing.plan3.popularBadge': '',
  'pricing.plan3.features':
    'Dedikovaný kontakt\nVlastní reporty a procesy\nStrategické poradenství\nVíce entit / konsolidace\nSLA dle dohody',
  'tax.title': 'Daňové poradenství',
  'tax.teaser':
    'Strategické daňové plánování, optimalizace a podpora při jednání s finanční správou.',

  'contact.phone': '+420 123 456 789',
  'contact.email': 'info@redus.cz',
  'contact.address': 'Praha 1, Česká republika',

  'footer.blurb':
    'Spolehlivý partner pro účetnictví, daně a řízení podnikových financí.',
  'footer.billing':
    'Martin Rada\nIČO: 12345678\nDIČ: CZ12345678\nDatová schránka: abcdefg',
  'footer.copyright': '© 2025 REDUS. Všechna práva vyhrazena.',

  'about.text':
    'REDUS je účetní a daňová kancelář s dlouholetou tradicí. Pomáháme firmám i podnikatelům s řádným vedením účetnictví, daněmi a strategickým poradenstvím.',
};

/**
 * Hodnota pro klíč v DB (`main:hero.title`, `admin.siteName`, `footer.blurb`, …).
 */
export function resolveRedusSeedValue(fullKey: string, pub: Record<string, string> = REDUS_PUBLIC_DEFAULTS): string {
  if (Object.prototype.hasOwnProperty.call(pub, fullKey)) {
    return pub[fullKey] ?? '';
  }
  const p = parseStorageKey(fullKey);
  if (p && Object.prototype.hasOwnProperty.call(pub, p.fieldKey)) {
    return pub[p.fieldKey] ?? '';
  }
  return '';
}

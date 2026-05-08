/**
 * Výchozí texty odpovídající REDUS webu (public klíče jako `hero.title`, `contact.phone`, …).
 * Slouží k vyplnění prázdného CMS; DB používá úložné klíče (`main:hero.title`, …).
 */
import { parseStorageKey } from './site-pages.js';

export const REDUS_PUBLIC_DEFAULTS_CS: Record<string, string> = {
  'admin.siteName': 'REDUS',
  'admin.tagline': 'ÚČETNÍ A DAŇOVÁ KANCELÁŘ · PRAHA 8',

  'nav.services': 'Služby',
  'nav.about': 'O nás',
  'nav.pricing': 'Ceník',
  'nav.tax': 'Daňové poradenství',
  'nav.ctaContact': 'Kontaktujte nás',

  'hero.enabled': 'show',
  'hero.badge': 'Účetní kancelář Praha 8 – Čimice · praxe a osobní přístup',
  'hero.title': 'Účetnictví, mzdy a daně bez starostí',
  'hero.titleAccent': 'účetnictví',
  'hero.lead':
    'Komplexní vedení účetnictví, mzdové agendy a daňových přiznání pro OSVČ i firmy. Přehledně, včas a v souladu s aktuální legislativou.',
  'hero.image':
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  'hero.cardTitle': 'Účetnictví a poradenství pro Prahu a okolí',
  'hero.ctaPrimary': 'Domluvit konzultaci',
  'hero.ctaSecondary': 'Naše služby',

  'services.enabled': 'show',
  'services.sectionTitle': 'Služby účetní a daňové kanceláře',
  'services.sectionDesc':
    'Zajišťujeme kompletní vedení podvojného účetnictví i mezd, daňová přiznání a průběžné poradenství. Umíme i rekonstrukci účetnictví a reporting.',
  'services.1.title': 'Podvojné účetnictví a uzávěrka',
  'services.1.desc':
    'Kompletní vedení účetnictví včetně roční účetní uzávěrky, analytiky účtů a středisek a výstupů pro řízení firmy.',
  'services.2.title': 'Daňová přiznání a optimalizace',
  'services.2.desc':
    'DPH, daň z příjmu FO/PO, silniční daň a další dle potřeby. Včetně průběžných konzultací a návrhů optimalizace daňové povinnosti.',
  'services.3.title': 'Mzdy a personální agenda',
  'services.3.desc':
    'Kompletní mzdová a personální agenda, komunikace s úřady a podpora pro menší i větší týmy.',
  'services.4.title': 'Outsourcing účetnictví',
  'services.4.desc':
    'Převezmeme chod finanční účtárny: doklady, fakturaci, platební styk, zastupování na úřadech i reporty. Za jasných smluvních podmínek.',

  'why.enabled': 'show',
  'why.title': 'Proč si vybrat REDUS?',
  'why.text':
    'Stavíme na odbornosti, diskrétnosti a individuálním přístupu. Řešíme účetnictví a daně tak, abyste měli přehled a mohli se soustředit na podnikání.',
  'why.bullet1': 'Individuální přístup',
  'why.bullet2': 'Zkušenosti s firmami i OSVČ',
  'why.bullet3': 'Včasnost a transparentní komunikace',
  'why.quote':
    '„Nabízíme víc než jen účetnictví — dodáme vám jistotu, přehled a řešení, která podporují růst podnikání.“',
  'why.quoteAuthor': 'Martin Rada, vedoucí kanceláře',
  'why.image1':
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  'why.image2':
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',

  'pricing.enabled': 'show',
  'tax.enabled': 'show',
  'cta.enabled': 'show',
  'cta.title': 'Chcete mít účetnictví a daně v pořádku?',
  'cta.desc': 'Napište nám nebo zavolejte. Domluvíme si krátkou úvodní konzultaci a připravíme nabídku podle rozsahu vaší agendy.',
  'cta.btnPhone': '',
  'cta.btnEmail': 'Napsat e-mail',

  'cta.form.badge': 'Nezávazně',
  'cta.form.title': 'Popište nám krátce vaši situaci',
  'cta.form.lead': 'Vyplňte formulář a my se vám ozveme s návrhem dalšího postupu a orientační nabídkou.',
  'cta.form.bullet1': 'Rychlá reakce',
  'cta.form.bullet2': 'Diskrétně a profesionálně',
  'cta.form.bullet3': 'Individuální přístup',
  'cta.form.nameLabel': 'Jméno',
  'cta.form.phoneLabel': 'Telefon',
  'cta.form.emailLabel': 'E-mail',
  'cta.form.messageLabel': 'Zpráva',
  'cta.form.submitLabel': 'Odeslat',
  'cta.form.sendingLabel': 'Odesílám…',
  'cta.form.successMessage': 'Děkujeme, ozveme se vám co nejdříve.',

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
    'Průběžné konzultace, zastupování při jednání se správcem daně, mezinárodní zdanění i návrhy optimalizace daňové povinnosti.',

  'contact.phone': '+420 233 325 927',
  'contact.email': 'info@redus.cz',
  'contact.address': 'Čimická 53/809, 181 04 Praha 8 – Čimice',

  'footer.blurb':
    'Účetní a daňová kancelář v Praze 8. Podvojné účetnictví, mzdy, daňová přiznání, poradenství a outsourcing účetnictví.',
  'footer.billing':
    'REDUS\nMartin Rada\nIČO: 61841404\nDIČ: CZ7312011113\nŽL vedený u MČ Praha 8\nč.j. ŽO/F/05/3537, ev. č. 310008-65489',
  'footer.copyright': '© REDUS. Všechna práva vyhrazena.',
  'footer.headingContact': 'Kontaktní údaje',
  'footer.headingBilling': 'Fakturační údaje',
  'footer.linkedinHref': 'https://www.linkedin.com/',
  'footer.linkPrivacyLabel': 'Ochrana soukromí',
  'footer.linkPrivacyHref': '/o-nas',
  'footer.linkTermsLabel': 'Obchodní podmínky',
  'footer.linkTermsHref': '/o-nas',

  'about.text':
    'REDUS je účetní a daňová kancelář v Praze 8 – Čimice. Pomáháme firmám i OSVČ s vedením podvojného účetnictví, mzdami, daňovými přiznáními a průběžným poradenstvím. Nabízíme také outsourcing účetnictví včetně reportingu a podpory při komunikaci s úřady.',
};

/**
 * Hodnota pro klíč v DB (`main:hero.title`, `admin.siteName`, `footer.blurb`, …).
 */
export function resolveRedusSeedValue(fullKey: string, pub: Record<string, string> = REDUS_PUBLIC_DEFAULTS_CS): string {
  if (Object.prototype.hasOwnProperty.call(pub, fullKey)) {
    return pub[fullKey] ?? '';
  }
  const p = parseStorageKey(fullKey);
  if (p && Object.prototype.hasOwnProperty.call(pub, p.fieldKey)) {
    return pub[p.fieldKey] ?? '';
  }
  return '';
}

export const REDUS_PUBLIC_DEFAULTS_EN: Record<string, string> = {
  'admin.siteName': 'REDUS',
  'admin.tagline': 'ACCOUNTING & TAX OFFICE · PRAGUE 8',

  'nav.services': 'Services',
  'nav.about': 'About',
  'nav.pricing': 'Pricing',
  'nav.tax': 'Tax advisory',
  'nav.ctaContact': 'Contact us',

  'hero.enabled': 'show',
  'hero.badge': 'Accounting office in Prague 8 (Čimice) · experienced and personal',
  'hero.title': 'Accounting, payroll and taxes—handled',
  'hero.titleAccent': 'Accounting',
  'hero.lead':
    'End-to-end accounting, payroll and tax returns for freelancers and companies. Clear, on time and fully compliant with current legislation.',
  'hero.image':
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  'hero.cardTitle': 'Accounting & advisory services in Prague and nearby',
  'hero.ctaPrimary': 'Book a consultation',
  'hero.ctaSecondary': 'Our services',

  'services.enabled': 'show',
  'services.sectionTitle': 'Accounting and tax services',
  'services.sectionDesc':
    'We provide double-entry bookkeeping and payroll, tax returns and ongoing advisory. We also handle accounting reconstruction and management reporting.',
  'services.1.title': 'Double-entry bookkeeping & year-end close',
  'services.1.desc':
    'Complete accounting including annual close, analytical accounts and cost centres, and outputs for better business management.',
  'services.2.title': 'Tax returns & optimisation',
  'services.2.desc':
    'VAT, personal/corporate income tax, road tax and more. Including ongoing consultations and proposals to optimise your tax position.',
  'services.3.title': 'Payroll & HR administration',
  'services.3.desc':
    'Full payroll processing, communication with authorities and support for HR administration for small and larger teams.',
  'services.4.title': 'Accounting outsourcing',
  'services.4.desc':
    'We can take over your finance office: documents, invoicing, banking payments, representation at authorities and regular reporting—under clear contractual terms.',

  'why.enabled': 'show',
  'why.title': 'Why choose REDUS?',
  'why.text':
    'We combine expertise, confidentiality and a personal approach. We solve accounting and tax matters so you have clarity and can focus on your business.',
  'why.bullet1': 'Personal, tailored approach',
  'why.bullet2': 'Experience with companies and freelancers',
  'why.bullet3': 'On-time delivery and transparent communication',
  'why.quote':
    '“We offer more than accounting—we bring certainty, clarity and solutions that support sustainable growth.”',
  'why.quoteAuthor': 'Martin Rada, head of office',
  'why.image1':
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  'why.image2':
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',

  'pricing.enabled': 'show',
  'tax.enabled': 'show',
  'cta.enabled': 'show',
  'cta.title': 'Want your accounting and taxes under control?',
  'cta.desc':
    'Call or email us. We will arrange a short introductory consultation and prepare an offer based on the scope of your agenda.',
  'cta.btnPhone': '',
  'cta.btnEmail': 'Email us',

  'cta.form.badge': 'No obligation',
  'cta.form.title': 'Tell us briefly what you need',
  'cta.form.lead': 'Fill in the form and we will get back to you with the next steps and an indicative proposal.',
  'cta.form.bullet1': 'Fast response',
  'cta.form.bullet2': 'Confidential and professional',
  'cta.form.bullet3': 'Personal approach',
  'cta.form.nameLabel': 'Name',
  'cta.form.phoneLabel': 'Phone',
  'cta.form.emailLabel': 'Email',
  'cta.form.messageLabel': 'Message',
  'cta.form.submitLabel': 'Submit',
  'cta.form.sendingLabel': 'Sending…',
  'cta.form.successMessage': 'Thank you. We will get back to you as soon as possible.',

  'pricing.title': 'Pricing',
  'pricing.teaser':
    'Transparent pricing based on the scope of cooperation. We will prepare a tailored offer after a short consultation.',
  'pricing.billingMode': 'dual',
  'pricing.billingMonthly': 'Monthly',
  'pricing.billingYearly': 'Yearly – 20% off',
  'pricing.featuresHeading': 'Includes:',
  'pricing.plan1.title': 'Basic',
  'pricing.plan1.priceMonthly': 'from 690 CZK / month',
  'pricing.plan1.priceYearly': 'from 6,600 CZK / year',
  'pricing.plan1.desc':
    'A good fit for freelancers and smaller businesses that want their accounting in order—without hassle.',
  'pricing.plan1.cta': 'Request an offer',
  'pricing.plan1.ctaHref': '',
  'pricing.plan1.popularBadge': '',
  'pricing.plan1.features':
    'Bookkeeping\nMonthly overview\nEmail support\nBasic tax agenda',
  'pricing.plan2.title': 'Business',
  'pricing.plan2.priceMonthly': 'from 1,490 CZK / month',
  'pricing.plan2.priceYearly': 'from 14,300 CZK / year',
  'pricing.plan2.desc':
    'For businesses that need more—faster responses and a broader service scope.',
  'pricing.plan2.cta': 'Request an offer',
  'pricing.plan2.ctaHref': '',
  'pricing.plan2.popularBadge': 'Most popular',
  'pricing.plan2.features':
    'Everything in Basic\nPriority support\nDecision consultations\nDeeper tax planning\nCoordination with your lawyer',
  'pricing.plan3.title': 'Enterprise',
  'pricing.plan3.priceMonthly': 'Custom',
  'pricing.plan3.priceYearly': 'Custom',
  'pricing.plan3.desc':
    'Tailored for larger organisations and complex structures—scope defined to your needs.',
  'pricing.plan3.cta': 'Book a consultation',
  'pricing.plan3.ctaHref': '',
  'pricing.plan3.popularBadge': '',
  'pricing.plan3.features':
    'Dedicated contact\nCustom reports and processes\nStrategic advisory\nMultiple entities / consolidation\nSLA as agreed',
  'tax.title': 'Tax advisory',
  'tax.teaser':
    'Ongoing consultations, representation before tax authorities, international taxation and proposals to optimise your tax liability.',

  'contact.phone': '+420 233 325 927',
  'contact.email': 'info@redus.cz',
  'contact.address': 'Čimická 53/809, 181 04 Prague 8 – Čimice, Czech Republic',

  'footer.blurb':
    'Accounting and tax office in Prague 8. Double-entry bookkeeping, payroll, tax returns, advisory and accounting outsourcing.',
  'footer.billing':
    'REDUS\nMartin Rada\nCompany ID (IČO): 61841404\nVAT ID (DIČ): CZ7312011113\nTrade licence registered with Prague 8\nRef. no.: ŽO/F/05/3537, Reg. no.: 310008-65489',
  'footer.copyright': '© REDUS. All rights reserved.',
  'footer.headingContact': 'Contact details',
  'footer.headingBilling': 'Billing details',
  'footer.linkedinHref': 'https://www.linkedin.com/',
  'footer.linkPrivacyLabel': 'Privacy policy',
  'footer.linkPrivacyHref': '/o-nas',
  'footer.linkTermsLabel': 'Terms & conditions',
  'footer.linkTermsHref': '/o-nas',

  'about.text':
    'REDUS is an accounting and tax office in Prague 8 – Čimice. We help companies and freelancers with double-entry bookkeeping, payroll, tax returns and ongoing advisory. We also provide accounting outsourcing including reporting and support when dealing with authorities.',
};

export function resolveRedusSeedValueByLang(fullKey: string, lang: string): string {
  const l = (lang || '').trim().toLowerCase();
  if (l === 'en') return resolveRedusSeedValue(fullKey, REDUS_PUBLIC_DEFAULTS_EN);
  return resolveRedusSeedValue(fullKey, REDUS_PUBLIC_DEFAULTS_CS);
}

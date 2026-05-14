/**
 * Veřejné API: položky menu ARCH (O nás / Ceník / Kontakt) - prázdný text se doplní z názvu stránky.
 * Skryté položky (nav.menu* = 0) odstraní odpovídající text v nav.*.
 * Zastaralé klíče (scroll menu, CTA v menu) se z odpovědi odstraní úplně.
 */
import { ARCH_FLAT_CS } from './arch-flat-cs.js';
import { ARCH_FLAT_EN } from './arch-flat-en.js';
import { archSitePagesConfig } from './arch-site-pages.js';
import type { SitePagesConfigMap } from './site-pages.js';

const PAGE_LINKED_NAV = ['nav.about', 'nav.pricing', 'nav.contact'] as const;
type PageLinkedNavKey = (typeof PAGE_LINKED_NAV)[number];

const NAV_KEY_TO_PAGE_ID: Record<PageLinkedNavKey, keyof typeof archSitePagesConfig> = {
  'nav.about': 'about',
  'nav.pricing': 'pricingPage',
  'nav.contact': 'contactPage',
};

const PAGE_NAV_TO_MENU: Record<PageLinkedNavKey, string> = {
  'nav.about': 'nav.menuAbout',
  'nav.pricing': 'nav.menuPricing',
  'nav.contact': 'nav.menuContact',
};

/** Pár [text v menu, příznak zobrazení] - jen stránky. */
export const ARCH_NAV_LABEL_AND_MENU: ReadonlyArray<[string, string]> = [
  ['nav.about', 'nav.menuAbout'],
  ['nav.pricing', 'nav.menuPricing'],
  ['nav.contact', 'nav.menuContact'],
];

/** Dřívější menu (scroll + CTA) - z veřejné mapy ARCH odstraníme. */
export const ARCH_NAV_DEPRECATED_PUBLIC_KEYS: readonly string[] = [
  'nav.portfolio',
  'nav.process',
  'nav.services',
  'nav.ctaQuote',
  'nav.menuPortfolio',
  'nav.menuProcess',
  'nav.menuServices',
  'nav.menuCtaQuote',
];

function archNavMenuOn(content: Record<string, string>, menuPubKey: string): boolean {
  return (content[menuPubKey] ?? '1').trim() !== '0';
}

export function applyArchNavPublicFallbacks(
  content: Record<string, string>,
  lang: string,
  pages: SitePagesConfigMap = archSitePagesConfig
): void {
  const l = (lang ?? 'cs').trim().toLowerCase();
  const isEn = l === 'en' || l.startsWith('en-');

  for (const navKey of PAGE_LINKED_NAV) {
    const menuKey = PAGE_NAV_TO_MENU[navKey];
    if (!archNavMenuOn(content, menuKey)) continue;
    if ((content[navKey] ?? '').trim() !== '') continue;
    const pageId = NAV_KEY_TO_PAGE_ID[navKey];
    const pageDef = pages[pageId];
    if (isEn) {
      const fromFlat = ARCH_FLAT_EN[navKey];
      content[navKey] = (fromFlat ?? pageDef?.label ?? '').trim();
    } else {
      content[navKey] = (pageDef?.label ?? ARCH_FLAT_CS[navKey] ?? '').trim();
    }
  }
}

/** Odstraní text skrytých položek menu (`nav.*`), příznaky `nav.menu*` zůstanou. */
export function applyArchNavMenuHiding(content: Record<string, string>): void {
  for (const [labelPub, menuPub] of ARCH_NAV_LABEL_AND_MENU) {
    if (archNavMenuOn(content, menuPub)) continue;
    delete content[labelPub];
  }
}

/** Odstraní zastaralé klíče menu (scroll z Domů, CTA v menu). */
export function stripArchNavDeprecatedKeys(content: Record<string, string>): void {
  for (const k of ARCH_NAV_DEPRECATED_PUBLIC_KEYS) {
    delete content[k];
  }
}

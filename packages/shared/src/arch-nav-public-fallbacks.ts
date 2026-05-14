/**
 * Public API: ARCH nav items (About / Pricing / Contact) — empty labels fall back to page titles.
 * Hidden items (`nav.menu* = 0`) drop the matching `nav.*` text.
 * Deprecated keys (scroll-in-menu, CTA in menu) are removed from the response entirely.
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

/** Pairs [`nav.*` label, `nav.menu*` visibility flag] — page links only. */
export const ARCH_NAV_LABEL_AND_MENU: ReadonlyArray<[string, string]> = [
  ['nav.about', 'nav.menuAbout'],
  ['nav.pricing', 'nav.menuPricing'],
  ['nav.contact', 'nav.menuContact'],
];

/** Older menu keys (scroll + CTA) — stripped from the public ARCH map. */
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

/** Removes text for hidden menu rows (`nav.*`); `nav.menu*` flags stay. */
export function applyArchNavMenuHiding(content: Record<string, string>): void {
  for (const [labelPub, menuPub] of ARCH_NAV_LABEL_AND_MENU) {
    if (archNavMenuOn(content, menuPub)) continue;
    delete content[labelPub];
  }
}

/** Removes deprecated menu keys (Home scroll anchors, CTA in menu). */
export function stripArchNavDeprecatedKeys(content: Record<string, string>): void {
  for (const k of ARCH_NAV_DEPRECATED_PUBLIC_KEYS) {
    delete content[k];
  }
}

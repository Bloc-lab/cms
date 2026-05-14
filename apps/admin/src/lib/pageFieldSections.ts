import type { ContentConfig } from '@nase-cms/shared';

/** Section titles in form order (same grouping rules as PageContentFields). */
export function getFieldSectionTitles(fields: ContentConfig): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const field of Object.values(fields)) {
    const section = field.section?.trim() || (field.advanced ? 'Pokročilé' : 'Obsah');
    if (!seen.has(section)) {
      seen.add(section);
      order.push(section);
    }
  }
  return order;
}

const CENIK_ROOT = 'Ceník';

function isCenikBlockSection(title: string): boolean {
  const t = title.trim();
  return t === CENIK_ROOT || t.startsWith(`${CENIK_ROOT} ·`);
}

const DOMU_PORTFOLIO_ROOT = 'Domů · Portfolio';

function isDomPortfolioBlockSection(title: string): boolean {
  const t = title.trim();
  return t === DOMU_PORTFOLIO_ROOT || t.startsWith(`${DOMU_PORTFOLIO_ROOT} ·`);
}

/** CMS section root label for site footer block (Czech "Patička" or legacy English "Footer"). */
export type SiteFooterBlockRoot = 'Patička' | 'Footer';

export function getSiteFooterBlockRoot(title: string): SiteFooterBlockRoot | null {
  const t = title.trim();
  if (t === 'Patička' || t.startsWith('Patička ·')) return 'Patička';
  if (t === 'Footer' || t.startsWith('Footer ·')) return 'Footer';
  return null;
}

function isInSiteFooterBlock(title: string, root: SiteFooterBlockRoot): boolean {
  const t = title.trim();
  return t === root || t.startsWith(`${root} ·`);
}

/** True for subsection titles like "Patička · Odbornost" (not the root "Patička" row). */
export function isSiteFooterChildSectionTitle(title: string): boolean {
  const t = title.trim();
  return /^Patička\s*·\s*.+/i.test(t) || /^Footer\s*·\s*.+/i.test(t);
}

/** Left nav: footer subsections are separate items but rendered as tabs inside the root block. */
export function isSiteFooterNavChildSection(sectionTitle: string): boolean {
  return isSiteFooterChildSectionTitle(sectionTitle);
}

export type SectionNavChild = { sectionTitle: string; navLabel: string };

/** Content field key for the column heading tied to a footer subsection (ARCH). */
export function getSiteFooterColumnHeadingFieldKey(sectionTitle: string): string | null {
  const t = sectionTitle.trim();
  if (/^(Patička|Footer)\s*·\s*Odbornost\s*$/i.test(t)) return 'footer.columnExpertise';
  if (/^(Patička|Footer)\s*·\s*Navigace\s*$/i.test(t)) return 'footer.columnNavigation';
  if (/^(Patička|Footer)\s*·\s*Kontakt\s*$/i.test(t)) return 'footer.columnConnect';
  return null;
}

/** Tab / nav label: live column heading when set, else suffix after the middle dot. */
export function getSiteFooterSubsectionDisplayLabel(
  sectionTitle: string,
  getTrimmedFieldValue: (fieldKey: string) => string
): string {
  const fk = getSiteFooterColumnHeadingFieldKey(sectionTitle);
  if (fk) {
    const v = getTrimmedFieldValue(fk);
    if (v) return v;
  }
  return (
    sectionTitle.replace(/^\s*Patička\s*·\s*/i, '').replace(/^\s*Footer\s*·\s*/i, '').trim() || sectionTitle
  );
}

export type SectionNavStructureOptions = {
  /** Optional nav labels for footer subsections (key = exact `field.section`, e.g. Patička · Odbornost). */
  siteFooterNavLabels?: Record<string, string>;
};

/** Sync left nav with in-page tabs (portfolio / pricing plans). */
export const CMS_ADMIN_FOCUS_SUBSECTION = 'cms-admin-focus-subsection';

export type CmsAdminFocusSubsectionDetail = {
  pageId: string;
  portfolioSub?: string;
  pricingPlan?: number;
  /** Full CMS section title for the active footer tab (e.g. Patička · Odbornost). */
  footerSubsectionTitle?: string;
};

/** ARCH home: portfolio subsection key (`card:1`, `beforeAfter`, …). */
export function parseDomPortfolioSubKey(sectionTitle: string): string | null {
  const t = sectionTitle.trim();
  const m = t.match(/^Domů\s*·\s*Portfolio\s*·\s*Karta\s*(\d+)\s*$/i);
  if (m) return `card:${m[1]}`;
  const rest = t.replace(/^Domů\s*·\s*Portfolio\s*·\s*/i, '').trim();
  if (rest === 'Před a po') return 'beforeAfter';
  if (rest === 'Detaily') return 'details';
  return null;
}

/** MONO home: "Ceník · Tarif N" -> plan index. */
export function parsePricingPlanIndex(sectionTitle: string): number | null {
  const m = sectionTitle.trim().match(/^Ceník\s*·\s*Tarif\s*(\d+)\s*$/i);
  if (!m) return null;
  const n = parseInt(m[1] ?? '', 10);
  return Number.isFinite(n) ? n : null;
}

/** Single nav entry or a "Ceník" group with plan children. */
export type SectionNavNode =
  | { type: 'single'; sectionTitle: string }
  | {
      type: 'group';
      groupLabel: string;
      /** Scroll target for the group header (pricing intro or first block section). */
      primarySection: string;
      children: SectionNavChild[];
    };

/** Merge "Ceník" + "Ceník · Tarif …" (and portfolio / footer) for the left nav. */
export function getSectionNavStructure(
  fields: ContentConfig,
  options?: SectionNavStructureOptions
): SectionNavNode[] {
  const titles = getFieldSectionTitles(fields);
  const out: SectionNavNode[] = [];
  let i = 0;
  while (i < titles.length) {
    const t = titles[i]!;
    if (isCenikBlockSection(t)) {
      const block: string[] = [];
      while (i < titles.length && isCenikBlockSection(titles[i]!)) {
        block.push(titles[i]!);
        i++;
      }
      const primary = block.find((x) => x.trim() === CENIK_ROOT) ?? block[0]!;
      const children: SectionNavChild[] = block
        .filter((x) => x.trim() !== CENIK_ROOT)
        .map((sectionTitle) => {
          const navLabel =
            sectionTitle.replace(/^\s*Ceník\s*·\s*/i, '').trim() || sectionTitle;
          return { sectionTitle, navLabel };
        });
      out.push({
        type: 'group',
        groupLabel: CENIK_ROOT,
        primarySection: primary,
        children,
      });
      continue;
    }
    if (isDomPortfolioBlockSection(t)) {
      const block: string[] = [];
      while (i < titles.length && isDomPortfolioBlockSection(titles[i]!)) {
        block.push(titles[i]!);
        i++;
      }
      const primary = block.find((x) => x.trim() === DOMU_PORTFOLIO_ROOT) ?? block[0]!;
      const children: SectionNavChild[] = block
        .filter((x) => x.trim() !== DOMU_PORTFOLIO_ROOT)
        .map((sectionTitle) => {
          const navLabel =
            sectionTitle.replace(/^\s*Domů\s*·\s*Portfolio\s*·\s*/i, '').trim() || sectionTitle;
          return { sectionTitle, navLabel };
        });
      out.push({
        type: 'group',
        groupLabel: 'Portfolio',
        primarySection: primary,
        children,
      });
      continue;
    }
    const patRoot = getSiteFooterBlockRoot(t);
    if (patRoot) {
      const block: string[] = [];
      while (i < titles.length && isInSiteFooterBlock(titles[i]!, patRoot)) {
        block.push(titles[i]!);
        i++;
      }
      const primary = block.find((x) => x.trim() === patRoot) ?? block[0]!;
      const children: SectionNavChild[] = block
        .filter((x) => x.trim() !== patRoot)
        .map((sectionTitle) => {
          const stripped =
            sectionTitle.replace(new RegExp(`^\\s*${patRoot}\\s*·\\s*`, 'i'), '').trim() || sectionTitle;
          const custom = options?.siteFooterNavLabels?.[sectionTitle]?.trim();
          const navLabel = custom || stripped;
          return { sectionTitle, navLabel };
        });
      out.push({
        type: 'group',
        groupLabel: patRoot,
        primarySection: primary,
        children,
      });
      continue;
    }
    out.push({ type: 'single', sectionTitle: t });
    i++;
  }
  return out;
}

/** Stable DOM id for section scroll (ASCII slug). */
export function sectionAnchorId(pageId: string, sectionTitle: string): string {
  const slug = sectionTitle
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const base = slug.length > 0 ? slug : 'section';
  return `cms-section-${pageId}-${base}`;
}

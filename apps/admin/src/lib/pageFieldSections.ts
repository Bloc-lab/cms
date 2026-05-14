import type { ContentConfig } from '@nase-cms/shared';

/** Pořadí sekcí ve formuláři (stejná logika jako v PageContentFields). */
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

/** Spodní část webu v CMS (český název i starší anglický). */
export function getPatičkaFooterBlockRoot(title: string): 'Patička' | 'Footer' | null {
  const t = title.trim();
  if (t === 'Patička' || t.startsWith('Patička ·')) return 'Patička';
  if (t === 'Footer' || t.startsWith('Footer ·')) return 'Footer';
  return null;
}

function isInPatičkaFooterBlock(title: string, root: 'Patička' | 'Footer'): boolean {
  const t = title.trim();
  return t === root || t.startsWith(`${root} ·`);
}

/** Podsekce typu „Patička · Odbornost“ (bez samotného kořene Patička). */
export function isPatičkaFooterChildSectionTitle(title: string): boolean {
  const t = title.trim();
  return /^Patička\s*·\s*.+/i.test(t) || /^Footer\s*·\s*.+/i.test(t);
}

/**
 * Levé menu: podsekce patičky mají vlastní položku, ale ve stránce jsou pod záložkami uvnitř kořene.
 */
export function isPatičkaFooterNavChildSection(sectionTitle: string): boolean {
  return isPatičkaFooterChildSectionTitle(sectionTitle);
}

export type SectionNavChild = { sectionTitle: string; navLabel: string };

/** CMS klíč nadpisu sloupce pro podsekci patičky (ARCH). */
export function getPatičkaFooterColumnHeadingFieldKey(sectionTitle: string): string | null {
  const t = sectionTitle.trim();
  if (/^(Patička|Footer)\s*·\s*Odbornost\s*$/i.test(t)) return 'footer.columnExpertise';
  if (/^(Patička|Footer)\s*·\s*Navigace\s*$/i.test(t)) return 'footer.columnNavigation';
  if (/^(Patička|Footer)\s*·\s*Kontakt\s*$/i.test(t)) return 'footer.columnConnect';
  return null;
}

/** Text záložky / podpoložky v menu: živý nadpis sloupce, jinak suffix za „·“. */
export function getPatičkaFooterSubsectionDisplayLabel(
  sectionTitle: string,
  getTrimmedFieldValue: (fieldKey: string) => string
): string {
  const fk = getPatičkaFooterColumnHeadingFieldKey(sectionTitle);
  if (fk) {
    const v = getTrimmedFieldValue(fk);
    if (v) return v;
  }
  return (
    sectionTitle.replace(/^\s*Patička\s*·\s*/i, '').replace(/^\s*Footer\s*·\s*/i, '').trim() || sectionTitle
  );
}

export type SectionNavStructureOptions = {
  /** Nápisy podsekcí patičky v levém menu (klíč = přesný `field.section`, např. Patička · Odbornost). */
  patičkaFooterNavLabels?: Record<string, string>;
};

/** Synchronizace levého menu s záložkami uvnitř sekce (Portfolio / tarify ceníku). */
export const CMS_ADMIN_FOCUS_SUBSECTION = 'cms-admin-focus-subsection';

export type CmsAdminFocusSubsectionDetail = {
  pageId: string;
  portfolioSub?: string;
  pricingPlan?: number;
  /** Plný název CMS sekce pod záložkou v bloku Patička / Footer (např. Patička · Odbornost). */
  footerSubsectionTitle?: string;
};

/** Podsekce portfolia na ARCH domovské stránce (`card:1`, `beforeAfter`, …). */
export function parseDomPortfolioSubKey(sectionTitle: string): string | null {
  const t = sectionTitle.trim();
  const m = t.match(/^Domů\s*·\s*Portfolio\s*·\s*Karta\s*(\d+)\s*$/i);
  if (m) return `card:${m[1]}`;
  const rest = t.replace(/^Domů\s*·\s*Portfolio\s*·\s*/i, '').trim();
  if (rest === 'Před a po') return 'beforeAfter';
  if (rest === 'Detaily') return 'details';
  return null;
}

/** MONO domovská stránka: „Ceník · Tarif N“ → číslo tarifu. */
export function parsePricingPlanIndex(sectionTitle: string): number | null {
  const m = sectionTitle.trim().match(/^Ceník\s*·\s*Tarif\s*(\d+)\s*$/i);
  if (!m) return null;
  const n = parseInt(m[1] ?? '', 10);
  return Number.isFinite(n) ? n : null;
}

/** Jedna položka nebo skupina „Ceník“ s tarify pod sebou (pro levé menu). */
export type SectionNavNode =
  | { type: 'single'; sectionTitle: string }
  | {
      type: 'group';
      groupLabel: string;
      /** Kotva pro klik na hlavní „Ceník“ (úvodní sekce, nebo první v bloku). */
      primarySection: string;
      children: SectionNavChild[];
    };

/** Sloučí „Ceník“ + „Ceník · Tarif …“ do jedné skupiny v navigaci. */
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
    const patRoot = getPatičkaFooterBlockRoot(t);
    if (patRoot) {
      const block: string[] = [];
      while (i < titles.length && isInPatičkaFooterBlock(titles[i]!, patRoot)) {
        block.push(titles[i]!);
        i++;
      }
      const primary = block.find((x) => x.trim() === patRoot) ?? block[0]!;
      const children: SectionNavChild[] = block
        .filter((x) => x.trim() !== patRoot)
        .map((sectionTitle) => {
          const stripped =
            sectionTitle.replace(new RegExp(`^\\s*${patRoot}\\s*·\\s*`, 'i'), '').trim() || sectionTitle;
          const custom = options?.patičkaFooterNavLabels?.[sectionTitle]?.trim();
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

/** Stabilní id pro scroll – bez diakritiky a speciálních znaků. */
export function sectionAnchorId(pageId: string, sectionTitle: string): string {
  const slug = sectionTitle
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const base = slug.length > 0 ? slug : 'sekce';
  return `cms-section-${pageId}-${base}`;
}

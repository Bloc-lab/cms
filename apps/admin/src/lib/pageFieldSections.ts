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

export type SectionNavChild = { sectionTitle: string; navLabel: string };

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
export function getSectionNavStructure(fields: ContentConfig): SectionNavNode[] {
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

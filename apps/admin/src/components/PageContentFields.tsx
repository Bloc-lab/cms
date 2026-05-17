import { useEffect, useMemo, useState } from 'react';
import { storageKey as makeStorageKey, type ContentConfig, type ContentField } from '@nase-cms/shared';
import { PRIMARY_LANG } from '../lib/languages';
import {
  CMS_ADMIN_FOCUS_SUBSECTION,
  getSiteFooterBlockRoot,
  getSiteFooterSubsectionDisplayLabel,
  isSiteFooterChildSectionTitle,
  parseDomPortfolioSubKey,
  parsePricingPlanIndex,
  sectionAnchorId,
  type CmsAdminFocusSubsectionDetail,
} from '../lib/pageFieldSections';

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

/** ARCH pricing page: `standard.card1.title` -> card index 1 */
function parseArchStandardCardIndex(fieldKey: string): number | null {
  const m = fieldKey.match(/^standard\.card(\d+)\./);
  if (!m) return null;
  const n = parseInt(m[1] ?? '', 10);
  return Number.isFinite(n) ? n : null;
}

const DOMU_PORTFOLIO_INTRO = 'Domů · Portfolio';

function domPortfolioSubSortOrder(sectionTitle: string): number {
  const k = parseDomPortfolioSubKey(sectionTitle);
  if (!k) return 999;
  if (k.startsWith('card:')) return parseInt(k.slice(5), 10);
  if (k === 'beforeAfter') return 10;
  if (k === 'details') return 11;
  return 999;
}

function domPortfolioTabLabel(sectionTitle: string): string {
  const k = parseDomPortfolioSubKey(sectionTitle);
  if (k?.startsWith('card:')) return `Karta ${k.slice(5)}`;
  if (k === 'beforeAfter') return 'Před a po';
  if (k === 'details') return 'Detaily';
  return sectionTitle;
}

function isContactFormVolbyOrRozpocetSection(title: string): boolean {
  const t = title.trim();
  return (
    /^Kontakt\s*·\s*Formulář\s*·\s*Volby\s*$/i.test(t) ||
    /^Kontakt\s*·\s*Formulář\s*·\s*Rozpočet\s*$/i.test(t)
  );
}

function fieldKeyMatchesAny(fieldKey: string, keys: string[]): boolean {
  return keys.some((k) => k === fieldKey);
}

function fieldLabel(field: ContentField | undefined, key: string): string {
  const base = field?.label ?? key;
  return field?.required ? `${base} *` : base;
}

interface Props {
  pageId: string;
  fields: ContentConfig;
  lang: string;
  enabledLangs: string[];
  showFieldTranslationBadges?: boolean;
  entries: Record<string, string>;
  fieldErrors?: Record<string, string>;
  entryKey: (storageKey: string, l: string) => string;
  setValue: (storageKey: string, l: string, value: string) => void;
  setMediaPickerKey: (fullStorageKey: string | null) => void;
  siteSettings?: {
    nav?: {
      items?: Array<
        | { kind: 'section'; section: 'services' | 'pricing' | 'tax' | 'contact'; label?: string }
        | { kind: 'route'; href: string; label?: string }
      >;
      cta?: { href?: string; label?: string };
    };
    cta?: {
      variant: 'buttons' | 'form';
      form?: { submitLabel?: string; successMessage?: string; layout?: 'center' | 'split' };
      buttons?: { phoneLabel?: string; emailLabel?: string };
    };
    lead?: { formspreeUrl?: string };
  } | null;
  setSiteSettings?: (next: any) => void;
  /** Optional template id for future editor branches. */
  siteTemplateId?: string | null;
}

export default function PageContentFields({
  pageId,
  fields,
  lang,
  enabledLangs,
  showFieldTranslationBadges,
  entries,
  fieldErrors,
  entryKey,
  setValue,
  setMediaPickerKey,
  siteSettings,
  setSiteSettings,
  siteTemplateId: _siteTemplateId,
}: Props) {
  const getValue = (fieldKey: string, l: string) =>
    entries[entryKey(makeStorageKey(pageId, fieldKey), l)] ?? '';

  const pricingBillingMode = (getValue('pricing.billingMode', PRIMARY_LANG) ?? '').trim();
  const isSingleBillingMode = pricingBillingMode === 'single';

  const SECTION_ENABLED_KEY: Record<string, string> = useMemo(
    () => ({
      Hero: 'hero.enabled',
      Služby: 'services.enabled',
      'Proč my': 'why.enabled',
      Ceník: 'pricing.enabled',
      'Extra sekce': 'tax.enabled',
      CTA: 'cta.enabled',
    }),
    []
  );

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const updateSiteSettings = (fn: (prev: any) => any) => {
    if (!siteSettings || !setSiteSettings) return;
    setSiteSettings(fn(siteSettings));
  };

  const isMainPage = pageId === 'main';

  const bySection = new Map<string, Array<[string, ContentField]>>();
  for (const [fieldKey, field] of Object.entries(fields)) {
    const section = field.section?.trim() || (field.advanced ? 'Pokročilé' : 'Obsah');
    const arr = bySection.get(section) ?? [];
    arr.push([fieldKey, field]);
    bySection.set(section, arr);
  }

  const sectionsRaw = [...bySection.entries()];

  const pricingPlanSections = sectionsRaw
    .filter(([title]) => parsePricingPlanIndex(title) !== null)
    .sort((a, b) => (parsePricingPlanIndex(a[0]) ?? 0) - (parsePricingPlanIndex(b[0]) ?? 0));

  const domPortfolioSubsections = sectionsRaw
    .filter(([title]) => parseDomPortfolioSubKey(title) !== null)
    .sort((a, b) => domPortfolioSubSortOrder(a[0]) - domPortfolioSubSortOrder(b[0]));

  const contactFormSubSections = sectionsRaw
    .filter(([title]) => isContactFormVolbyOrRozpocetSection(title))
    .sort((a, b) => (a[0].includes('Volby') ? 0 : 1) - (b[0].includes('Volby') ? 0 : 1));

  const ctaFormSection = sectionsRaw.find(([title]) => title.trim() === 'CTA · Formulář') ?? null;

  const siteFooterSubsections = sectionsRaw.filter(([title]) => isSiteFooterChildSectionTitle(title));

  let siteFooterRootTitle: 'Patička' | 'Footer' | null = null;
  for (const [title] of sectionsRaw) {
    const r = getSiteFooterBlockRoot(title);
    if (r && title.trim() === r) {
      siteFooterRootTitle = r;
      break;
    }
  }
  if (!siteFooterRootTitle && siteFooterSubsections.length > 0) {
    siteFooterRootTitle = getSiteFooterBlockRoot(siteFooterSubsections[0]![0]) ?? null;
  }

  const sections = sectionsRaw.filter(
    ([title]) =>
      parsePricingPlanIndex(title) === null &&
      parseDomPortfolioSubKey(title) === null &&
      !isContactFormVolbyOrRozpocetSection(title) &&
      title.trim() !== 'CTA · Formulář' &&
      !isSiteFooterChildSectionTitle(title)
  );

  const [activePricingPlan, setActivePricingPlan] = useState<number>(1);
  useEffect(() => {
    if (pricingPlanSections.length === 0) return;
    if (pricingPlanSections.some(([t]) => parsePricingPlanIndex(t) === activePricingPlan)) return;
    const first = parsePricingPlanIndex(pricingPlanSections[0]?.[0] ?? '') ?? 1;
    setActivePricingPlan(first);
  }, [pricingPlanSections, activePricingPlan]);

  const archStandardCardIndices = useMemo(() => {
    if (pageId !== 'pricingPage') return [] as number[];
    const ids = new Set<number>();
    for (const [k] of Object.entries(fields)) {
      const n = parseArchStandardCardIndex(k);
      if (n !== null) ids.add(n);
    }
    return [...ids].sort((a, b) => a - b);
  }, [pageId, fields]);

  const [activeArchStandardCard, setActiveArchStandardCard] = useState<number>(1);
  useEffect(() => {
    if (archStandardCardIndices.length === 0) return;
    if (archStandardCardIndices.includes(activeArchStandardCard)) return;
    setActiveArchStandardCard(archStandardCardIndices[0] ?? 1);
  }, [archStandardCardIndices, activeArchStandardCard]);

  const [activeDomPortfolioSub, setActiveDomPortfolioSub] = useState<string>('card:1');
  useEffect(() => {
    if (domPortfolioSubsections.length === 0) return;
    const keys = domPortfolioSubsections.map(([t]) => parseDomPortfolioSubKey(t)!).filter(Boolean);
    if (keys.includes(activeDomPortfolioSub)) return;
    setActiveDomPortfolioSub(keys[0] ?? 'card:1');
  }, [domPortfolioSubsections, activeDomPortfolioSub]);

  const [activeSiteFooterSubTitle, setActiveSiteFooterSubTitle] = useState('');
  useEffect(() => {
    if (siteFooterSubsections.length === 0) return;
    if (siteFooterSubsections.some(([t]) => t === activeSiteFooterSubTitle)) return;
    setActiveSiteFooterSubTitle(siteFooterSubsections[0]![0]);
  }, [siteFooterSubsections, activeSiteFooterSubTitle]);

  useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<CmsAdminFocusSubsectionDetail>;
      const d = e.detail;
      if (!d || d.pageId !== pageId) return;
      if (typeof d.portfolioSub === 'string' && d.portfolioSub.length > 0) {
        setActiveDomPortfolioSub(d.portfolioSub);
      }
      if (typeof d.pricingPlan === 'number' && Number.isFinite(d.pricingPlan)) {
        setActivePricingPlan(d.pricingPlan);
      }
      if (typeof d.footerSubsectionTitle === 'string' && d.footerSubsectionTitle.trim().length > 0) {
        if (isSiteFooterChildSectionTitle(d.footerSubsectionTitle)) {
          setActiveSiteFooterSubTitle(d.footerSubsectionTitle);
        }
      }
    };
    window.addEventListener(CMS_ADMIN_FOCUS_SUBSECTION, handler as EventListener);
    return () => window.removeEventListener(CMS_ADMIN_FOCUS_SUBSECTION, handler as EventListener);
  }, [pageId]);

  const [activeContactFormTab, setActiveContactFormTab] = useState<0 | 1 | 2>(0);

  const renderField = (fieldKey: string, field: ContentField) => {
    const fieldType = field?.type ?? 'text';
    const sk = makeStorageKey(pageId, fieldKey);
    const value = getValue(fieldKey, lang);
    const label = fieldLabel(field, fieldKey);
    const help = field.helpText?.trim();
    const error = fieldErrors?.[sk]?.trim();

    const primaryValue = getValue(fieldKey, PRIMARY_LANG);
    const currentValue = getValue(fieldKey, lang);
    const missingSomeTranslation = enabledLangs.some((l) => {
      if (l === PRIMARY_LANG) return false;
      return (getValue(fieldKey, l) ?? '').trim().length === 0;
    });
    const canCopyFromPrimaryToCurrent =
      lang !== PRIMARY_LANG && (currentValue ?? '').trim().length === 0 && (primaryValue ?? '').trim().length > 0;

    const labelSuffix =
      showFieldTranslationBadges !== false && fieldType !== 'image' && missingSomeTranslation ? (
        <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 border border-amber-200">
          Chybí jiná jazyková verze
        </span>
      ) : null;

    if (fieldType === 'choice') {
      const choices = field.choices?.length ? field.choices : [];
      return (
        <div key={fieldKey}>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            {label}
            {labelSuffix}
          </label>
          {help ? <p className="text-xs text-gray-500 mb-2">{help}</p> : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {choices.map((opt) => {
              const selected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue(sk, lang, opt.value)}
                  className={`rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition ${
                    selected ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  } ${error ? 'border-red-300' : ''}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {error ? <p className="text-xs text-red-700 mt-1">{error}</p> : null}
          {canCopyFromPrimaryToCurrent ? (
            <button
              type="button"
              onClick={() => setValue(sk, lang, primaryValue)}
              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Zkopírovat z {PRIMARY_LANG.toUpperCase()}
            </button>
          ) : null}
        </div>
      );
    }

    if (fieldType === 'textarea') {
      return (
        <div key={fieldKey}>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            {label}
            {labelSuffix}
          </label>
          {help ? <p className="text-xs text-gray-500 mb-2">{help}</p> : null}
          <textarea
            value={value}
            onChange={(e) => setValue(sk, lang, e.target.value)}
            rows={4}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            className={`${inputClass} ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
          />
          {error ? <p className="text-xs text-red-700 mt-1">{error}</p> : null}
          {field.recommendedMaxLength ? (
            <p className="text-xs text-gray-500 mt-1">Doporučeno max. {field.recommendedMaxLength} znaků</p>
          ) : null}
          {canCopyFromPrimaryToCurrent ? (
            <button
              type="button"
              onClick={() => setValue(sk, lang, primaryValue)}
              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Zkopírovat z {PRIMARY_LANG.toUpperCase()}
            </button>
          ) : null}
        </div>
      );
    }

    if (fieldType === 'image') {
      return (
        <div key={fieldKey}>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            {label}
            {labelSuffix}
          </label>
          {help ? <p className="text-xs text-gray-500 mb-2">{help}</p> : null}
          <div className="flex flex-wrap items-start gap-4">
            <div className="shrink-0">
              {value ? (
                <img src={value} alt="" className="h-24 w-36 object-cover rounded-md border border-gray-200" />
              ) : (
                <div className="h-24 w-36 rounded-md border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                  Bez obrázku
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMediaPickerKey(sk)}
                  className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  Vybrat z knihovny
                </button>
                {value && (
                  <button
                    type="button"
                    onClick={() => setValue(sk, lang, '')}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Odstranit
                  </button>
                )}
                {canCopyFromPrimaryToCurrent ? (
                  <button
                    type="button"
                    onClick={() => setValue(sk, lang, primaryValue)}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    Zkopírovat z {PRIMARY_LANG.toUpperCase()}
                  </button>
                ) : null}
              </div>
              {value && (
                <p className="text-xs text-gray-500 truncate max-w-md" title={value}>
                  {value}
                </p>
              )}
              {error ? <p className="text-xs text-red-700">{error}</p> : null}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={fieldKey}>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
          {label}
          {labelSuffix}
        </label>
        {help ? <p className="text-xs text-gray-500 mb-2">{help}</p> : null}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(sk, lang, e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          className={`${inputClass} max-w-xl ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
        />
        {error ? <p className="text-xs text-red-700 mt-1">{error}</p> : null}
        {field.recommendedMaxLength ? (
          <p className="text-xs text-gray-500 mt-1">Doporučeno max. {field.recommendedMaxLength} znaků</p>
        ) : null}
        {canCopyFromPrimaryToCurrent ? (
          <button
            type="button"
            onClick={() => setValue(sk, lang, primaryValue)}
            className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Zkopírovat z {PRIMARY_LANG.toUpperCase()}
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <>
      {sections.map(([sectionTitle, sectionFields]) => {
        const sectionEnabledKey = SECTION_ENABLED_KEY[sectionTitle];
        const sectionEnabledValue = sectionEnabledKey
          ? (getValue(sectionEnabledKey, PRIMARY_LANG) ?? '').trim()
          : '';
        const isHidden = sectionEnabledKey && sectionEnabledValue.trim() === 'hide';

        const missingTranslations = sectionFields.reduce((acc, [fieldKey]) => {
          for (const l of enabledLangs) {
            if (l === PRIMARY_LANG) continue;
            if ((getValue(fieldKey, l) ?? '').trim().length === 0) acc += 1;
          }
          return acc;
        }, 0);

        const isPricingPlanSection = /^Ceník\s*·\s*Tarif\s*\d+/i.test(sectionTitle.trim());
        const isCollapsed =
          collapsed[sectionTitle] ?? (isHidden ? true : isPricingPlanSection ? true : false);

        const enabledToggle =
          sectionEnabledKey && !isPricingPlanSection ? (
            <div className="inline-flex items-center rounded-md border border-gray-200 bg-white p-0.5 shadow-sm">
              {([
                { value: 'show', label: 'Zobrazit' },
                { value: 'hide', label: 'Skrýt' },
              ] as const).map((opt) => {
                const selected = (sectionEnabledValue || 'show') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      const sk = makeStorageKey(pageId, sectionEnabledKey);
                      for (const l of enabledLangs) {
                        setValue(sk, l, opt.value);
                      }
                      // If we just showed the section, expand it by default.
                      if (opt.value === 'show') {
                        setCollapsed((p) => ({ ...p, [sectionTitle]: false }));
                      } else {
                        setCollapsed((p) => ({ ...p, [sectionTitle]: true }));
                      }
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded ${
                      selected ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    aria-pressed={selected}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ) : null;

        const isCtaSection = sectionTitle.trim() === 'CTA' && pageId === 'main';
        const ctaVariant = siteSettings?.cta?.variant ?? 'buttons';
        const ctaLayout: 'center' | 'split' =
          siteSettings?.cta?.variant === 'form' && siteSettings.cta.form?.layout === 'split'
            ? 'split'
            : 'center';

        const isNavSection = isMainPage && sectionTitle.trim().toUpperCase() === 'NAVIGACE';
        if (isNavSection) {
          return null;
        }

        const ctaLayoutToggle =
          isCtaSection && ctaVariant === 'form' ? (
            <div className="inline-flex items-center rounded-md border border-gray-200 bg-white p-0.5 shadow-sm">
              {(['center', 'split'] as const).map((opt) => {
                const selected = ctaLayout === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      updateSiteSettings((prev) => ({
                        ...prev,
                        cta: {
                          ...(prev.cta ?? {}),
                          variant: 'form',
                          form: { ...(prev.cta?.form ?? {}), layout: opt },
                        },
                      }))
                    }
                    className={`px-2.5 py-1 text-xs font-semibold rounded ${
                      selected ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    aria-pressed={selected}
                    title="Layout formuláře"
                  >
                    {opt === 'center' ? 'Center' : 'Split'}
                  </button>
                );
              })}
            </div>
          ) : null;

        const headerRight = (
          <div className="flex items-center gap-2">
            {enabledToggle}
            {missingTranslations > 0 ? (
              <span className="text-[11px] font-semibold uppercase tracking-wide rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5">
                Chybí jiná jazyková verze: {missingTranslations}
              </span>
            ) : (
              <span className="text-[11px] font-semibold uppercase tracking-wide rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5">
                Přeloženo
              </span>
            )}

            {(isPricingPlanSection || isHidden) ? (
              <button
                type="button"
                onClick={() => setCollapsed((p) => ({ ...p, [sectionTitle]: !isCollapsed }))}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-md px-2 py-1 border border-gray-200 bg-white"
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? 'Rozbalit' : 'Sbalit'}
              </button>
            ) : null}
          </div>
        );

        return (
          <section
            key={sectionTitle}
            id={sectionAnchorId(pageId, sectionTitle)}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden scroll-mt-28"
          >
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600 truncate">
                  {sectionTitle}
                </h2>
                {isCtaSection ? ctaLayoutToggle : null}
              </div>
              {headerRight}
            </div>
            <div className={`p-5 ${isPricingPlanSection && !isCollapsed ? 'space-y-4' : 'space-y-5'}`}>
              {isHidden && sectionEnabledKey ? (
                <p className="text-sm text-gray-500">
                  Sekce je skrytá. Přepni na „Zobrazit“ pro editaci obsahu.
                </p>
              ) : null}

              {!isHidden && isCtaSection && siteSettings && setSiteSettings ? (
                <div className="rounded-md border border-gray-200 bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">CTA varianta</p>
                      <p className="text-sm text-gray-700 mt-0.5">
                        Vyber, jestli se má v CTA zobrazit formulář nebo tlačítka.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(['buttons', 'form'] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() =>
                            updateSiteSettings((prev) => ({
                              ...prev,
                              cta: { ...(prev.cta ?? {}), variant: v },
                            }))
                          }
                          className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                            (siteSettings.cta?.variant ?? 'buttons') === v
                              ? 'border-blue-600 bg-blue-50 text-blue-900'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {v === 'buttons' ? 'Tlačítka' : 'Formulář'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(siteSettings.cta?.variant ?? 'buttons') === 'form' ? (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                          Text tlačítka (submitLabel)
                        </label>
                        <input
                          type="text"
                          value={siteSettings.cta?.form?.submitLabel ?? ''}
                          onChange={(e) =>
                            updateSiteSettings((prev) => ({
                              ...prev,
                              cta: {
                                ...(prev.cta ?? {}),
                                variant: 'form',
                                form: { ...(prev.cta?.form ?? {}), submitLabel: e.target.value },
                              },
                            }))
                          }
                          className={`${inputClass} max-w-xl`}
                          placeholder="Odeslat"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                          Zpráva po odeslání (successMessage)
                        </label>
                        <input
                          type="text"
                          value={siteSettings.cta?.form?.successMessage ?? ''}
                          onChange={(e) =>
                            updateSiteSettings((prev) => ({
                              ...prev,
                              cta: {
                                ...(prev.cta ?? {}),
                                variant: 'form',
                                form: { ...(prev.cta?.form ?? {}), successMessage: e.target.value },
                              },
                            }))
                          }
                          className={`${inputClass} max-w-xl`}
                          placeholder="Děkujeme, ozveme se co nejdříve."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                          Odkaz pro odeslání formuláře (služba Formspree)
                        </label>
                        <input
                          type="url"
                          value={siteSettings.lead?.formspreeUrl ?? ''}
                          onChange={(e) =>
                            updateSiteSettings((prev) => ({
                              ...prev,
                              lead: { ...(prev.lead ?? {}), formspreeUrl: e.target.value },
                            }))
                          }
                          className={`${inputClass} max-w-xl`}
                          placeholder="https://formspree.io/f/xxxxxxx"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-gray-600">
                      Varianta „Tlačítka“ používá texty níže (telefon/e‑mail).
                    </p>
                  )}
                </div>
              ) : null}

              {(() => {
                if (isHidden) return null;
                // Remove the enabled field from the body (it's in the header).
                const visibleFields = sectionEnabledKey
                  ? sectionFields.filter(([k]) => k !== sectionEnabledKey)
                  : sectionFields;

                let finalFields =
                  sectionTitle === 'CTA' && ctaVariant === 'form'
                    ? visibleFields.filter(([k]) => !['cta.btnPhone', 'cta.btnEmail'].includes(k))
                    : visibleFields;

                if (isNavSection) {
                  finalFields = finalFields.filter(
                    ([k]) =>
                      ![
                        'nav.services',
                        'nav.about',
                        'nav.pricing',
                        'nav.tax',
                        'nav.ctaContact',
                      ].includes(k)
                  );
                }

                // Pricing: in "single" billing mode hide toggle labels to avoid confusion.
                if (sectionTitle.trim() === 'Ceník' && isSingleBillingMode) {
                  finalFields = finalFields.filter(
                    ([k]) => !fieldKeyMatchesAny(k, ['pricing.billingMonthly', 'pricing.billingYearly'])
                  );
                }

                // ARCH home - Portfolio: cards, before/after, details in sub-tabs.
                if (
                  !isHidden &&
                  pageId === 'main' &&
                  sectionTitle.trim() === DOMU_PORTFOLIO_INTRO &&
                  domPortfolioSubsections.length > 0
                ) {
                  const selectedSub = domPortfolioSubsections.find(
                    ([t]) => parseDomPortfolioSubKey(t) === activeDomPortfolioSub
                  );
                  return (
                    <>
                      {finalFields.length > 0 ? (
                        <div className="space-y-5">
                          {finalFields.map(([fieldKey, field]) => renderField(fieldKey, field))}
                        </div>
                      ) : null}
                      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50/40 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Portfolio</p>
                            <p className="text-sm text-gray-700 mt-0.5">
                              Karty, před/po a detaily - přepínej záložkami (stejný princip jako tarify u ceníku).
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {domPortfolioSubsections.map(([subTitle]) => {
                              const subKey = parseDomPortfolioSubKey(subTitle)!;
                              const isActive = subKey === activeDomPortfolioSub;
                              return (
                                <button
                                  key={subTitle}
                                  type="button"
                                  onClick={() => setActiveDomPortfolioSub(subKey)}
                                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                                    isActive
                                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {domPortfolioTabLabel(subTitle)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                          {(selectedSub?.[1] ?? []).map(([fieldKey, field]) => {
                            const fieldType = field?.type ?? 'text';
                            const fullSpan =
                              fieldType === 'textarea' ||
                              fieldKey.endsWith('.desc') ||
                              fieldType === 'image' ||
                              fieldKey.endsWith('imageAlt');
                            return (
                              <div key={fieldKey} className={fullSpan ? 'md:col-span-2' : ''}>
                                {renderField(fieldKey, field)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                }

                // ARCH contact - form: options and budget in sub-tabs.
                if (
                  !isHidden &&
                  pageId === 'contactPage' &&
                  sectionTitle.trim() === 'Kontakt · Formulář' &&
                  contactFormSubSections.length > 0
                ) {
                  const volbyTuple = contactFormSubSections.find(([t]) => t.trim() === 'Kontakt · Formulář · Volby');
                  const rozpočetTuple = contactFormSubSections.find(
                    ([t]) => t.trim() === 'Kontakt · Formulář · Rozpočet'
                  );
                  const tabFields: Array<[string, ContentField]> =
                    activeContactFormTab === 0
                      ? finalFields
                      : activeContactFormTab === 1
                        ? (volbyTuple?.[1] ?? [])
                        : (rozpočetTuple?.[1] ?? []);

                  return (
                    <>
                      <div className="rounded-lg border border-gray-200 bg-gray-50/40 p-4 mb-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Formulář</p>
                            <p className="text-sm text-gray-700 mt-0.5">
                              Obecné popisky, volby typu projektu a varianty rozpočtu.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(['Obecné', 'Typ projektu', 'Rozpočet'] as const).map((label, idx) => {
                              const i = idx as 0 | 1 | 2;
                              const isActive = activeContactFormTab === i;
                              return (
                                <button
                                  key={label}
                                  type="button"
                                  onClick={() => setActiveContactFormTab(i)}
                                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                                    isActive
                                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {tabFields.map(([fieldKey, field]) => {
                          const fieldType = field?.type ?? 'text';
                          const fullSpan =
                            fieldType === 'textarea' ||
                            fieldKey.endsWith('.desc') ||
                            fieldType === 'image' ||
                            fieldKey.endsWith('Placeholder');
                          return (
                            <div key={fieldKey} className={fullSpan ? 'md:col-span-2' : ''}>
                              {renderField(fieldKey, field)}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                }

                // Site footer (Czech "Patička" or English "Footer"): columns and links in sub-tabs (same block pattern as portfolio).
                if (
                  !isHidden &&
                  siteFooterRootTitle &&
                  sectionTitle.trim() === siteFooterRootTitle &&
                  siteFooterSubsections.length > 0
                ) {
                  const selectedFooterSub =
                    siteFooterSubsections.find(([t]) => t === activeSiteFooterSubTitle) ??
                    siteFooterSubsections[0]!;
                  return (
                    <>
                      {finalFields.length > 0 ? (
                        <div className="space-y-5">
                          {finalFields.map(([fieldKey, field]) => renderField(fieldKey, field))}
                        </div>
                      ) : null}
                      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50/40 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {siteFooterRootTitle === 'Footer' ? 'Footer' : 'Patička'}
                            </p>
                            <p className="text-sm text-gray-700 mt-0.5">
                              Columns and links - switch with tabs (same pattern as portfolio or pricing tiers).
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {siteFooterSubsections.map(([subTitle]) => {
                              const isActive = subTitle === activeSiteFooterSubTitle;
                              return (
                                <button
                                  key={subTitle}
                                  type="button"
                                  onClick={() => setActiveSiteFooterSubTitle(subTitle)}
                                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                                    isActive
                                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {getSiteFooterSubsectionDisplayLabel(subTitle, (fk) =>
                                    (getValue(fk, lang) ?? '').trim()
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                          {(selectedFooterSub[1] ?? []).map(([fieldKey, field]) => {
                            const fieldType = field?.type ?? 'text';
                            const fullSpan =
                              fieldType === 'textarea' ||
                              fieldType === 'image' ||
                              fieldKey.endsWith('imageAlt') ||
                              fieldKey.endsWith('Href');
                            return (
                              <div key={fieldKey} className={fullSpan ? 'md:col-span-2' : ''}>
                                {renderField(fieldKey, field)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                }

                // ARCH /pricing - Standard section: cards in sub-tabs (same UX pattern as MONO pricing tiers).
                if (
                  !isHidden &&
                  pageId === 'pricingPage' &&
                  sectionTitle.trim() === 'Standard' &&
                  archStandardCardIndices.length > 0
                ) {
                  const introFields = finalFields.filter(([k]) => parseArchStandardCardIndex(k) === null);
                  const cardFieldsFor = (n: number) =>
                    finalFields
                      .filter(([k]) => parseArchStandardCardIndex(k) === n)
                      .sort(([a], [b]) => a.localeCompare(b));

                  return (
                    <>
                      {introFields.length > 0 ? (
                        <div className="space-y-5">
                          {introFields.map(([fieldKey, field]) => renderField(fieldKey, field))}
                        </div>
                      ) : null}

                      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50/40 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Karty</p>
                            <p className="text-sm text-gray-700 mt-0.5">
                              Vyber kartu - upraví se jen nadpis a popis té karty (méně scrollu).
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {archStandardCardIndices.map((n) => {
                              const titleKey = `standard.card${n}.title`;
                              const raw = (getValue(titleKey, lang) ?? '').trim();
                              const label =
                                raw.length > 22 ? `${raw.slice(0, 20)}…` : raw.length > 0 ? raw : `Karta ${n}`;
                              const isActive = n === activeArchStandardCard;
                              return (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => setActiveArchStandardCard(n)}
                                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                                    isActive
                                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                          {cardFieldsFor(activeArchStandardCard).map(([fieldKey, field]) => {
                            const fieldType = field?.type ?? 'text';
                            const fullSpan = fieldType === 'textarea' || fieldKey.endsWith('.desc');
                            return (
                              <div key={fieldKey} className={fullSpan ? 'md:col-span-2' : ''}>
                                {renderField(fieldKey, field)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                }

                if (isPricingPlanSection) {
                  if (isCollapsed) return null;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {finalFields.map(([fieldKey, field]) => {
                        const fieldType = field?.type ?? 'text';
                        const fullSpan =
                          fieldType === 'textarea' ||
                          fieldKey.endsWith('.features') ||
                          fieldKey.endsWith('.desc');
                        return (
                          <div key={fieldKey} className={fullSpan ? 'md:col-span-2' : ''}>
                            {renderField(fieldKey, field)}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                if (isCollapsed) {
                  // If hidden, keep only a hint.
                  if (isHidden && sectionEnabledKey) {
                    return (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-500">Sekce je skrytá. Přepni na „Zobrazit“ pro editaci obsahu.</p>
                      </div>
                    );
                  }
                }

                return (
                  <div className="space-y-5">
                    {finalFields.map(([fieldKey, field]) => renderField(fieldKey, field))}
                  </div>
                );
              })()}

              {!isHidden && isCtaSection && ctaVariant === 'form' && ctaFormSection ? (
                <div className="rounded-md border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      CTA · Formulář
                    </h3>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {ctaFormSection[1].map(([fieldKey, field]) => {
                      const fieldType = field?.type ?? 'text';
                      const fullSpan = fieldType === 'textarea';
                      return (
                        <div key={fieldKey} className={fullSpan ? 'md:col-span-2' : ''}>
                          {renderField(fieldKey, field)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {sectionTitle.trim() === 'Ceník' && pricingPlanSections.length > 0 ? (
                <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tarify</p>
                      <p className="text-sm text-gray-700 mt-0.5">Klikni na kartu a uprav daný tarif.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pricingPlanSections.map(([title]) => {
                        const idx = parsePricingPlanIndex(title) ?? 0;
                        const isActive = idx === activePricingPlan;
                        const titleFieldKey =
                          pageId === 'pricingPage' ? `plan${idx}.title` : `pricing.plan${idx}.title`;
                        const rawTitle = (getValue(titleFieldKey, lang) ?? '').trim();
                        const tabLabel =
                          rawTitle.length > 26
                            ? `${rawTitle.slice(0, 23)}…`
                            : rawTitle.length > 0
                              ? rawTitle
                              : `Tarif ${idx}`;
                        return (
                          <button
                            key={title}
                            type="button"
                            onClick={() => setActivePricingPlan(idx)}
                            className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                              isActive
                                ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {tabLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {(() => {
                    const selected = pricingPlanSections.find(([t]) => parsePricingPlanIndex(t) === activePricingPlan);
                    if (!selected) return null;
                    const [, planFields] = selected;

                    const planFieldPrefix = pageId === 'pricingPage' ? 'pricingPage' : 'pricing';
                    const planMonthlyKey = `${planFieldPrefix}.plan${activePricingPlan}.priceMonthly`;
                    const planYearlyKey = `${planFieldPrefix}.plan${activePricingPlan}.priceYearly`;

                    const filteredPlanFields = planFields.filter(([k]) => {
                      if (isSingleBillingMode && k === planMonthlyKey) return false;
                      return true;
                    });

                    const monthlyTuple = filteredPlanFields.find(([k]) => k === planMonthlyKey);
                    const yearlyTuple = filteredPlanFields.find(([k]) => k === planYearlyKey);
                    const rest = filteredPlanFields.filter(
                      ([k]) => k !== planMonthlyKey && k !== planYearlyKey
                    );

                    return (
                      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                        {rest.map(([fieldKey, field]) => {
                          const fieldType = field?.type ?? 'text';
                          const fullSpan =
                            fieldType === 'textarea' || fieldKey.endsWith('.features') || fieldKey.endsWith('.desc');
                          return (
                            <div key={fieldKey} className={fullSpan ? 'md:col-span-2' : ''}>
                              {renderField(fieldKey, field)}
                            </div>
                          );
                        })}

                        {(monthlyTuple || yearlyTuple) ? (
                          <div className="md:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {monthlyTuple ? (
                                <div>{renderField(monthlyTuple[0], monthlyTuple[1])}</div>
                              ) : null}
                              {yearlyTuple ? (
                                <div>{renderField(yearlyTuple[0], yearlyTuple[1])}</div>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </>
  );
}

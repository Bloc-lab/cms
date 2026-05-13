import { useEffect, useMemo, useState } from 'react';
import { storageKey as makeStorageKey, type ContentConfig, type ContentField } from '@nase-cms/shared';
import { PRIMARY_LANG } from '../lib/languages';
import { sectionAnchorId } from '../lib/pageFieldSections';

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

const selectClass =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

function parsePricingPlanIndex(sectionTitle: string): number | null {
  const m = sectionTitle.trim().match(/^Ceník\s*·\s*Tarif\s*(\d+)\s*$/i);
  if (!m) return null;
  const n = parseInt(m[1] ?? '', 10);
  return Number.isFinite(n) ? n : null;
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
  /** Např. `arch` — u některých šablon se neupravuje navigace přes JSON. */
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
  siteTemplateId,
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
  const navItems = (siteSettings?.nav?.items ?? []).slice(0, 8);
  const navAvailableSections = useMemo(() => {
    const enabled = (key: string) => (getValue(key, PRIMARY_LANG) ?? '').trim() !== 'hide';
    const out: Array<{ id: 'services' | 'pricing' | 'tax' | 'contact'; label: string }> = [];
    if (enabled('services.enabled')) out.push({ id: 'services', label: 'Služby' });
    if (enabled('pricing.enabled')) out.push({ id: 'pricing', label: 'Ceník' });
    if (enabled('tax.enabled')) out.push({ id: 'tax', label: 'Daňové poradenství' });
    if (enabled('cta.enabled')) out.push({ id: 'contact', label: 'Kontakt (CTA)' });
    return out;
  }, [entries, lang, enabledLangs]);

  const navEditor =
    isMainPage && siteSettings && setSiteSettings && siteTemplateId !== 'arch' ? (
      <div className="rounded-md border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Menu (navigace)</p>
        <p className="text-sm text-gray-700 mt-1">
          Přidej položky menu a vyber, na jakou sekci (scroll) nebo URL mají vést. Položky na skryté sekce se na webu automaticky nezobrazí.
        </p>

        <div className="mt-4 space-y-3">
          {navItems.length === 0 ? (
            <p className="text-sm text-gray-500">Zatím žádné položky.</p>
          ) : null}

          {navItems.map((item, idx) => {
            const kind = item.kind;
            return (
              <div
                key={`${kind}-${idx}`}
                className="rounded-md border border-gray-200 bg-gray-50/60 p-3"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                      Typ
                    </label>
                    <select
                      className={selectClass}
                      value={kind}
                      onChange={(e) => {
                        const nextKind = e.target.value === 'route' ? 'route' : 'section';
                        updateSiteSettings((prev) => {
                          const items = [...(prev.nav?.items ?? [])];
                          items[idx] =
                            nextKind === 'section'
                              ? { kind: 'section', section: navAvailableSections[0]?.id ?? 'services', label: item.label }
                              : { kind: 'route', href: '/', label: item.label };
                          return { ...prev, nav: { ...(prev.nav ?? {}), items } };
                        });
                      }}
                    >
                      <option value="section">Sekce (scroll)</option>
                      <option value="route">URL</option>
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                      Cíl
                    </label>
                    {kind === 'section' ? (
                      <select
                        className={selectClass}
                        value={item.section}
                        onChange={(e) => {
                          const section = e.target.value as any;
                          updateSiteSettings((prev) => {
                            const items = [...(prev.nav?.items ?? [])];
                            items[idx] = { ...(items[idx] ?? {}), kind: 'section', section };
                            return { ...prev, nav: { ...(prev.nav ?? {}), items } };
                          });
                        }}
                      >
                        {navAvailableSections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={inputClass}
                        value={(item as any).href ?? ''}
                        onChange={(e) =>
                          updateSiteSettings((prev) => {
                            const items = [...(prev.nav?.items ?? [])];
                            items[idx] = { ...(items[idx] ?? {}), kind: 'route', href: e.target.value };
                            return { ...prev, nav: { ...(prev.nav ?? {}), items } };
                          })
                        }
                        placeholder="/o-nas nebo /#kontakt"
                      />
                    )}
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                      Label
                    </label>
                    <input
                      className={inputClass}
                      value={item.label ?? ''}
                      onChange={(e) =>
                        updateSiteSettings((prev) => {
                          const items = [...(prev.nav?.items ?? [])];
                          items[idx] = { ...(items[idx] ?? {}), label: e.target.value };
                          return { ...prev, nav: { ...(prev.nav ?? {}), items } };
                        })
                      }
                      placeholder="Text v menu"
                    />
                  </div>

                  <div className="md:col-span-1 md:flex md:justify-end">
                    <div className="flex gap-2 md:flex-col md:items-end">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="px-2 py-2 text-sm font-semibold border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                          disabled={idx === 0}
                          title="Přesunout nahoru"
                          onClick={() =>
                            updateSiteSettings((prev) => {
                              const items = [...(prev.nav?.items ?? [])];
                              if (idx <= 0 || idx >= items.length) return prev;
                              const tmp = items[idx - 1];
                              items[idx - 1] = items[idx];
                              items[idx] = tmp;
                              return { ...prev, nav: { ...(prev.nav ?? {}), items } };
                            })
                          }
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="px-2 py-2 text-sm font-semibold border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                          disabled={idx >= navItems.length - 1}
                          title="Přesunout dolů"
                          onClick={() =>
                            updateSiteSettings((prev) => {
                              const items = [...(prev.nav?.items ?? [])];
                              if (idx < 0 || idx >= items.length - 1) return prev;
                              const tmp = items[idx + 1];
                              items[idx + 1] = items[idx];
                              items[idx] = tmp;
                              return { ...prev, nav: { ...(prev.nav ?? {}), items } };
                            })
                          }
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 rounded-md"
                        onClick={() =>
                          updateSiteSettings((prev) => {
                            const items = [...(prev.nav?.items ?? [])];
                            items.splice(idx, 1);
                            return { ...prev, nav: { ...(prev.nav ?? {}), items } };
                          })
                        }
                      >
                        Smazat
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="px-3 py-2 text-sm font-semibold border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
            disabled={navItems.length >= navAvailableSections.length && navAvailableSections.length > 0}
            onClick={() =>
              updateSiteSettings((prev) => {
                const items = [...(prev.nav?.items ?? [])];
                const first = navAvailableSections[0]?.id ?? 'services';
                items.push({ kind: 'section', section: first, label: '' });
                return { ...prev, nav: { ...(prev.nav ?? {}), items } };
              })
            }
          >
            + Přidat položku (sekce)
          </button>
          <button
            type="button"
            className="px-3 py-2 text-sm font-semibold border border-gray-200 rounded-md bg-white hover:bg-gray-50"
            onClick={() =>
              updateSiteSettings((prev) => {
                const items = [...(prev.nav?.items ?? [])];
                items.push({ kind: 'route', href: '/', label: '' });
                return { ...prev, nav: { ...(prev.nav ?? {}), items } };
              })
            }
          >
            + Přidat položku (URL)
          </button>
        </div>
      </div>
    ) : null;

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

  const ctaFormSection = sectionsRaw.find(([title]) => title.trim() === 'CTA · Formulář') ?? null;

  const sections = sectionsRaw.filter(
    ([title]) => parsePricingPlanIndex(title) === null && title.trim() !== 'CTA · Formulář'
  );

  const [activePricingPlan, setActivePricingPlan] = useState<number>(1);
  useEffect(() => {
    if (pricingPlanSections.length === 0) return;
    if (pricingPlanSections.some(([t]) => parsePricingPlanIndex(t) === activePricingPlan)) return;
    const first = parsePricingPlanIndex(pricingPlanSections[0]?.[0] ?? '') ?? 1;
    setActivePricingPlan(first);
  }, [pricingPlanSections, activePricingPlan]);

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
              {isNavSection ? navEditor : null}
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
                          Formspree URL (pro tento web)
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
                <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tarify</p>
                      <p className="text-sm text-gray-700 mt-0.5">Klikni na kartu a uprav daný tarif.</p>
                    </div>
                    <div className="flex gap-2">
                      {pricingPlanSections.map(([title]) => {
                        const idx = parsePricingPlanIndex(title) ?? 0;
                        const isActive = idx === activePricingPlan;
                        return (
                          <button
                            key={title}
                            type="button"
                            onClick={() => setActivePricingPlan(idx)}
                            className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                              isActive
                                ? 'border-blue-600 bg-blue-50 text-blue-900'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            Tarif {idx}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {(() => {
                    const selected = pricingPlanSections.find(([t]) => parsePricingPlanIndex(t) === activePricingPlan);
                    if (!selected) return null;
                    const [, planFields] = selected;

                    const planMonthlyKey = `pricing.plan${activePricingPlan}.priceMonthly`;
                    const planYearlyKey = `pricing.plan${activePricingPlan}.priceYearly`;

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

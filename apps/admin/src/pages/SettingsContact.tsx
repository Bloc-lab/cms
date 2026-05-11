import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPut } from '../lib/api';
import {
  defaultConfig,
  mergeContentEntriesMap,
  siteSettingsConfig,
  type ContentConfig,
  type ContentField,
} from '@nase-cms/shared';
import { parseEnabledLangs } from '../lib/languages';
import { tenantHref } from '../lib/tenantPath';
import StickyActionBar from '../components/StickyActionBar';
import Toast from '../components/Toast';

interface ContentEntry {
  key: string;
  lang: string;
  value: string;
}

type AdminSiteSettings = {
  templateId?: string;
  theme: { primary: string; secondary1: string; secondary2?: string };
  nav?: {
    items?: Array<
      | { kind: 'section'; section: 'services' | 'pricing' | 'tax' | 'contact'; label?: string }
      | { kind: 'route'; href: string; label?: string }
    >;
    cta?: { href?: string; label?: string };
  };
  cta: {
    variant: 'buttons' | 'form';
    buttons?: { phoneLabel?: string; emailLabel?: string };
    form?: { submitLabel?: string; successMessage?: string; layout?: 'center' | 'split' };
  };
  lead?: { notificationEmail?: string; formspreeUrl?: string };
};

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

const selectClass =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

function fieldLabel(field: ContentField | undefined, key: string): string {
  const base = field?.label ?? key;
  return field?.required ? `${base} *` : base;
}

function formatSavedAt(d: Date): string {
  return d.toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const contactConfig: ContentConfig = siteSettingsConfig;

export default function SettingsContact() {
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [baseline, setBaseline] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<string>('cs');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [toast, setToast] = useState('');
  const [recentlySaved, setRecentlySaved] = useState(false);
  const [siteSettings, setSiteSettings] = useState<AdminSiteSettings | null>(null);
  const [baselineSiteSettings, setBaselineSiteSettings] = useState<AdminSiteSettings | null>(null);

  const entryKey = (key: string, l: string) => `${key}:${l}`;
  const getValue = (key: string, l: string) => entries[entryKey(key, l)] ?? '';
  const enabledLangs = parseEnabledLangs(entries);
  const isContentDirty = (() => {
    for (const key of Object.keys(contactConfig)) {
      for (const l of enabledLangs) {
        const k = entryKey(key, l);
        if ((entries[k] ?? '') !== (baseline[k] ?? '')) return true;
      }
    }
    return false;
  })();
  const isSiteSettingsDirty = useMemo(() => {
    if (!siteSettings || !baselineSiteSettings) return false;
    return JSON.stringify(siteSettings) !== JSON.stringify(baselineSiteSettings);
  }, [siteSettings, baselineSiteSettings]);
  const isDirty = isContentDirty || isSiteSettingsDirty;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [data, s] = await Promise.all([
          apiGet<{ entries: ContentEntry[] }>('/api/v1/admin/content'),
          apiGet<AdminSiteSettings>('/api/v1/admin/site-settings').catch(() => null),
        ]);
        if (cancelled) return;
        const map = mergeContentEntriesMap(data.entries ?? []);
        setEntries(map);
        setBaseline({ ...map });
        setSiteSettings(s);
        setBaselineSiteSettings(s ? (JSON.parse(JSON.stringify(s)) as AdminSiteSettings) : null);
        setError('');
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Chyba při načítání');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sections = useMemo(() => {
    const out = new Map<string, Array<[string, ContentField]>>();
    for (const [key, field] of Object.entries(contactConfig)) {
      const s = field.section ?? 'Obecné';
      const arr = out.get(s) ?? [];
      arr.push([key, field]);
      out.set(s, arr);
    }
    return [...out.entries()];
  }, []);

  const setValue = (key: string, l: string, value: string) => {
    setEntries((prev) => ({ ...prev, [entryKey(key, l)]: value }));
  };

  const updateSiteSettings = (fn: (prev: AdminSiteSettings) => AdminSiteSettings) => {
    setSiteSettings((prev) => {
      if (!prev) return prev;
      return fn(prev);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      for (const [key, field] of Object.entries(contactConfig)) {
        if (!field.required) continue;
        const filled = enabledLangs.some((l) => (getValue(key, l) ?? '').trim());
        if (!filled) {
          setError(`Vyplňte povinné pole: ${field.label}`);
          return;
        }
      }

      const contentEntries: ContentEntry[] = [];
      for (const key of Object.keys(defaultConfig)) {
        for (const l of enabledLangs) {
          contentEntries.push({
            key,
            lang: l,
            value: entries[entryKey(key, l)] ?? '',
          });
        }
      }
      await apiPut('/api/v1/admin/content', { entries: contentEntries });

      if (siteSettings) {
        await apiPut('/api/v1/admin/site-settings', siteSettings);
        setBaselineSiteSettings(JSON.parse(JSON.stringify(siteSettings)) as AdminSiteSettings);
      }

      setBaseline({ ...entries });
      setLastSavedAt(new Date());
      setToast('Vše uloženo');
      setRecentlySaved(true);
      setTimeout(() => setRecentlySaved(false), 10_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setEntries({ ...baseline });
    setSiteSettings(baselineSiteSettings ? (JSON.parse(JSON.stringify(baselineSiteSettings)) as AdminSiteSettings) : null);
    setError('');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-500 text-sm">Načítání…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Toast message={toast} show={toast.length > 0} onClose={() => setToast('')} />
      <nav className="text-sm text-gray-500 mb-3" aria-label="Drobečková navigace">
        <Link to={tenantHref('/metadata')} className="hover:text-gray-700">
          Nastavení webu
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-gray-900 font-medium">Kontakt a firma</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Kontakt a firma</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Údaje, které platí pro celý web (např. ve footeru nebo v kontaktní sekci).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5 shadow-sm">
            {enabledLangs.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 text-sm font-medium rounded ${
                  lang === l ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? 'Ukládání…' : 'Uložit'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {sections.map(([sectionTitle, fields]) => (
          <section
            key={sectionTitle}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">{sectionTitle}</h2>
            </div>
            <div className="p-5 space-y-5">
              {sectionTitle.trim().toUpperCase() === 'NAVIGACE' && siteSettings ? (
                <div className="rounded-md border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Menu (navigace)</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Položky menu se ukládají do Site Settings. Položky, které míří na skryté sekce, se na webu automaticky nezobrazí.
                  </p>

                  {(() => {
                    const enabled = (key: string) => (getValue(key, 'cs') ?? '').trim() !== 'hide';
                    const availableSections: Array<{ id: 'services' | 'pricing' | 'tax' | 'contact'; label: string }> =
                      [];
                    if (enabled('services.enabled')) availableSections.push({ id: 'services', label: 'Služby' });
                    if (enabled('pricing.enabled')) availableSections.push({ id: 'pricing', label: 'Ceník' });
                    if (enabled('tax.enabled')) availableSections.push({ id: 'tax', label: 'Daňové poradenství' });
                    if (enabled('cta.enabled')) availableSections.push({ id: 'contact', label: 'Kontakt (CTA)' });

                    const items = (siteSettings.nav?.items ?? []).slice(0, 8);

                    return (
                      <>
                        <div className="mt-4 space-y-3">
                          {items.length === 0 ? (
                            <p className="text-sm text-gray-500">Zatím žádné položky.</p>
                          ) : null}

                          {items.map((item, idx) => (
                            <div key={`${item.kind}-${idx}`} className="rounded-md border border-gray-200 bg-gray-50/60 p-3">
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                                <div className="md:col-span-3">
                                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Typ</label>
                                  <select
                                    className={selectClass}
                                    value={item.kind}
                                    onChange={(e) => {
                                      const nextKind = e.target.value === 'route' ? 'route' : 'section';
                                      updateSiteSettings((prev) => {
                                        const next = { ...prev };
                                        const list = [...(next.nav?.items ?? [])];
                                        list[idx] =
                                          nextKind === 'section'
                                            ? { kind: 'section', section: availableSections[0]?.id ?? 'services', label: item.label }
                                            : { kind: 'route', href: '/', label: item.label };
                                        next.nav = { ...(next.nav ?? {}), items: list };
                                        return next;
                                      });
                                    }}
                                  >
                                    <option value="section">Sekce (scroll)</option>
                                    <option value="route">URL</option>
                                  </select>
                                </div>

                                <div className="md:col-span-4">
                                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Cíl</label>
                                  {item.kind === 'section' ? (
                                    <select
                                      className={selectClass}
                                      value={item.section}
                                      onChange={(e) => {
                                        const section = e.target.value as any;
                                        updateSiteSettings((prev) => {
                                          const next = { ...prev };
                                          const list = [...(next.nav?.items ?? [])];
                                          list[idx] = { ...(list[idx] ?? {}), kind: 'section', section };
                                          next.nav = { ...(next.nav ?? {}), items: list };
                                          return next;
                                        });
                                      }}
                                    >
                                      {availableSections.map((s) => (
                                        <option key={s.id} value={s.id}>{s.label}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      className={inputClass}
                                      value={(item as any).href ?? ''}
                                      onChange={(e) =>
                                        updateSiteSettings((prev) => {
                                          const next = { ...prev };
                                          const list = [...(next.nav?.items ?? [])];
                                          list[idx] = { ...(list[idx] ?? {}), kind: 'route', href: e.target.value };
                                          next.nav = { ...(next.nav ?? {}), items: list };
                                          return next;
                                        })
                                      }
                                      placeholder="/o-nas nebo /#kontakt"
                                    />
                                  )}
                                </div>

                                <div className="md:col-span-4">
                                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Label</label>
                                  <input
                                    className={inputClass}
                                    value={item.label ?? ''}
                                    onChange={(e) =>
                                      updateSiteSettings((prev) => {
                                        const next = { ...prev };
                                        const list = [...(next.nav?.items ?? [])];
                                        list[idx] = { ...(list[idx] ?? {}), label: e.target.value };
                                        next.nav = { ...(next.nav ?? {}), items: list };
                                        return next;
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
                                            const next = { ...prev };
                                            const list = [...(next.nav?.items ?? [])];
                                            if (idx <= 0 || idx >= list.length) return prev;
                                            const tmp = list[idx - 1];
                                            list[idx - 1] = list[idx];
                                            list[idx] = tmp;
                                            next.nav = { ...(next.nav ?? {}), items: list };
                                            return next;
                                          })
                                        }
                                      >
                                        ↑
                                      </button>
                                      <button
                                        type="button"
                                        className="px-2 py-2 text-sm font-semibold border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                                        disabled={idx >= items.length - 1}
                                        title="Přesunout dolů"
                                        onClick={() =>
                                          updateSiteSettings((prev) => {
                                            const next = { ...prev };
                                            const list = [...(next.nav?.items ?? [])];
                                            if (idx < 0 || idx >= list.length - 1) return prev;
                                            const tmp = list[idx + 1];
                                            list[idx + 1] = list[idx];
                                            list[idx] = tmp;
                                            next.nav = { ...(next.nav ?? {}), items: list };
                                            return next;
                                          })
                                        }
                                      >
                                        ↓
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      className="w-full md:w-auto px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 rounded-md"
                                      onClick={() =>
                                        updateSiteSettings((prev) => {
                                          const next = { ...prev };
                                          const list = [...(next.nav?.items ?? [])];
                                          list.splice(idx, 1);
                                          next.nav = { ...(next.nav ?? {}), items: list };
                                          return next;
                                        })
                                      }
                                    >
                                      Smazat
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="px-3 py-2 text-sm font-semibold border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                            disabled={items.length >= availableSections.length && availableSections.length > 0}
                            onClick={() =>
                              updateSiteSettings((prev) => {
                                const next = { ...prev };
                                const list = [...(next.nav?.items ?? [])];
                                const first = availableSections[0]?.id ?? 'services';
                                list.push({ kind: 'section', section: first, label: '' });
                                next.nav = { ...(next.nav ?? {}), items: list };
                                return next;
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
                                const next = { ...prev };
                                const list = [...(next.nav?.items ?? [])];
                                list.push({ kind: 'route', href: '/', label: '' });
                                next.nav = { ...(next.nav ?? {}), items: list };
                                return next;
                              })
                            }
                          >
                            + Přidat položku (URL)
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : null}
              {fields.map(([key, field]) => {
                if (sectionTitle.trim().toUpperCase() === 'NAVIGACE') {
                  if (
                    [
                      'nav.services',
                      'nav.about',
                      'nav.pricing',
                      'nav.tax',
                      'nav.ctaContact',
                    ].includes(key)
                  ) {
                    return null;
                  }
                }
                const fieldType = field?.type ?? 'text';
                const value = getValue(key, lang);
                const label = fieldLabel(field, key);

                const help = field.helpText?.trim();

                if (fieldType === 'textarea') {
                  return (
                    <div key={key}>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                        {label}
                      </label>
                      {help ? <p className="text-xs text-gray-500 mb-2">{help}</p> : null}
                      <textarea
                        value={value}
                        onChange={(e) => setValue(key, lang, e.target.value)}
                        rows={4}
                        placeholder={field.placeholder}
                        maxLength={field.maxLength}
                        className={inputClass}
                      />
                    </div>
                  );
                }

                return (
                  <div key={key}>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                      {label}
                      {field.advanced ? (
                        <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-gray-600">
                          Pokročilé
                        </span>
                      ) : null}
                    </label>
                    {help ? <p className="text-xs text-gray-500 mb-2">{help}</p> : null}
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setValue(key, lang, e.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      className={`${inputClass} max-w-xl`}
                    />
                    {field.recommendedMaxLength ? (
                      <p className="text-xs text-gray-500 mt-1">
                        Doporučeno max. {field.recommendedMaxLength} znaků
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="h-20" />

      <StickyActionBar
        left={
          lastSavedAt ? (
            <>
              Naposledy uloženo <time dateTime={lastSavedAt.toISOString()}>{formatSavedAt(lastSavedAt)}</time>
              {recentlySaved ? (
                <span className="ml-2 text-emerald-700 font-medium" aria-live="polite">
                  • Vše uloženo
                </span>
              ) : null}
              {isDirty ? <span className="ml-2 text-amber-700">• Neuložené změny</span> : null}
            </>
          ) : (
            <>{isDirty ? 'Máte neuložené změny' : 'Beze změn'}</>
          )
        }
        right={
          <>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={!isDirty || saving}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zrušit rozpracované
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
                recentlySaved && !isDirty
                  ? 'bg-emerald-600'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? 'Ukládání…' : recentlySaved && !isDirty ? 'Uloženo' : 'Uložit změny'}
            </button>
          </>
        }
      />
    </div>
  );
}


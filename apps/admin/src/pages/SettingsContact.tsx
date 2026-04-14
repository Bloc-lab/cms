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
import StickyActionBar from '../components/StickyActionBar';
import Toast from '../components/Toast';

interface ContentEntry {
  key: string;
  lang: string;
  value: string;
}

const inputClass =
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

  const entryKey = (key: string, l: string) => `${key}:${l}`;
  const getValue = (key: string, l: string) => entries[entryKey(key, l)] ?? '';
  const enabledLangs = parseEnabledLangs(entries);
  const isDirty = (() => {
    for (const key of Object.keys(contactConfig)) {
      for (const l of enabledLangs) {
        const k = entryKey(key, l);
        if ((entries[k] ?? '') !== (baseline[k] ?? '')) return true;
      }
    }
    return false;
  })();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<{ entries: ContentEntry[] }>('/api/v1/admin/content');
        if (cancelled) return;
        const map = mergeContentEntriesMap(data.entries ?? []);
        setEntries(map);
        setBaseline({ ...map });
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
    setError('');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-500 text-sm">Načítání…</div>;
  }

  return (
    <div>
      <Toast message={toast} show={toast.length > 0} onClose={() => setToast('')} />
      <nav className="text-sm text-gray-500 mb-3" aria-label="Drobečková navigace">
        <Link to="/metadata" className="hover:text-gray-700">
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
              {fields.map(([key, field]) => {
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


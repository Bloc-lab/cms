import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPut } from '../lib/api';
import {
  ADMIN_LOGO_KEY,
  ADMIN_SITE_NAME_KEY,
  defaultConfig,
  mergeContentEntriesMap,
  metadataConfig,
  type ContentField,
} from '@nase-cms/shared';
import MediaPicker from '../components/MediaPicker';
import { dispatchBrandingRefresh } from '../lib/branding';

const SUPPORTED_LANGS = ['cs', 'en'] as const;

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

interface ContentEntry {
  key: string;
  lang: string;
  value: string;
}

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

export default function Metadata() {
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [baseline, setBaseline] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'cs' | 'en'>('cs');
  const [mediaPickerKey, setMediaPickerKey] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const entryKey = (key: string, l: string) => `${key}:${l}`;

  const loadContent = async () => {
    try {
      const data = await apiGet<{ entries: ContentEntry[]; tenantName?: string | null }>(
        '/api/v1/admin/content'
      );
      const map = mergeContentEntriesMap(data.entries ?? []);

      const tenantName = (data.tenantName ?? '').trim();
      const siteNameMissing = !SUPPORTED_LANGS.some(
        (l) => (map[entryKey(ADMIN_SITE_NAME_KEY, l)] ?? '').trim()
      );
      if (tenantName && siteNameMissing) {
        for (const l of SUPPORTED_LANGS) {
          map[entryKey(ADMIN_SITE_NAME_KEY, l)] = tenantName;
        }
      }

      setEntries(map);
      setBaseline({ ...map });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při načítání');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const getValue = (key: string, l: string) => entries[entryKey(key, l)] ?? '';

  const setValue = (key: string, l: string, value: string) => {
    setEntries((prev) => ({ ...prev, [entryKey(key, l)]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      for (const key of Object.keys(metadataConfig)) {
        const field = metadataConfig[key];
        if (field?.required) {
          const filled = SUPPORTED_LANGS.some((l) => getValue(key, l)?.trim());
          if (!filled) {
            setError(`Vyplňte povinné pole: ${field.label}`);
            return;
          }
        }
      }
      const contentEntries: ContentEntry[] = [];
      for (const key of Object.keys(defaultConfig)) {
        for (const l of SUPPORTED_LANGS) {
          contentEntries.push({
            key,
            lang: l,
            value: getValue(key, l),
          });
        }
      }
      await apiPut('/api/v1/admin/content', { entries: contentEntries });
      setBaseline({ ...entries });
      setLastSavedAt(new Date());
      dispatchBrandingRefresh();
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

  const handleImageSelect = (key: string) => (item: { url: string | null; path: string }) => {
    const url =
      item.url ??
      (item.path ? `${import.meta.env.VITE_SUPABASE_URL ?? ''}/storage/v1/object/public/media/${item.path}` : '');
    const v = url ?? '';
    if (key === ADMIN_LOGO_KEY) {
      for (const l of SUPPORTED_LANGS) {
        setValue(key, l, v);
      }
    } else {
      setValue(key, lang, v);
    }
    setMediaPickerKey(null);
  };

  /** Pole z `metadataConfig` ve shared — přidáním klíče v balíčku se objeví ve formuláři. */
  const metadataFields = Object.entries(metadataConfig);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 text-sm">Načítání…</div>
    );
  }

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-3" aria-label="Drobečková navigace">
        <Link to="/metadata" className="hover:text-gray-700">
          Nastavení
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-gray-900 font-medium">Metadata webu</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Metadata webu</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Globální nastavení značky (pole <code className="text-xs bg-gray-100 px-1 rounded">metadataConfig</code> v
            shared). Texty na stránkách upravíte přes{' '}
            <Link to="/" className="text-blue-600 hover:underline">
              Stránky webu
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5 shadow-sm">
            {SUPPORTED_LANGS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 text-sm font-medium rounded ${
                  lang === l ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {l === 'cs' ? 'CZ' : 'EN'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 shadow-sm"
          >
            {saving ? 'Ukládání…' : 'Uložit'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Značka a CMS</h2>
        </div>
        <div className="p-5 space-y-5">
          {metadataFields.map(([key, field]) => {
            const fieldType = field?.type ?? 'text';
            const value =
              key === ADMIN_LOGO_KEY ? getValue(key, 'cs') || getValue(key, 'en') : getValue(key, lang);
            const label = fieldLabel(field, key);

            if (fieldType === 'image') {
              return (
                <div key={key}>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    {label}
                  </label>
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="shrink-0">
                      {value ? (
                        <img
                          src={value}
                          alt=""
                          className="h-24 w-36 object-cover rounded-md border border-gray-200"
                        />
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
                          onClick={() => setMediaPickerKey(key)}
                          className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-md hover:bg-gray-50"
                        >
                          Vybrat z knihovny
                        </button>
                        {value && (
                          <button
                            type="button"
                            onClick={() => {
                              for (const l of SUPPORTED_LANGS) {
                                setValue(key, l, '');
                              }
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
                          >
                            Odstranit
                          </button>
                        )}
                      </div>
                      {value && (
                        <p className="text-xs text-gray-500 truncate max-w-md" title={value}>
                          {value}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={key}>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  {label}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(key, lang, e.target.value)}
                  className={`${inputClass} max-w-xl`}
                />
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          {lastSavedAt ? (
            <>
              Naposledy uloženo <time dateTime={lastSavedAt.toISOString()}>{formatSavedAt(lastSavedAt)}</time>
            </>
          ) : (
            'Zatím neuloženo v této relaci'
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDiscard}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
          >
            Zrušit rozpracované
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 shadow-sm"
          >
            {saving ? 'Ukládání…' : 'Uložit změny'}
          </button>
        </div>
      </div>

      {mediaPickerKey && (
        <MediaPicker
          onSelect={handleImageSelect(mediaPickerKey)}
          onClose={() => setMediaPickerKey(null)}
        />
      )}
    </div>
  );
}

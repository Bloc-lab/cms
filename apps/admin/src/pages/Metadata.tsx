import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPut } from '../lib/api';
import {
  ADMIN_LOGO_KEY,
  ADMIN_SITE_NAME_KEY,
  ADMIN_ENABLED_LANGS_KEY,
  ADMIN_SHOW_TRANSLATION_BADGES_KEY,
  defaultConfig,
  mergeContentEntriesMap,
  metadataConfig,
  type ContentField,
} from '@nase-cms/shared';
import MediaPicker from '../components/MediaPicker';
import { dispatchBrandingRefresh } from '../lib/branding';
import {
  AVAILABLE_LANGS,
  parseEnabledLangs,
  parseShowTranslationBadges,
  setEnabledLangsValue,
  setShowTranslationBadgesValue,
} from '../lib/languages';
import StickyActionBar from '../components/StickyActionBar';
import Toast from '../components/Toast';

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
  const [lang, setLang] = useState<string>('cs');
  const [mediaPickerKey, setMediaPickerKey] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [toast, setToast] = useState('');
  const [recentlySaved, setRecentlySaved] = useState(false);

  const entryKey = (key: string, l: string) => `${key}:${l}`;
  const enabledLangs = parseEnabledLangs(entries);
  const showTranslationBadges = parseShowTranslationBadges(entries);
  const isDirty = (() => {
    for (const key of Object.keys(metadataConfig)) {
      for (const l of enabledLangs) {
        const k = entryKey(key, l);
        if ((entries[k] ?? '') !== (baseline[k] ?? '')) return true;
      }
    }
    return false;
  })();

  const loadContent = async () => {
    try {
      const data = await apiGet<{ entries: ContentEntry[]; tenantName?: string | null }>(
        '/api/v1/admin/content'
      );
      const map = mergeContentEntriesMap(data.entries ?? []);

      const tenantName = (data.tenantName ?? '').trim();
      const siteNameMissing = !parseEnabledLangs(map).some(
        (l) => (map[entryKey(ADMIN_SITE_NAME_KEY, l)] ?? '').trim()
      );
      if (tenantName && siteNameMissing) {
        for (const l of parseEnabledLangs(map)) {
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
          const filled = enabledLangs.some((l) => getValue(key, l)?.trim());
          if (!filled) {
            setError(`Vyplňte povinné pole: ${field.label}`);
            return;
          }
        }
      }
      const contentEntries: ContentEntry[] = [];
      for (const key of Object.keys(defaultConfig)) {
        for (const l of enabledLangs) {
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
      setToast('Vše uloženo');
      setRecentlySaved(true);
      setTimeout(() => setRecentlySaved(false), 10_000);
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
      for (const l of enabledLangs) {
        setValue(key, l, v);
      }
    } else {
      setValue(key, lang, v);
    }
    setMediaPickerKey(null);
  };

  const langOptions = useMemo(() => AVAILABLE_LANGS, []);

  const toggleEnabledLang = (code: string) => {
    const next = new Set(enabledLangs);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    const nextValue = setEnabledLangsValue([...next]);
    // ukládáme jen do cs varianty – je to interní admin preference
    setValue(ADMIN_ENABLED_LANGS_KEY, 'cs', nextValue);
  };

  const setBadges = (show: boolean) => {
    setValue(ADMIN_SHOW_TRANSLATION_BADGES_KEY, 'cs', setShowTranslationBadgesValue(show));
  };

  /** Pole z `metadataConfig` ve shared — přidáním klíče v balíčku se objeví ve formuláři. */
  const metadataFields = Object.entries(metadataConfig).filter(
    ([k]) => k !== ADMIN_ENABLED_LANGS_KEY && k !== ADMIN_SHOW_TRANSLATION_BADGES_KEY
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 text-sm">Načítání…</div>
    );
  }

  return (
    <div>
      <Toast message={toast} show={toast.length > 0} onClose={() => setToast('')} />
      <nav className="text-sm text-gray-500 mb-3" aria-label="Drobečková navigace">
        <span className="text-gray-900 font-medium">Nastavení webu</span>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-gray-900 font-medium">Základní nastavení</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Základní nastavení</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Základní údaje o webu a administraci. Texty na stránkách upravíte přes{' '}
            <Link to="/" className="text-blue-600 hover:underline">
              Stránky webu
            </Link>
            .
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
            const help = field.helpText?.trim();

            if (fieldType === 'image') {
              return (
                <div key={key}>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    {label}
                  </label>
                  {help ? <p className="text-xs text-gray-500 mb-2">{help}</p> : null}
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
                              for (const l of enabledLangs) {
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
                {help ? <p className="text-xs text-gray-500 mb-2">{help}</p> : null}
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

      <section className="mt-5 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Jazyky a překlady</h2>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Aktivní jazyky webu</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {langOptions.map((l) => {
                const checked = enabledLangs.includes(l.code);
                const disabled = l.code === 'cs';
                return (
                  <label
                    key={l.code}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                      checked ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 bg-white'
                    } ${disabled ? 'opacity-70' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleEnabledLang(l.code)}
                    />
                    <span className="text-gray-800">{l.label}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Pozn.: Čeština je vždy aktivní. Přepínače jazyků v CMS se řídí tímto nastavením.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-md border border-gray-200 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Upozornění na chybějící překlady</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Zobrazí štítky „Chybí překlad“ u sekcí a polí.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBadges(!showTranslationBadges)}
              className={`h-8 w-14 rounded-full border transition-colors ${
                showTranslationBadges ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 border-gray-200'
              }`}
              aria-pressed={showTranslationBadges}
              aria-label="Přepnout upozornění na překlady"
            >
              <span
                className={`block h-7 w-7 rounded-full bg-white shadow-sm transition-transform ${
                  showTranslationBadges ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

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

      {mediaPickerKey && (
        <MediaPicker
          onSelect={handleImageSelect(mediaPickerKey)}
          onClose={() => setMediaPickerKey(null)}
        />
      )}
    </div>
  );
}

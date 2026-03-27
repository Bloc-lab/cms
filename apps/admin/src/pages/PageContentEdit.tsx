import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { apiGet, apiPut } from '../lib/api';
import {
  defaultConfig,
  mergeContentEntriesMap,
  sitePagesConfig,
  storageKey,
} from '@nase-cms/shared';
import PageContentFields from '../components/PageContentFields';
import MediaPicker from '../components/MediaPicker';
import { dispatchBrandingRefresh } from '../lib/branding';

const SUPPORTED_LANGS = ['cs', 'en'] as const;

interface ContentEntry {
  key: string;
  lang: string;
  value: string;
}

function formatSavedAt(d: Date): string {
  return d.toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PageContentEdit() {
  const { pageId } = useParams<{ pageId: string }>();
  const pageDef = pageId ? sitePagesConfig[pageId] : undefined;

  const [entries, setEntries] = useState<Record<string, string>>({});
  const [baseline, setBaseline] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'cs' | 'en'>('cs');
  const [mediaPickerKey, setMediaPickerKey] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const entryKey = (key: string, l: string) => `${key}:${l}`;

  useEffect(() => {
    if (!pageDef) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<{ entries: ContentEntry[]; tenantName?: string | null }>(
          '/api/v1/admin/content'
        );
        if (cancelled) return;
        const map = mergeContentEntriesMap(data.entries ?? []);

        const tenantName = (data.tenantName ?? '').trim();
        const siteNameMissing = !SUPPORTED_LANGS.some(
          (l) => (map[entryKey('admin.siteName', l)] ?? '').trim()
        );
        if (tenantName && siteNameMissing) {
          for (const l of SUPPORTED_LANGS) {
            map[entryKey('admin.siteName', l)] = tenantName;
          }
        }

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
  }, [pageDef]);

  if (!pageId || !pageDef) {
    return <Navigate to="/" replace />;
  }

  const setValue = (key: string, l: string, value: string) => {
    setEntries((prev) => ({ ...prev, [entryKey(key, l)]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      for (const [fieldKey, field] of Object.entries(pageDef.fields)) {
        if (!field.required) continue;
        const sk = storageKey(pageId, fieldKey);
        const filled = SUPPORTED_LANGS.some((l) => (entries[entryKey(sk, l)] ?? '').trim());
        if (!filled) {
          setError(`Vyplňte povinné pole: ${field.label}`);
          return;
        }
      }
      const contentEntries: ContentEntry[] = [];
      for (const key of Object.keys(defaultConfig)) {
        for (const l of SUPPORTED_LANGS) {
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
    setValue(key, lang, url ?? '');
    setMediaPickerKey(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 text-sm">Načítání…</div>
    );
  }

  const pathLabel = pageDef.slug === '' ? '/' : `/${pageDef.slug}`;

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-3" aria-label="Drobečková navigace">
        <Link to="/" className="hover:text-gray-700">
          Stránky
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{pageDef.label}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{pageDef.label}</h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">{pathLabel}</p>
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
          <Link
            to="/"
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Zpět na seznam
          </Link>
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

      <div className="space-y-5">
        <PageContentFields
          pageId={pageId}
          fields={pageDef.fields}
          lang={lang}
          entries={entries}
          entryKey={entryKey}
          setValue={setValue}
          setMediaPickerKey={setMediaPickerKey}
        />
      </div>

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

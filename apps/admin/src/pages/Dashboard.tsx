import { useEffect, useState } from 'react';
import { apiGet, apiPut } from '../lib/api';
import { defaultConfig, type ContentConfig } from '@nase-cms/shared';
import MediaPicker from '../components/MediaPicker';

const SUPPORTED_LANGS = ['cs', 'en'] as const;

interface ContentEntry {
  key: string;
  lang: string;
  value: string;
}

function groupKeysByPrefix(config: ContentConfig): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const key of Object.keys(config)) {
    const prefix = key.includes('.') ? key.split('.')[0] : 'general';
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(key);
  }
  return groups;
}

export default function Dashboard() {
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'cs' | 'en'>('cs');
  const [mediaPickerKey, setMediaPickerKey] = useState<string | null>(null);

  const entryKey = (key: string, l: string) => `${key}:${l}`;

  const loadContent = async () => {
    try {
      const data = await apiGet<{ entries: ContentEntry[] }>('/api/v1/admin/content');
      const map: Record<string, string> = {};
      for (const e of data.entries ?? []) {
        map[entryKey(e.key, e.lang)] = e.value ?? '';
      }
      setEntries(map);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání');
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (key: string) => (item: { url: string | null; path: string }) => {
    const url = item.url ?? (item.path ? `${import.meta.env.VITE_SUPABASE_URL ?? ''}/storage/v1/object/public/media/${item.path}` : '');
    setValue(key, lang, url ?? '');
    setMediaPickerKey(null);
  };

  const groups = groupKeysByPrefix(defaultConfig);

  if (loading) return <div>Načítání obsahu...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Obsah webu</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {SUPPORTED_LANGS.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded ${lang === l ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                {l === 'cs' ? 'CZ' : 'EN'}
              </button>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Ukládání...' : 'Uložit'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="space-y-8">
        {Object.entries(groups).map(([prefix, keys]) => (
          <section key={prefix} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 capitalize">{prefix}</h2>
            <div className="space-y-4">
              {keys.map((key) => {
                const field = defaultConfig[key];
                const fieldType = field?.type ?? 'text';
                const value = getValue(key, lang);

                if (fieldType === 'textarea') {
                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{field?.label ?? key}</label>
                      <textarea
                        value={value}
                        onChange={(e) => setValue(key, lang, e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  );
                }

                if (fieldType === 'image') {
                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{field?.label ?? key}</label>
                      <div className="flex items-center gap-2">
                        {value ? (
                          <img src={value} alt="" className="h-20 w-20 object-cover rounded border" />
                        ) : (
                          <div className="h-20 w-20 rounded border bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                            Žádný
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setMediaPickerKey(key)}
                          className="px-3 py-1 border rounded hover:bg-gray-50"
                        >
                          Vybrat
                        </button>
                        {value && (
                          <button
                            type="button"
                            onClick={() => setValue(key, lang, '')}
                            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            Odstranit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field?.label ?? key}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setValue(key, lang, e.target.value)}
                      className="w-full max-w-md px-3 py-2 border rounded-md"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
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

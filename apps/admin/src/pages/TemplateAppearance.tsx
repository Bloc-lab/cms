import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Toast from '../components/Toast';
import StickyActionBar from '../components/StickyActionBar';
import { apiGet, apiPut } from '../lib/api';

type SiteSettingsPublic = {
  templateId?: string;
  theme: {
    primary: string;
    secondary1: string;
    secondary2?: string;
  };
};

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

const selectClass =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

function normalizeHex(value: string): string {
  const v = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  return value.trim();
}

function safeColor(value: string, fallback: string): string {
  const v = normalizeHex(value);
  return /^#[0-9a-f]{6}$/.test(v) ? v : fallback;
}

function formatSavedAt(d: Date): string {
  return d.toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const TEMPLATE_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'redus', label: 'Redus' },
  { id: 'template2', label: 'Template 2' },
  { id: 'template3', label: 'Template 3' },
];

export default function TemplateAppearance() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [baseline, setBaseline] = useState<SiteSettingsPublic | null>(null);
  const [value, setValue] = useState<SiteSettingsPublic>({
    templateId: 'redus',
    theme: { primary: '#2c4ab1', secondary1: '#5a4fcf', secondary2: '' },
  });

  const isDirty = useMemo(() => JSON.stringify(value) !== JSON.stringify(baseline), [value, baseline]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<SiteSettingsPublic>('/api/v1/admin/site-settings');
        if (cancelled) return;
        const normalized: SiteSettingsPublic = {
          templateId: data.templateId ?? 'redus',
          theme: {
            primary: safeColor(data.theme?.primary ?? '', '#2c4ab1'),
            secondary1: safeColor(data.theme?.secondary1 ?? '', '#5a4fcf'),
            secondary2: data.theme?.secondary2 ? safeColor(data.theme.secondary2, '#000000') : '',
          },
        };
        setValue(normalized);
        setBaseline(JSON.parse(JSON.stringify(normalized)) as SiteSettingsPublic);
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

  const onSave = async () => {
    setSaving(true);
    setError('');
    try {
      const existing = await apiGet<any>('/api/v1/admin/site-settings');
      const merged = {
        ...existing,
        templateId: value.templateId?.trim() || undefined,
        theme: {
          primary: safeColor(value.theme.primary, '#2c4ab1'),
          secondary1: safeColor(value.theme.secondary1, '#5a4fcf'),
          ...(value.theme.secondary2?.trim()
            ? { secondary2: safeColor(value.theme.secondary2, '#000000') }
            : {}),
        },
      };

      await apiPut('/api/v1/admin/site-settings', merged);
      setBaseline(JSON.parse(JSON.stringify(value)) as SiteSettingsPublic);
      setLastSavedAt(new Date());
      setToast('Vše uloženo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání');
    } finally {
      setSaving(false);
    }
  };

  const onDiscard = () => {
    if (baseline) setValue(JSON.parse(JSON.stringify(baseline)) as SiteSettingsPublic);
    setError('');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-500 text-sm">Načítání…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Toast message={toast} show={toast.length > 0} onClose={() => setToast('')} />

      <nav className="text-sm text-gray-500 mb-3" aria-label="Drobečková navigace">
        <Link to="/metadata" className="hover:text-gray-700">
          Nastavení webu
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-gray-900 font-medium">Šablona / Vzhled</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Šablona / Vzhled</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Veřejná nastavení pro šablony (barvy). Změny se projeví okamžitě přes public endpoint.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={onSave}
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

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Šablona</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="max-w-md">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Template ID
            </label>
            <select
              value={value.templateId ?? ''}
              onChange={(e) => setValue((p) => ({ ...p, templateId: e.target.value }))}
              className={selectClass}
            >
              {TEMPLATE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Připraveno tak, aby šlo snadno přidat další šablony.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Barvy (theme)</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { key: 'primary', label: 'Primary', required: true, fallback: '#2c4ab1' },
            { key: 'secondary1', label: 'Secondary 1', required: true, fallback: '#5a4fcf' },
            { key: 'secondary2', label: 'Secondary 2', required: false, fallback: '#000000' },
          ].map((f) => {
            const current = (value.theme as any)[f.key] as string;
            const colorValue = safeColor(current || f.fallback, f.fallback);
            return (
              <div key={f.key} className="max-w-md">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  {f.label}
                  {f.required ? ' *' : ''}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorValue}
                    onChange={(e) =>
                      setValue((p) => ({
                        ...p,
                        theme: { ...p.theme, [f.key]: e.target.value },
                      }))
                    }
                    className="h-10 w-12 rounded border border-gray-200 bg-white"
                    aria-label={`${f.label} color picker`}
                  />
                  <input
                    type="text"
                    value={current ?? ''}
                    onChange={(e) =>
                      setValue((p) => ({
                        ...p,
                        theme: { ...p.theme, [f.key]: e.target.value },
                      }))
                    }
                    placeholder={f.fallback}
                    className={inputClass}
                  />
                </div>
                {!f.required ? <p className="text-xs text-gray-500 mt-1">Volitelné</p> : null}
              </div>
            );
          })}
        </div>
      </section>

      <div className="h-20" />

      <StickyActionBar
        left={
          lastSavedAt ? (
            <>
              Naposledy uloženo <time dateTime={lastSavedAt.toISOString()}>{formatSavedAt(lastSavedAt)}</time>
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
              onClick={onDiscard}
              disabled={!isDirty || saving}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zrušit rozpracované
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!isDirty || saving}
              className="px-4 py-2 text-sm font-medium text-white rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? 'Ukládání…' : 'Uložit změny'}
            </button>
          </>
        }
      />
    </div>
  );
}


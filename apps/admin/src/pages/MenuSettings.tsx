import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPut } from '../lib/api';
import { mergeContentEntriesMap, storageKey as makeStorageKey } from '@nase-cms/shared';
import NavMenuSettingsEditor, { type AdminSiteSettings } from '../components/NavMenuSettingsEditor';
import ArchNavMenuSettingsEditor, { archNavSaveFieldKeys, isArchNavContentDirty, isArchNavEntryKey } from '../components/ArchNavMenuSettingsEditor';
import { PRIMARY_LANG, parseEnabledLangs } from '../lib/languages';
import { tenantHref } from '../lib/tenantPath';
import { getTenantTemplateId } from '../lib/tenantTemplateId';
import StickyActionBar from '../components/StickyActionBar';
import Toast from '../components/Toast';

interface ContentEntry {
  key: string;
  lang: string;
  value: string;
}

function entryKey(key: string, l: string) {
  return `${key}:${l}`;
}

function formatSavedAt(d: Date): string {
  return d.toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MenuSettings() {
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [baselineEntries, setBaselineEntries] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [contentTemplateId, setContentTemplateId] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<AdminSiteSettings | null>(null);
  const [baselineSiteSettings, setBaselineSiteSettings] = useState<AdminSiteSettings | null>(null);
  const [toast, setToast] = useState('');
  const [recentlySaved, setRecentlySaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [lang, setLang] = useState(PRIMARY_LANG);

  const isSectionEnabled = useCallback(
    (mainFieldKey: string) =>
      (entries[entryKey(makeStorageKey('main', mainFieldKey), PRIMARY_LANG)] ?? '').trim() !== 'hide',
    [entries]
  );

  const enabledLangs = useMemo(() => parseEnabledLangs(entries), [entries]);

  const isMonoMenuDirty = useMemo(() => {
    if (!siteSettings || !baselineSiteSettings) return false;
    return JSON.stringify(siteSettings) !== JSON.stringify(baselineSiteSettings);
  }, [siteSettings, baselineSiteSettings]);

  const isArchMenuDirty = useMemo(
    () => isArchNavContentDirty(entries, baselineEntries),
    [entries, baselineEntries]
  );

  const isArch = (contentTemplateId ?? '').trim() === 'arch';
  const isDirty = isArch ? isArchMenuDirty : isMonoMenuDirty;

  useEffect(() => {
    let c = false;
    void getTenantTemplateId().then((t) => {
      if (!c) setContentTemplateId(t);
    });
    return () => {
      c = true;
    };
  }, []);

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
        setBaselineEntries({ ...map });
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

  useEffect(() => {
    if (!enabledLangs.includes(lang)) {
      setLang(enabledLangs[0] ?? PRIMARY_LANG);
    }
  }, [enabledLangs, lang]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (isArch) {
        const navPayload: ContentEntry[] = [];
        const keys = archNavSaveFieldKeys();
        for (const fieldKey of keys) {
          const sk = makeStorageKey('main', fieldKey);
          for (const l of enabledLangs) {
            navPayload.push({
              key: sk,
              lang: l,
              value: entries[entryKey(sk, l)] ?? '',
            });
          }
        }
        await apiPut('/api/v1/admin/content', { entries: navPayload });
        setBaselineEntries((prev) => {
          const next = { ...prev };
          for (const e of navPayload) {
            next[entryKey(e.key, e.lang)] = e.value ?? '';
          }
          return next;
        });
      } else {
        if (!siteSettings) return;
        await apiPut('/api/v1/admin/site-settings', siteSettings);
        setBaselineSiteSettings(JSON.parse(JSON.stringify(siteSettings)) as AdminSiteSettings);
      }

      setLastSavedAt(new Date());
      setToast('Uloženo');
      setRecentlySaved(true);
      setTimeout(() => setRecentlySaved(false), 10_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (isArch) {
      setEntries((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(baselineEntries)) {
          if (isArchNavEntryKey(k)) next[k] = v;
        }
        return next;
      });
    } else {
      setSiteSettings(
        baselineSiteSettings ? (JSON.parse(JSON.stringify(baselineSiteSettings)) as AdminSiteSettings) : null
      );
    }
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
          Základní nastavení
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-gray-900 font-medium">Nastavení menu</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Nastavení menu</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            {isArch ? (
              <>
                Texty horního menu pro šablonu ARCH. Ukládají se spolu s úvodní stránkou (Domů) - po úpravě nezapomeňte
                uložit.
              </>
            ) : (
              <>
                Položky horního menu (jednostránková šablona). U cíle „část stránky“ se nabídne jen to, co máte na
                úvodní stránce zapnuté - po změně sekcí se sem případně vraťte, aby se nabídka aktualizovala.
              </>
            )}
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

      {isArch ? (
        <ArchNavMenuSettingsEditor
          entries={entries}
          setEntries={setEntries}
          lang={lang}
          setLang={setLang}
          enabledLangs={enabledLangs}
        />
      ) : siteSettings ? (
        <NavMenuSettingsEditor
          siteSettings={siteSettings}
          setSiteSettings={setSiteSettings}
          isSectionEnabled={isSectionEnabled}
        />
      ) : (
        <p className="text-sm text-gray-500">Nepodařilo se načíst nastavení webu.</p>
      )}

      {(isArch || siteSettings) ? (
        <StickyActionBar
          left={
            lastSavedAt ? (
              <>
                Naposledy uloženo <time dateTime={lastSavedAt.toISOString()}>{formatSavedAt(lastSavedAt)}</time>
                {recentlySaved ? (
                  <span className="ml-2 text-emerald-700 font-medium" aria-live="polite">
                    • Uloženo
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
                disabled={!isDirty || saving || (!isArch && !siteSettings)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
                  recentlySaved && !isDirty ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {saving ? 'Ukládání…' : recentlySaved && !isDirty ? 'Uloženo' : 'Uložit změny'}
              </button>
            </>
          }
        />
      ) : null}
    </div>
  );
}

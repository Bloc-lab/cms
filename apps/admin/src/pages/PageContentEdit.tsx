import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ApiRequestError, apiDelete, apiGet, apiPost, apiPut } from '../lib/api';
import { mergeContentEntriesMap, sitePagesConfig, storageKey } from '@nase-cms/shared';
import PageContentFields from '../components/PageContentFields';
import MediaPicker from '../components/MediaPicker';
import { dispatchBrandingRefresh } from '../lib/branding';
import { getSectionNavStructure, sectionAnchorId, type SectionNavNode } from '../lib/pageFieldSections';
import { parseEnabledLangs, parseShowTranslationBadges } from '../lib/languages';
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

type DraftGetResponse = {
  entries: ContentEntry[];
  siteSettings: AdminSiteSettings | null;
};

function formatSavedAt(d: Date): string {
  return d.toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function entryKey(key: string, l: string): string {
  return `${key}:${l}`;
}

export default function PageContentEdit() {
  const { pageId } = useParams<{ pageId: string }>();
  const pageDef = pageId ? sitePagesConfig[pageId] : undefined;

  const [entries, setEntries] = useState<Record<string, string>>({});
  const [baseline, setBaseline] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lang, setLang] = useState<string>('cs');
  const [mediaPickerKey, setMediaPickerKey] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveNotice, setSaveNotice] = useState<string>('');
  const [simpleView, setSimpleView] = useState<boolean>(false);
  const [toast, setToast] = useState('');
  const [recentlySaved, setRecentlySaved] = useState(false);
  const [siteSettings, setSiteSettings] = useState<AdminSiteSettings | null>(null);
  const [baselineSiteSettings, setBaselineSiteSettings] = useState<AdminSiteSettings | null>(null);
  const [autosaving, setAutosaving] = useState(false);
  const [autosaveError, setAutosaveError] = useState('');
  const [lastAutosavedAt, setLastAutosavedAt] = useState<Date | null>(null);
  const [hasServerDraft, setHasServerDraft] = useState(false);
  const [publicPreviewBusy, setPublicPreviewBusy] = useState(false);

  const entriesRef = useRef(entries);
  const siteSettingsRef = useRef(siteSettings);
  const userEditVersionRef = useRef(0);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);
  useEffect(() => {
    siteSettingsRef.current = siteSettings;
  }, [siteSettings]);

  const enabledLangs = parseEnabledLangs(entries);
  const showTranslationBadges = parseShowTranslationBadges(entries);

  const isContentDirty = useMemo(() => {
    if (!pageId || !pageDef) return false;
    for (const [fieldKey] of Object.entries(pageDef.fields)) {
      const sk = storageKey(pageId, fieldKey);
      for (const l of enabledLangs) {
        const k = entryKey(sk, l);
        if ((entries[k] ?? '') !== (baseline[k] ?? '')) return true;
      }
    }
    return false;
  }, [pageId, pageDef, entries, baseline, enabledLangs]);

  const isSiteSettingsDirty = useMemo(() => {
    if (pageId !== 'main') return false;
    if (!siteSettings || !baselineSiteSettings) return false;
    return JSON.stringify(siteSettings) !== JSON.stringify(baselineSiteSettings);
  }, [pageId, siteSettings, baselineSiteSettings]);

  const isDirty = isContentDirty || isSiteSettingsDirty;

  const buildPageDraftEntries = useCallback((): ContentEntry[] => {
    if (!pageId || !pageDef) return [];
    const langs = parseEnabledLangs(entriesRef.current);
    const out: ContentEntry[] = [];
    for (const fieldKey of Object.keys(pageDef.fields)) {
      const sk = storageKey(pageId, fieldKey);
      for (const l of langs) {
        out.push({ key: sk, lang: l, value: entriesRef.current[entryKey(sk, l)] ?? '' });
      }
    }
    return out;
  }, [pageId, pageDef]);

  const saveDraftToServer = useCallback(async () => {
    if (!pageId || !pageDef) return;
    const body: { entries: ContentEntry[]; siteSettings?: AdminSiteSettings } = {
      entries: buildPageDraftEntries(),
    };
    if (pageId === 'main' && siteSettingsRef.current) {
      body.siteSettings = siteSettingsRef.current;
    }
    await apiPut(`/api/v1/admin/content-drafts/${encodeURIComponent(pageId)}`, body);
  }, [pageId, pageDef, buildPageDraftEntries]);

  useEffect(() => {
    if (!pageDef || !pageId) return;
    let cancelled = false;
    userEditVersionRef.current = 0;
    (async () => {
      try {
        const data = await apiGet<{ entries: ContentEntry[]; tenantName?: string | null }>(
          '/api/v1/admin/content'
        );
        if (cancelled) return;
        const map = mergeContentEntriesMap(data.entries ?? []);
        setSimpleView(!parseShowTranslationBadges(map));

        const tenantName = (data.tenantName ?? '').trim();
        const langsForName = parseEnabledLangs(map);
        const siteNameMissing = !langsForName.some((l) => (map[entryKey('admin.siteName', l)] ?? '').trim());
        if (tenantName && siteNameMissing) {
          for (const l of langsForName) {
            map[entryKey('admin.siteName', l)] = tenantName;
          }
        }

        setBaseline({ ...map });
        setEntries({ ...map });
        setError('');
        setSaveNotice('');
        setAutosaveError('');
        setHasServerDraft(false);

        if (pageId === 'main') {
          try {
            const s = await apiGet<AdminSiteSettings>('/api/v1/admin/site-settings');
            if (!cancelled) {
              setSiteSettings(s);
              setBaselineSiteSettings(JSON.parse(JSON.stringify(s)) as AdminSiteSettings);
            }
          } catch {
            if (!cancelled) {
              setSiteSettings(null);
              setBaselineSiteSettings(null);
            }
          }
        } else {
          setSiteSettings(null);
          setBaselineSiteSettings(null);
        }

        let draft: DraftGetResponse = { entries: [], siteSettings: null };
        try {
          draft = await apiGet<DraftGetResponse>(
            `/api/v1/admin/content-drafts/${encodeURIComponent(pageId)}`
          );
        } catch {
          /* drafts API unavailable — continue without draft */
        }
        if (cancelled) return;

        const hasDraft =
          (draft.entries?.length ?? 0) > 0 || (pageId === 'main' && draft.siteSettings != null);
        setHasServerDraft(hasDraft);

        if (draft.entries?.length) {
          setEntries((prev) => {
            const next = { ...prev };
            for (const e of draft.entries) {
              next[entryKey(e.key, e.lang)] = e.value ?? '';
            }
            return next;
          });
        }
        if (pageId === 'main' && draft.siteSettings) {
          setSiteSettings(draft.siteSettings);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Chyba při načítání');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageDef, pageId]);

  useEffect(() => {
    if (loading || !isDirty || userEditVersionRef.current === 0) return;
    const id = window.setTimeout(() => {
      const autosaveVersion = userEditVersionRef.current;
      void (async () => {
        setAutosaving(true);
        setAutosaveError('');
        try {
          await saveDraftToServer();
          if (userEditVersionRef.current === autosaveVersion) {
            userEditVersionRef.current = 0;
          }
          setLastAutosavedAt(new Date());
          setHasServerDraft(true);
        } catch (e) {
          setAutosaveError(e instanceof Error ? e.message : 'Koncept se nepodařilo uložit');
        } finally {
          setAutosaving(false);
        }
      })();
    }, 750);
    return () => window.clearTimeout(id);
  }, [entries, siteSettings, isDirty, loading, saveDraftToServer]);

  if (!pageId || !pageDef) {
    return <Navigate to="/" replace />;
  }

  const setValue = (key: string, l: string, value: string) => {
    userEditVersionRef.current += 1;
    setEntries((prev) => ({ ...prev, [entryKey(key, l)]: value }));
  };

  const setSiteSettingsFromUser = (next: Parameters<typeof setSiteSettings>[0]) => {
    userEditVersionRef.current += 1;
    setSiteSettings(next);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setFieldErrors({});
    setSaveNotice('');
    try {
      const langs = parseEnabledLangs(entries);
      const nextFieldErrors: Record<string, string> = {};
      for (const [fieldKey, field] of Object.entries(pageDef.fields)) {
        if (!field.required) continue;
        const sk = storageKey(pageId, fieldKey);
        const filled = langs.some((l) => (entries[entryKey(sk, l)] ?? '').trim());
        if (!filled) {
          nextFieldErrors[sk] = 'Povinné pole';
        }
      }
      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
        setError('Zkontrolujte povinná pole.');
        return;
      }

      await saveDraftToServer();
      await apiPost<{ ok: boolean }>(`/api/v1/admin/content-drafts/${encodeURIComponent(pageId)}/publish`, {
        enabledLangs: langs,
      });

      setBaseline({ ...entries });
      if (pageId === 'main' && siteSettings) {
        setBaselineSiteSettings(JSON.parse(JSON.stringify(siteSettings)) as AdminSiteSettings);
      }
      setHasServerDraft(false);
      const now = new Date();
      setLastSavedAt(now);
      setSaveNotice('Publikováno');
      setToast('Změny jsou na webu');
      setRecentlySaved(true);
      setTimeout(() => setRecentlySaved(false), 10_000);
      dispatchBrandingRefresh();
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 400) {
        const body = err.body as { fieldErrors?: Record<string, string>; error?: string };
        if (body.fieldErrors && Object.keys(body.fieldErrors).length > 0) {
          setFieldErrors(body.fieldErrors);
        }
        setError(body.error ?? err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Chyba při ukládání');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (!isDirty && !hasServerDraft) return;
    setError('');
    setAutosaveError('');
    try {
      await apiDelete(`/api/v1/admin/content-drafts/${encodeURIComponent(pageId)}`);
      setEntries({ ...baseline });
      if (baselineSiteSettings) {
        setSiteSettings(JSON.parse(JSON.stringify(baselineSiteSettings)) as AdminSiteSettings);
      }
      setHasServerDraft(false);
      setSaveNotice('');
      setLastAutosavedAt(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Koncept se nepodařilo zrušit');
    }
  };

  const handleImageSelect = (key: string) => (item: { url: string | null; path: string }) => {
    const url =
      item.url ??
      (item.path ? `${import.meta.env.VITE_SUPABASE_URL ?? ''}/storage/v1/object/public/media/${item.path}` : '');
    setValue(key, lang, url ?? '');
    setMediaPickerKey(null);
  };

  const handleCopyWebPreviewLink = async () => {
    if (!pageId || !pageDef) return;
    setPublicPreviewBusy(true);
    try {
      const { token } = await apiPost<{ token: string; expiresAt: string; pageId: string }>(
        '/api/v1/admin/content-preview-token',
        { pageId }
      );
      const base = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.trim().replace(/\/$/, '') ?? '';
      const qs = new URLSearchParams({ previewToken: token, lang }).toString();
      const rel = pageDef.slug === '' ? `/?${qs}` : `/${pageDef.slug}?${qs}`;
      const url = base ? `${base}${rel}` : rel;
      await navigator.clipboard.writeText(url);
      setToast('Odkaz na náhled na webu zkopírován');
      setTimeout(() => setToast(''), 4000);
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Nepodařilo se vytvořit odkaz');
      setTimeout(() => setToast(''), 6000);
    } finally {
      setPublicPreviewBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 text-sm">Načítání…</div>
    );
  }

  const pathLabel = pageDef.slug === '' ? '/' : `/${pageDef.slug}`;
  const sectionNav = getSectionNavStructure(pageDef.fields);
  const canDiscard = isDirty || hasServerDraft;

  const scrollToSection = (sectionTitle: string) => {
    const id = sectionAnchorId(pageId, sectionTitle);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sectionNavClassName =
    'text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-700 opacity-70 transition-opacity duration-150 hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 rounded-sm';

  const sectionNavChildClassName = `${sectionNavClassName} text-[10px] tracking-[0.1em]`;

  const renderSectionNavNodes = (nodes: SectionNavNode[]) =>
    nodes.map((node, idx) =>
      node.type === 'single' ? (
        <button
          key={node.sectionTitle}
          type="button"
          onClick={() => scrollToSection(node.sectionTitle)}
          className={sectionNavClassName}
        >
          {node.sectionTitle.toUpperCase()}
        </button>
      ) : (
        <div key={`nav-group-${idx}`} className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => scrollToSection(node.primarySection)}
            className={sectionNavClassName}
          >
            {node.groupLabel.toUpperCase()}
          </button>
          {node.children.length > 0 ? (
            <div className="ml-0.5 mt-0.5 flex flex-col gap-1 border-l border-gray-300/80 pl-2.5">
              {node.children.map((c) => (
                <button
                  key={c.sectionTitle}
                  type="button"
                  onClick={() => scrollToSection(c.sectionTitle)}
                  className={sectionNavChildClassName}
                >
                  {c.navLabel.toUpperCase()}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )
    );

  return (
    <div>
      <Toast message={toast} show={toast.length > 0} onClose={() => setToast('')} />
      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:gap-4">
        {sectionNav.length > 0 ? (
          <>
            <nav
              className="flex flex-col gap-2 border-b border-gray-100 pb-4 lg:hidden"
              aria-label="Sekce na stránce"
            >
              {renderSectionNavNodes(sectionNav)}
            </nav>
            <nav
              className="sticky top-14 z-10 hidden w-[9.25rem] shrink-0 flex-col gap-1.5 self-start [backface-visibility:hidden] lg:flex"
              aria-label="Sekce na stránce"
            >
              {renderSectionNavNodes(sectionNav)}
            </nav>
          </>
        ) : null}

        <div className="flex min-w-0 flex-1 justify-center">
          <div className="w-full max-w-6xl">
            <nav className="mb-3 text-sm text-gray-500" aria-label="Drobečková navigace">
              <Link to="/" className="hover:text-gray-700">
                Stránky
              </Link>
              <span className="mx-2 text-gray-300">/</span>
              <span className="font-medium text-gray-900">{pageDef.label}</span>
            </nav>

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{pageDef.label}</h1>
                <p className="mt-1 font-mono text-sm text-gray-500">{pathLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <button
                  type="button"
                  onClick={() => setSimpleView((v) => !v)}
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  aria-pressed={simpleView}
                  title="Zjednoduší zobrazení formuláře (méně upozornění)"
                >
                  {simpleView ? 'Zobrazit upozornění' : 'Skrýt upozornění'}
                </button>
                <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5 shadow-sm">
                  {enabledLangs.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={`rounded px-3 py-1.5 text-sm font-medium ${
                        lang === l ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopyWebPreviewLink()}
                  disabled={publicPreviewBusy}
                  title={
                    (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.trim()
                      ? 'Zkopíruje URL veřejného webu s platným náhledovým tokenem'
                      : 'Nastavte VITE_PUBLIC_SITE_URL pro celou URL (jinak zkopíruje jen cestu s parametry)'
                  }
                  className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {publicPreviewBusy ? 'Odkaz…' : 'Odkaz náhledu na web'}
                </button>
                <Link
                  to="/"
                  className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Zpět na seznam
                </Link>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Ukládání…' : 'Uložit'}
                </button>
              </div>
            </div>

            {error ? (
              <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}
            {autosaveError ? (
              <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {autosaveError}
              </div>
            ) : null}

            <div className="space-y-5">
              <PageContentFields
                pageId={pageId}
                fields={pageDef.fields}
                lang={lang}
                enabledLangs={enabledLangs}
                showFieldTranslationBadges={!simpleView && showTranslationBadges}
                entries={entries}
                fieldErrors={fieldErrors}
                entryKey={entryKey}
                setValue={setValue}
                setMediaPickerKey={setMediaPickerKey}
                siteSettings={siteSettings}
                setSiteSettings={setSiteSettingsFromUser}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-20" />

      <StickyActionBar
        left={
          <>
            {lastSavedAt ? (
              <span>
                Naposledy publikováno{' '}
                <time dateTime={lastSavedAt.toISOString()}>{formatSavedAt(lastSavedAt)}</time>
              </span>
            ) : (
              <span>Ještě jste nepublikovali</span>
            )}
            {autosaving ? (
              <span className="ml-2 text-gray-600">• Ukládám koncept…</span>
            ) : null}
            {lastAutosavedAt && isDirty ? (
              <span className="ml-2 text-gray-600">
                • Koncept uložen <time dateTime={lastAutosavedAt.toISOString()}>{formatSavedAt(lastAutosavedAt)}</time>
              </span>
            ) : null}
            {isDirty ? <span className="ml-2 text-amber-700">• Nepublikované změny</span> : null}
            {saveNotice ? (
              <span className="ml-2 font-medium text-emerald-700" aria-live="polite">
                • {saveNotice}
              </span>
            ) : null}
          </>
        }
        right={
          <>
            <Link
              to="/"
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Zpět na seznam
            </Link>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={!canDiscard || saving}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Zrušit rozpracované
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                recentlySaved && !isDirty ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? 'Ukládání…' : recentlySaved && !isDirty ? 'Publikováno' : 'Publikovat změny'}
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

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSitePagesForTemplate } from '@nase-cms/shared';
import { tenantHref } from '../lib/tenantPath';
import { getTenantTemplateId } from '../lib/tenantTemplateId';

const PAGE_SIZE = 5;

/** Řádky tabulky = stránky z konfigurace (sitePagesConfig), ne z databáze. */
export interface ConfigPageRow {
  pageId: string;
  label: string;
  slug: string;
  pathLabel: string;
}

function formatPath(slug: string): string {
  if (slug === '') return '/';
  return `/${slug}`;
}

function statusAccent(): string {
  return 'bg-blue-600';
}

export default function SitePages() {
  const [templateId, setTemplateId] = useState<string | null>(null);
  useEffect(() => {
    let c = false;
    void getTenantTemplateId().then((t) => {
      if (!c) setTemplateId(t);
    });
    return () => {
      c = true;
    };
  }, []);

  const pages = useMemo<ConfigPageRow[]>(() => {
    const cfg = getSitePagesForTemplate(templateId ?? 'template1');
    return Object.entries(cfg).map(([pageId, def]) => ({
      pageId,
      label: def.label,
      slug: def.slug,
      pathLabel: formatPath(def.slug),
    }));
  }, [templateId]);

  if (templateId === null) {
    return (
      <div className="mx-auto w-full max-w-6xl flex items-center justify-center py-24 text-gray-500 text-sm">
        Načítání…
      </div>
    );
  }

  const [pageIndex, setPageIndex] = useState(0);

  const total = pages.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
  const safeIndex = Math.min(pageIndex, Math.max(0, pageCount - 1));

  const slice = useMemo(() => {
    const start = safeIndex * PAGE_SIZE;
    return pages.slice(start, start + PAGE_SIZE);
  }, [pages, safeIndex]);

  const showingFrom = total === 0 ? 0 : safeIndex * PAGE_SIZE + 1;
  const showingTo = Math.min(total, (safeIndex + 1) * PAGE_SIZE);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <nav className="text-sm text-gray-500 mb-3" aria-label="Drobečková navigace">
        <span className="text-gray-900 font-medium">Stránky webu</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Stránky webu</h1>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 mt-2">
            Podle konfigurace · {total} {total === 1 ? 'stránka' : total < 5 ? 'stránky' : 'stránek'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600 shrink-0">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" aria-hidden />
          Synchronizace aktivní
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/90 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                <th className="pl-4 pr-3 py-3 w-10" />
                <th className="px-3 py-3">Název stránky</th>
                <th className="px-3 py-3 whitespace-nowrap">Cesta (slug)</th>
                <th className="px-4 py-3 text-right w-36">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {slice.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                    V konfiguraci nejsou žádné stránky.
                  </td>
                </tr>
              ) : (
                slice.map((p) => (
                  <tr key={p.pageId} className="hover:bg-gray-50/80">
                    <td className="pl-4 pr-0 py-4 align-middle w-10">
                      <span
                        className={`inline-block w-1 self-stretch min-h-[40px] rounded-full ${statusAccent()}`}
                        aria-hidden
                      />
                    </td>
                    <td className="px-3 py-4 font-medium text-gray-900">{p.label}</td>
                    <td className="px-3 py-4 text-gray-600 font-mono text-xs">{p.pathLabel}</td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        to={tenantHref(`/page/${encodeURIComponent(p.pageId)}`)}
                        className="inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                      >
                        Upravit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
            <p className="font-medium uppercase tracking-wide">
              Zobrazeno {showingFrom}–{showingTo} z {total}{' '}
              {total === 1 ? 'stránky' : 'stránek'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeIndex <= 0}
                onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                className="px-3 py-1.5 font-semibold uppercase tracking-wide rounded disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 hover:text-gray-900"
              >
                Předchozí
              </button>
              <button
                type="button"
                disabled={safeIndex >= pageCount - 1}
                onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
                className="px-3 py-1.5 font-semibold uppercase tracking-wide rounded text-blue-600 hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Další stránka
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

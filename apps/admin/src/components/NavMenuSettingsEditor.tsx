import { useMemo, type Dispatch, type SetStateAction } from 'react';

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

const selectClass =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

/** Stejný tvar jako v Nastavení kontaktu / editaci stránky - editor mění hlavně položky menu. */
export type AdminSiteSettings = {
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

type Props = {
  siteSettings: AdminSiteSettings;
  setSiteSettings: Dispatch<SetStateAction<AdminSiteSettings | null>>;
  /** Zapnutí domovské sekce podle přepínače na stránce Domů (výchozí jazyk). */
  isSectionEnabled: (mainFieldKey: string) => boolean;
};

export default function NavMenuSettingsEditor({ siteSettings, setSiteSettings, isSectionEnabled }: Props) {
  const updateSiteSettings = (fn: (prev: AdminSiteSettings) => AdminSiteSettings) => {
    setSiteSettings((prev) => {
      if (!prev) return prev;
      return fn(prev);
    });
  };

  const navItems = (siteSettings.nav?.items ?? []).slice(0, 8);

  const navAvailableSections = useMemo(() => {
    const out: Array<{ id: 'services' | 'pricing' | 'tax' | 'contact'; label: string }> = [];
    if (isSectionEnabled('services.enabled')) out.push({ id: 'services', label: 'Služby' });
    if (isSectionEnabled('pricing.enabled')) out.push({ id: 'pricing', label: 'Ceník' });
    if (isSectionEnabled('tax.enabled')) out.push({ id: 'tax', label: 'Daňové poradenství' });
    if (isSectionEnabled('cta.enabled')) out.push({ id: 'contact', label: 'Kontakt (CTA)' });
    return out;
  }, [isSectionEnabled]);

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Menu (navigace)</p>
      <p className="text-sm text-gray-700 mt-1">
        Položky menu se ukládají do nastavení webu. Položky, které míří na skryté sekce, se na webu automaticky
        nezobrazí.
      </p>

      <div className="mt-4 space-y-3">
        {navItems.length === 0 ? <p className="text-sm text-gray-500">Zatím žádné položky.</p> : null}

        {navItems.map((item, idx) => {
          const kind = item.kind;
          return (
            <div key={`${kind}-${idx}`} className="rounded-md border border-gray-200 bg-gray-50/60 p-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Typ
                  </label>
                  <select
                    className={selectClass}
                    value={kind}
                    onChange={(e) => {
                      const nextKind = e.target.value === 'route' ? 'route' : 'section';
                      updateSiteSettings((prev) => {
                        const items = [...(prev.nav?.items ?? [])];
                        items[idx] =
                          nextKind === 'section'
                            ? {
                                kind: 'section',
                                section: navAvailableSections[0]?.id ?? 'services',
                                label: item.label,
                              }
                            : { kind: 'route', href: '/', label: item.label };
                        return { ...prev, nav: { ...(prev.nav ?? {}), items } };
                      });
                    }}
                  >
                    <option value="section">Část úvodní stránky</option>
                    <option value="route">Jiná stránka nebo odkaz</option>
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Cíl
                  </label>
                  {kind === 'section' ? (
                    <select
                      className={selectClass}
                      value={item.section}
                      onChange={(e) => {
                        const section = e.target.value as 'services' | 'pricing' | 'tax' | 'contact';
                        updateSiteSettings((prev) => {
                          const items = [...(prev.nav?.items ?? [])];
                          items[idx] = { ...(items[idx] ?? {}), kind: 'section', section };
                          return { ...prev, nav: { ...(prev.nav ?? {}), items } };
                        });
                      }}
                    >
                      {navAvailableSections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={inputClass}
                      value={(item as { href?: string }).href ?? ''}
                      onChange={(e) =>
                        updateSiteSettings((prev) => {
                          const items = [...(prev.nav?.items ?? [])];
                          items[idx] = { ...(items[idx] ?? {}), kind: 'route', href: e.target.value };
                          return { ...prev, nav: { ...(prev.nav ?? {}), items } };
                        })
                      }
                      placeholder="Např. /o-nas nebo /#kontakt"
                    />
                  )}
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Text v menu
                  </label>
                  <input
                    className={inputClass}
                    value={item.label ?? ''}
                    onChange={(e) =>
                      updateSiteSettings((prev) => {
                        const items = [...(prev.nav?.items ?? [])];
                        items[idx] = { ...(items[idx] ?? {}), label: e.target.value };
                        return { ...prev, nav: { ...(prev.nav ?? {}), items } };
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
                            const items = [...(prev.nav?.items ?? [])];
                            if (idx <= 0 || idx >= items.length) return prev;
                            const tmp = items[idx - 1];
                            items[idx - 1] = items[idx];
                            items[idx] = tmp;
                            return { ...prev, nav: { ...(prev.nav ?? {}), items } };
                          })
                        }
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="px-2 py-2 text-sm font-semibold border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                        disabled={idx >= navItems.length - 1}
                        title="Přesunout dolů"
                        onClick={() =>
                          updateSiteSettings((prev) => {
                            const items = [...(prev.nav?.items ?? [])];
                            if (idx < 0 || idx >= items.length - 1) return prev;
                            const tmp = items[idx + 1];
                            items[idx + 1] = items[idx];
                            items[idx] = tmp;
                            return { ...prev, nav: { ...(prev.nav ?? {}), items } };
                          })
                        }
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 rounded-md"
                      onClick={() =>
                        updateSiteSettings((prev) => {
                          const items = [...(prev.nav?.items ?? [])];
                          items.splice(idx, 1);
                          return { ...prev, nav: { ...(prev.nav ?? {}), items } };
                        })
                      }
                    >
                      Smazat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="px-3 py-2 text-sm font-semibold border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
          disabled={navItems.length >= navAvailableSections.length && navAvailableSections.length > 0}
          onClick={() =>
            updateSiteSettings((prev) => {
              const items = [...(prev.nav?.items ?? [])];
              const first = navAvailableSections[0]?.id ?? 'services';
              items.push({ kind: 'section', section: first, label: '' });
              return { ...prev, nav: { ...(prev.nav ?? {}), items } };
            })
          }
        >
          + Přidat položku na část stránky
        </button>
        <button
          type="button"
          className="px-3 py-2 text-sm font-semibold border border-gray-200 rounded-md bg-white hover:bg-gray-50"
          onClick={() =>
            updateSiteSettings((prev) => {
              const items = [...(prev.nav?.items ?? [])];
              items.push({ kind: 'route', href: '/', label: '' });
              return { ...prev, nav: { ...(prev.nav ?? {}), items } };
            })
          }
        >
          + Přidat položku s vlastním odkazem
        </button>
      </div>
    </div>
  );
}

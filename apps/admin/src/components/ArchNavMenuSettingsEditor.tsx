import { useMemo } from 'react';
import {
  CMS_TEMPLATE_ARCH,
  getDefaultContentConfigForTemplate,
  storageKey as makeStorageKey,
  type ContentField,
} from '@nase-cms/shared';
import type { Dispatch, SetStateAction } from 'react';
import { PRIMARY_LANG } from '../lib/languages';

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

const MAIN = 'main';

/** Row order, in-menu flag, and short “where it goes” hint (site pages only; no Home scroll anchors). */
export const ARCH_NAV_MENU_ROWS = [
  {
    labelKey: 'nav.about',
    menuKey: 'nav.menuAbout',
    where: 'Stránka O nás (/o-nás) - ze seznamu Stránky.',
  },
  {
    labelKey: 'nav.pricing',
    menuKey: 'nav.menuPricing',
    where: 'Stránka Ceník (/cenik).',
  },
  {
    labelKey: 'nav.contact',
    menuKey: 'nav.menuContact',
    where: 'Stránka Kontakt (/kontakt).',
  },
] as const;

export function archNavSaveFieldKeys(): string[] {
  return ARCH_NAV_MENU_ROWS.flatMap((r) => [r.menuKey, r.labelKey]);
}

function entryKey(storageKey: string, l: string) {
  return `${storageKey}:${l}`;
}

type Props = {
  entries: Record<string, string>;
  setEntries: Dispatch<SetStateAction<Record<string, string>>>;
  lang: string;
  setLang: (l: string) => void;
  enabledLangs: string[];
};

export default function ArchNavMenuSettingsEditor({
  entries,
  setEntries,
  lang,
  setLang,
  enabledLangs,
}: Props) {
  const cfg = useMemo(() => getDefaultContentConfigForTemplate(CMS_TEMPLATE_ARCH), []);

  const setValue = (storageKey: string, l: string, value: string) => {
    setEntries((prev) => ({ ...prev, [entryKey(storageKey, l)]: value }));
  };

  const setMenuAllLangs = (menuSk: string, value: string) => {
    setEntries((prev) => {
      const next = { ...prev };
      for (const l of enabledLangs) {
        next[entryKey(menuSk, l)] = value;
      }
      return next;
    });
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Menu (navigace)</p>
      <p className="text-sm text-gray-700 mt-1">
        Úpravy textů a viditelnosti položek horního menu (šablona ARCH) - jen odkazy na stránky O nás, Ceník a
        Kontakt. Uloží se do obsahu stránky Domů. Přepínač „Skrýt“ se při ukládání synchronizuje do všech zapnutých
        jazyků.
      </p>

      {enabledLangs.length > 1 ? (
        <div className="mt-4 inline-flex rounded-md border border-gray-200 bg-white p-0.5 shadow-sm">
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
      ) : null}

      <div className="mt-4 space-y-2">
        {ARCH_NAV_MENU_ROWS.map(({ labelKey, menuKey, where }) => {
          const labelSk = makeStorageKey(MAIN, labelKey);
          const menuSk = makeStorageKey(MAIN, menuKey);
          const labelField = cfg[labelSk] as ContentField | undefined;
          const menuField = cfg[menuSk] as ContentField | undefined;
          const labelValue = entries[entryKey(labelSk, lang)] ?? '';
          const menuValRaw = entries[entryKey(menuSk, PRIMARY_LANG)] ?? entries[entryKey(menuSk, lang)] ?? '1';
          const menuVal = menuValRaw.trim() === '0' ? '0' : '1';

          if (!labelField || !menuField || menuField.type !== 'choice' || !menuField.choices?.length) {
            return null;
          }

          return (
            <div
              key={labelKey}
              className="rounded-md border border-gray-200 bg-gray-50/60 p-2.5 sm:flex sm:items-start sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-gray-600 leading-snug mb-2">{where}</p>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  {labelField.label}
                </label>
                {labelField.helpText ? (
                  <p className="text-[11px] text-gray-600 mb-1.5 leading-snug">{labelField.helpText}</p>
                ) : null}
                <input
                  type="text"
                  className={inputClass}
                  value={labelValue}
                  onChange={(e) => setValue(labelSk, lang, e.target.value)}
                  placeholder={labelField.placeholder}
                  maxLength={labelField.maxLength}
                />
                {labelField.recommendedMaxLength ? (
                  <p className="text-[11px] text-gray-500 mt-1">Doporučeno max. {labelField.recommendedMaxLength} znaků</p>
                ) : null}
              </div>

              <div className="mt-3 shrink-0 border-t border-gray-200/90 pt-3 sm:mt-0 sm:w-40 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Zobrazení</p>
                <p className="text-[10px] text-gray-600 mb-2 leading-snug">
                  „Skrýt“ schová název položky v horním menu na webu. Text si můžete v levé části upravit kdykoli;
                  na webu se po skrytí prostě neukáže.
                </p>
                <div className="flex flex-col gap-1.5">
                  {menuField.choices.map((opt) => {
                    const selected = menuVal === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMenuAllLangs(menuSk, opt.value)}
                        className={`rounded-md border px-3 py-1.5 text-center text-xs font-medium transition ${
                          selected
                            ? opt.value === '0'
                              ? 'border-red-600 bg-red-50 text-red-900 shadow-sm'
                              : 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ARCH_NAV_STORAGE_PREFIX = 'main:nav.';

export function isArchNavEntryKey(fullKey: string): boolean {
  const idx = fullKey.lastIndexOf(':');
  const base = idx >= 0 ? fullKey.slice(0, idx) : fullKey;
  return base.startsWith(ARCH_NAV_STORAGE_PREFIX);
}

export function isArchNavContentDirty(
  entries: Record<string, string>,
  baseline: Record<string, string>
): boolean {
  const keys = new Set<string>();
  for (const k of Object.keys(entries)) {
    if (isArchNavEntryKey(k)) keys.add(k);
  }
  for (const k of Object.keys(baseline)) {
    if (isArchNavEntryKey(k)) keys.add(k);
  }
  for (const k of keys) {
    if ((entries[k] ?? '') !== (baseline[k] ?? '')) return true;
  }
  return false;
}

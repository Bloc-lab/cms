import { ADMIN_ENABLED_LANGS_KEY, ADMIN_SHOW_TRANSLATION_BADGES_KEY } from '@nase-cms/shared';

export const PRIMARY_LANG = 'cs';

export const AVAILABLE_LANGS: Array<{ code: string; label: string }> = [
  { code: 'cs', label: 'Čeština (CZ)' },
  { code: 'en', label: 'English (EN)' },
  { code: 'de', label: 'Deutsch (DE)' },
  { code: 'sk', label: 'Slovenčina (SK)' },
  { code: 'pl', label: 'Polski (PL)' },
  { code: 'fr', label: 'Français (FR)' },
  { code: 'it', label: 'Italiano (IT)' },
  { code: 'es', label: 'Español (ES)' },
];

function normalizeLangs(langs: string[]): string[] {
  const set = new Set(langs.map((l) => l.trim().toLowerCase()).filter(Boolean));
  set.add(PRIMARY_LANG);
  const knownOrder = AVAILABLE_LANGS.map((l) => l.code);
  const known = knownOrder.filter((l) => set.has(l));
  const unknown = [...set].filter((l) => !knownOrder.includes(l)).sort();
  return [...known, ...unknown];
}

export function parseEnabledLangs(entriesMap: Record<string, string>): string[] {
  const raw =
    entriesMap[`${ADMIN_ENABLED_LANGS_KEY}:${PRIMARY_LANG}`] ??
    entriesMap[`${ADMIN_ENABLED_LANGS_KEY}:en`] ??
    '';
  const langs = raw
    .split(/[,\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (langs.length === 0) return [PRIMARY_LANG, 'en'];
  return normalizeLangs(langs);
}

export function setEnabledLangsValue(langs: string[]): string {
  return normalizeLangs(langs).join(',');
}

export function parseShowTranslationBadges(entriesMap: Record<string, string>): boolean {
  const raw =
    entriesMap[`${ADMIN_SHOW_TRANSLATION_BADGES_KEY}:${PRIMARY_LANG}`] ??
    entriesMap[`${ADMIN_SHOW_TRANSLATION_BADGES_KEY}:en`] ??
    '';
  const v = raw.trim().toLowerCase();
  if (v === '') return true;
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

export function setShowTranslationBadgesValue(show: boolean): string {
  return show ? '1' : '0';
}


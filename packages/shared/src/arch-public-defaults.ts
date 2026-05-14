/**
 * Výchozí texty šablony ARCH - klíče odpovídají úložišti (`main:hero.title`, …).
 */
import { ARCH_FLAT_CS } from './arch-flat-cs.js';
import { ARCH_FLAT_EN } from './arch-flat-en.js';
import { storageKey } from './site-pages.js';

export function archFlatPublicKeyToStorageKey(pubKey: string): string {
  if (pubKey.startsWith('admin.')) return pubKey;
  if (pubKey.startsWith('pricingPage.')) {
    return storageKey('pricingPage', pubKey.slice('pricingPage.'.length));
  }
  if (pubKey.startsWith('contactPage.')) {
    return storageKey('contactPage', pubKey.slice('contactPage.'.length));
  }
  if (pubKey.startsWith('about.')) {
    return storageKey('about', pubKey);
  }
  return storageKey('main', pubKey);
}

function flatPublicToSeedMap(flat: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(flat)) {
    out[archFlatPublicKeyToStorageKey(k)] = v;
  }
  return out;
}

export const ARCH_SEED_DEFAULTS_CS = flatPublicToSeedMap(ARCH_FLAT_CS);
export const ARCH_SEED_DEFAULTS_EN = flatPublicToSeedMap(ARCH_FLAT_EN);

export function resolveArchSeedValue(fullKey: string, seedMap: Record<string, string>): string {
  if (Object.prototype.hasOwnProperty.call(seedMap, fullKey)) {
    return seedMap[fullKey] ?? '';
  }
  return '';
}

export function resolveArchSeedValueByLang(fullKey: string, lang: string): string {
  const l = (lang || '').trim().toLowerCase();
  const map = l === 'en' ? ARCH_SEED_DEFAULTS_EN : ARCH_SEED_DEFAULTS_CS;
  return resolveArchSeedValue(fullKey, map);
}

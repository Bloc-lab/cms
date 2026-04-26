import { defaultConfig, resolveRedusSeedValue } from '@nase-cms/shared';

export type SeedPreset = 'lorem' | 'redus';

function isUrlLike(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function loremSentence(maxLen: number | undefined): string {
  const base =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
  if (!maxLen) return base;
  return base.length <= maxLen ? base : base.slice(0, Math.max(0, maxLen - 1)).trimEnd();
}

function loremShort(maxLen: number | undefined): string {
  const base = 'Lorem ipsum';
  if (!maxLen) return base;
  return base.length <= maxLen ? base : base.slice(0, Math.max(0, maxLen - 1)).trimEnd();
}

function loremBullets(maxLen: number | undefined): string {
  const base = ['Lorem ipsum dolor', 'Sit amet consectetur', 'Adipiscing elit'].join('\n');
  if (!maxLen) return base;
  return base.length <= maxLen ? base : base.slice(0, Math.max(0, maxLen - 1)).trimEnd();
}

function presetValueForKey(key: string, field: (typeof defaultConfig)[string]): string {
  // If it's a choice field, pick first choice value (stable)
  if (field.type === 'choice' && field.choices?.length) {
    return field.choices[0]?.value ?? '';
  }

  const k = key.toLowerCase();

  // common toggles
  if (k.endsWith('.enabled')) return 'show';

  // admin/cms internals (keep defaults)
  if (key === 'admin.enabledLangs') return 'cs,en,it';
  if (key === 'admin.showTranslationBadges') return '1';

  // contact-ish
  if (k.includes('contact.email')) return 'info@example.com';
  if (k.includes('contact.phone')) return '+420 777 000 000';
  if (k.includes('contact.address')) return 'Loremova 1, Praha';

  // URLs / hrefs
  if (k.includes('href') || k.includes('url')) return 'https://example.com';

  // image fields
  if (field.type === 'image') {
    // keep empty if placeholder is URL-like already; otherwise use a stable placeholder image
    const p = field.placeholder?.trim() ?? '';
    if (p && isUrlLike(p)) return p;
    return 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80';
  }

  // textareas vs short text
  const maxLen = field.maxLength;
  if (field.type === 'textarea') {
    // For bullet-like fields, give multiline
    if (k.includes('features')) return loremBullets(maxLen);
    return loremSentence(maxLen);
  }

  // default short text
  return loremShort(maxLen);
}

export function resolveSeedValue(preset: SeedPreset, key: string): string {
  if (preset === 'redus') return resolveRedusSeedValue(key);
  const field = defaultConfig[key];
  if (!field) return '';
  return presetValueForKey(key, field);
}


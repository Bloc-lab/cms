import { legacyContentKeyToStorageKey, toPublicContentKey } from '@nase-cms/shared';

/**
 * Maps DB content rows for one language to the public JSON shape used by GET /api/v1/content.
 */
export function rowsToPublicContentMap(rows: Array<{ key: string; value: string | null }>): Record<string, string> {
  const sorted = [...rows].sort((a, b) => {
    const aNew = !a.key.startsWith('admin.') && a.key.includes(':');
    const bNew = !b.key.startsWith('admin.') && b.key.includes(':');
    if (aNew && !bNew) return 1;
    if (!aNew && bNew) return -1;
    return 0;
  });

  const response: Record<string, string> = {};
  for (const e of sorted) {
    const raw = e.key;
    if (raw.startsWith('admin.')) {
      response[raw] = e.value ?? '';
      continue;
    }
    const normalized = legacyContentKeyToStorageKey(raw);
    const publicKey = toPublicContentKey(normalized);
    response[publicKey] = e.value ?? '';
  }
  return response;
}

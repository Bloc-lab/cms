import { storageKey as makeStorageKey, type ContentConfig, type ContentField } from '@nase-cms/shared';

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

function fieldLabel(field: ContentField | undefined, key: string): string {
  const base = field?.label ?? key;
  return field?.required ? `${base} *` : base;
}

interface Props {
  pageId: string;
  fields: ContentConfig;
  lang: 'cs' | 'en';
  entries: Record<string, string>;
  entryKey: (storageKey: string, l: string) => string;
  setValue: (storageKey: string, l: string, value: string) => void;
  setMediaPickerKey: (fullStorageKey: string | null) => void;
}

export default function PageContentFields({
  pageId,
  fields,
  lang,
  entries,
  entryKey,
  setValue,
  setMediaPickerKey,
}: Props) {
  const getValue = (fieldKey: string, l: string) => entries[entryKey(makeStorageKey(pageId, fieldKey), l)] ?? '';

  return (
    <>
      {Object.entries(fields).map(([fieldKey, field]) => {
        const fieldType = field?.type ?? 'text';
        const sk = makeStorageKey(pageId, fieldKey);
        const value = getValue(fieldKey, lang);
        const label = fieldLabel(field, fieldKey);

        if (fieldType === 'textarea') {
          return (
            <div key={fieldKey}>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                {label}
              </label>
              <textarea
                value={value}
                onChange={(e) => setValue(sk, lang, e.target.value)}
                rows={4}
                className={inputClass}
              />
            </div>
          );
        }

        if (fieldType === 'image') {
          return (
            <div key={fieldKey}>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                {label}
              </label>
              <div className="flex flex-wrap items-start gap-4">
                <div className="shrink-0">
                  {value ? (
                    <img
                      src={value}
                      alt=""
                      className="h-24 w-36 object-cover rounded-md border border-gray-200"
                    />
                  ) : (
                    <div className="h-24 w-36 rounded-md border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                      Bez obrázku
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMediaPickerKey(sk)}
                      className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      Vybrat z knihovny
                    </button>
                    {value && (
                      <button
                        type="button"
                        onClick={() => setValue(sk, lang, '')}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
                      >
                        Odstranit
                      </button>
                    )}
                  </div>
                  {value && (
                    <p className="text-xs text-gray-500 truncate max-w-md" title={value}>
                      {value}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={fieldKey}>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              {label}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(sk, lang, e.target.value)}
              className={`${inputClass} max-w-xl`}
            />
          </div>
        );
      })}
    </>
  );
}

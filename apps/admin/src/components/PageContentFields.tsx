import { storageKey as makeStorageKey, type ContentConfig, type ContentField } from '@nase-cms/shared';
import { PRIMARY_LANG } from '../lib/languages';

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

function fieldLabel(field: ContentField | undefined, key: string): string {
  const base = field?.label ?? key;
  return field?.required ? `${base} *` : base;
}

interface Props {
  pageId: string;
  fields: ContentConfig;
  lang: string;
  enabledLangs: string[];
  showFieldTranslationBadges?: boolean;
  entries: Record<string, string>;
  fieldErrors?: Record<string, string>;
  entryKey: (storageKey: string, l: string) => string;
  setValue: (storageKey: string, l: string, value: string) => void;
  setMediaPickerKey: (fullStorageKey: string | null) => void;
}

export default function PageContentFields({
  pageId,
  fields,
  lang,
  enabledLangs,
  showFieldTranslationBadges,
  entries,
  fieldErrors,
  entryKey,
  setValue,
  setMediaPickerKey,
}: Props) {
  const getValue = (fieldKey: string, l: string) =>
    entries[entryKey(makeStorageKey(pageId, fieldKey), l)] ?? '';

  const bySection = new Map<string, Array<[string, ContentField]>>();
  for (const [fieldKey, field] of Object.entries(fields)) {
    const section = field.section?.trim() || (field.advanced ? 'Pokročilé' : 'Obsah');
    const arr = bySection.get(section) ?? [];
    arr.push([fieldKey, field]);
    bySection.set(section, arr);
  }

  const sections = [...bySection.entries()];

  return (
    <>
      {sections.map(([sectionTitle, sectionFields]) => {
        const missingTranslations = sectionFields.reduce((acc, [fieldKey]) => {
          for (const l of enabledLangs) {
            if (l === PRIMARY_LANG) continue;
            if ((getValue(fieldKey, l) ?? '').trim().length === 0) acc += 1;
          }
          return acc;
        }, 0);

        return (
          <section
            key={sectionTitle}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">{sectionTitle}</h2>
              {missingTranslations > 0 ? (
                <span className="text-[11px] font-semibold uppercase tracking-wide rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5">
                  Chybí jiná jazyková verze: {missingTranslations}
                </span>
              ) : (
                <span className="text-[11px] font-semibold uppercase tracking-wide rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5">
                  Přeloženo
                </span>
              )}
            </div>
            <div className="p-5 space-y-5">
              {sectionFields.map(([fieldKey, field]) => {
                const fieldType = field?.type ?? 'text';
                const sk = makeStorageKey(pageId, fieldKey);
                const value = getValue(fieldKey, lang);
                const label = fieldLabel(field, fieldKey);
                const help = field.helpText?.trim();
                const error = fieldErrors?.[sk]?.trim();

                const primaryValue = getValue(fieldKey, PRIMARY_LANG);
                const currentValue = getValue(fieldKey, lang);
                const missingSomeTranslation = enabledLangs.some((l) => {
                  if (l === PRIMARY_LANG) return false;
                  return (getValue(fieldKey, l) ?? '').trim().length === 0;
                });
                const canCopyFromPrimaryToCurrent =
                  lang !== PRIMARY_LANG &&
                  (currentValue ?? '').trim().length === 0 &&
                  (primaryValue ?? '').trim().length > 0;

                const labelSuffix =
                  showFieldTranslationBadges !== false &&
                  fieldType !== 'image' &&
                  missingSomeTranslation ? (
                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 border border-amber-200">
                      Chybí jiná jazyková verze
                    </span>
                  ) : null;

                if (fieldType === 'textarea') {
                  return (
                    <div key={fieldKey}>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                        {label}
                        {labelSuffix}
                      </label>
                      {help ? <p className="text-xs text-gray-500 mb-2">{help}</p> : null}
                      <textarea
                        value={value}
                        onChange={(e) => setValue(sk, lang, e.target.value)}
                        rows={4}
                        placeholder={field.placeholder}
                        maxLength={field.maxLength}
                        className={`${inputClass} ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                      />
                      {error ? <p className="text-xs text-red-700 mt-1">{error}</p> : null}
                      {field.recommendedMaxLength ? (
                        <p className="text-xs text-gray-500 mt-1">
                          Doporučeno max. {field.recommendedMaxLength} znaků
                        </p>
                      ) : null}
                      {canCopyFromPrimaryToCurrent ? (
                        <button
                          type="button"
                          onClick={() => setValue(sk, lang, primaryValue)}
                          className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Zkopírovat z {PRIMARY_LANG.toUpperCase()}
                        </button>
                      ) : null}
                    </div>
                  );
                }

                if (fieldType === 'image') {
                  return (
                    <div key={fieldKey}>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                        {label}
                        {labelSuffix}
                      </label>
                      {help ? <p className="text-xs text-gray-500 mb-2">{help}</p> : null}
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
                            {canCopyFromPrimaryToCurrent ? (
                              <button
                                type="button"
                                onClick={() => setValue(sk, lang, primaryValue)}
                                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
                              >
                                Zkopírovat z {PRIMARY_LANG.toUpperCase()}
                              </button>
                            ) : null}
                          </div>
                          {value && (
                            <p className="text-xs text-gray-500 truncate max-w-md" title={value}>
                              {value}
                            </p>
                          )}
                          {error ? <p className="text-xs text-red-700">{error}</p> : null}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={fieldKey}>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                      {label}
                      {labelSuffix}
                    </label>
                    {help ? <p className="text-xs text-gray-500 mb-2">{help}</p> : null}
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setValue(sk, lang, e.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      className={`${inputClass} max-w-xl ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    />
                    {error ? <p className="text-xs text-red-700 mt-1">{error}</p> : null}
                    {field.recommendedMaxLength ? (
                      <p className="text-xs text-gray-500 mt-1">
                        Doporučeno max. {field.recommendedMaxLength} znaků
                      </p>
                    ) : null}
                    {canCopyFromPrimaryToCurrent ? (
                      <button
                        type="button"
                        onClick={() => setValue(sk, lang, primaryValue)}
                        className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Zkopírovat z {PRIMARY_LANG.toUpperCase()}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}

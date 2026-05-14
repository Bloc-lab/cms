/**
 * Content config shared across CMS apps.
 */

export interface ContentField {
  label: string;
  type?: 'text' | 'textarea' | 'image' | 'choice';
  /**
   * For toggles: internal value and label shown to visitors for each option.
   */
  choices?: Array<{ value: string; label: string }>;
  /** If true, at least one language must have a non-empty value (admin validates on save). */
  required?: boolean;
  /**
   * Short hint for editors; shown in the admin UI under the field name.
   */
  helpText?: string;
  /** Placeholder for input/textarea in the admin UI. */
  placeholder?: string;
  /** Recommended text length (admin warning only). */
  recommendedMaxLength?: number;
  /** Maximum text length in the admin UI (including spaces). */
  maxLength?: number;
  /**
   * Section title in the page editor (e.g. Hero, Services, SEO, Advanced).
   * If omitted, the admin places the field in the default section.
   */
  section?: string;
  /** Moves the field into the "Advanced" area (or shows a badge). */
  advanced?: boolean;
}

export type ContentConfig = Record<string, ContentField>;

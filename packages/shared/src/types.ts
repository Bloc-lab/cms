/**
 * Content config shared across CMS apps.
 */

export interface ContentField {
  label: string;
  type?: 'text' | 'textarea' | 'image';
  /** If true, at least one language must have a non-empty value (admin validates on save). */
  required?: boolean;
}

export type ContentConfig = Record<string, ContentField>;

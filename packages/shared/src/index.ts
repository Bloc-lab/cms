/**
 * Content config shared across CMS apps.
 * Defines named keys for content management - admin panel generates form from this,
 * frontend uses it for type-safe API response.
 */

export interface ContentField {
  label: string;
  type?: 'text' | 'textarea' | 'image';
}

export type ContentConfig = Record<string, ContentField>;

export const defaultConfig: ContentConfig = {
  'hero.title': { label: 'Hlavní nadpis' },
  'hero.subtitle': { label: 'Podnadpis' },
  'hero.image': { label: 'Hlavní obrázek', type: 'image' },
  'about.text': { label: 'O nás', type: 'textarea' },
  'services.title': { label: 'Služby - nadpis' },
  'services.desc': { label: 'Služby - popis', type: 'textarea' },
  'contact.phone': { label: 'Telefon' },
  'contact.email': { label: 'Email' },
  'contact.address': { label: 'Adresa' },
};

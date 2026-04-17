/**
 * Content config shared across CMS apps.
 */

export interface ContentField {
  label: string;
  type?: 'text' | 'textarea' | 'image' | 'choice';
  /**
   * Pro `type: 'choice'` — hodnoty ukládané do obsahu (např. `dual`, `single`).
   */
  choices?: Array<{ value: string; label: string }>;
  /** If true, at least one language must have a non-empty value (admin validates on save). */
  required?: boolean;
  /**
   * Krátká nápověda pro netechnické editory. Zobrazuje se pod labelem v administraci.
   * Nemá vliv na backend ani veřejné API.
   */
  helpText?: string;
  /** Placeholder pro input/textarea v administraci. */
  placeholder?: string;
  /** Doporučený limit délky (UI hint, nemusí být striktní). */
  recommendedMaxLength?: number;
  /** Striktní limit délky (UI omezení). */
  maxLength?: number;
  /**
   * Název sekce v editaci stránky (např. Hero, Služby, SEO, Pokročilé).
   * Pokud chybí, admin zařadí pole do výchozí sekce.
   */
  section?: string;
  /** Skryje pole do “Pokročilé” části (nebo zobrazí badge). */
  advanced?: boolean;
}

export type ContentConfig = Record<string, ContentField>;

/**
 * Content config shared across CMS apps.
 */

export interface ContentField {
  label: string;
  type?: 'text' | 'textarea' | 'image' | 'choice';
  /**
   * Pro přepínače - vnitřní hodnota a text, který vidí návštěvník u volby.
   */
  choices?: Array<{ value: string; label: string }>;
  /** If true, at least one language must have a non-empty value (admin validates on save). */
  required?: boolean;
  /**
   * Krátký návod pro editory; zobrazí se v administraci pod názvem pole.
   */
  helpText?: string;
  /** Placeholder pro input/textarea v administraci. */
  placeholder?: string;
  /** Doporučená délka textu (pouze upozornění v administraci). */
  recommendedMaxLength?: number;
  /** Maximální délka textu v administraci (včetně mezer). */
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

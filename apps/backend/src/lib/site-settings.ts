export type TemplateId = 'template1' | 'template2' | 'template3' | (string & {});

export type SiteSettingsPublic = {
  templateId?: string;
  theme: {
    primary: string;
    secondary1: string;
    secondary2?: string;
  };
  cta: {
    variant: 'buttons' | 'form';
    buttons?: { phoneLabel?: string; emailLabel?: string };
    form?: { submitLabel?: string; successMessage?: string; layout?: 'center' | 'split' };
  };
};

export type SiteSettingsAdmin = SiteSettingsPublic & {
  lead: {
    notificationEmail?: string;
    formspreeUrl?: string;
  };
};

export const DEFAULT_PUBLIC_SITE_SETTINGS: SiteSettingsPublic = {
  templateId: 'template1',
  theme: {
    primary: '#2c4ab1',
    secondary1: '#5a4fcf',
  },
  cta: {
    variant: 'buttons',
    buttons: {},
  },
};

export const DEFAULT_ADMIN_SITE_SETTINGS: SiteSettingsAdmin = {
  ...DEFAULT_PUBLIC_SITE_SETTINGS,
  lead: {},
};

function clampLen(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max);
}

function cleanOptionalText(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = clampLen(value.trim(), maxLen);
  return v.length > 0 ? v : undefined;
}

function isHexColor(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cleanOptionalEmail(value: unknown, maxLen: number): string | undefined {
  const v = cleanOptionalText(value, maxLen);
  if (!v) return undefined;
  const lower = v.toLowerCase();
  return isValidEmail(lower) ? lower : undefined;
}

function cleanOptionalUrl(value: unknown, maxLen: number): string | undefined {
  const v = cleanOptionalText(value, maxLen);
  if (!v) return undefined;
  try {
    const url = new URL(v);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function normalizeHexColor(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const v = input.trim();
  if (!isHexColor(v)) return undefined;
  const hex = v.toLowerCase();
  if (hex.length === 4) {
    // #rgb -> #rrggbb
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return hex;
}

export function validateAndNormalizePublicSiteSettings(input: unknown): { ok: true; value: SiteSettingsPublic } | { ok: false; error: string } {
  const raw = (input ?? {}) as Record<string, unknown>;

  const templateId = cleanOptionalText(raw.templateId, 50);

  const themeRaw = (raw.theme ?? {}) as Record<string, unknown>;
  const primary = normalizeHexColor(themeRaw.primary) ?? DEFAULT_PUBLIC_SITE_SETTINGS.theme.primary;
  const secondary1 = normalizeHexColor(themeRaw.secondary1) ?? DEFAULT_PUBLIC_SITE_SETTINGS.theme.secondary1;
  const secondary2 = normalizeHexColor(themeRaw.secondary2);

  const ctaRaw = (raw.cta ?? {}) as Record<string, unknown>;
  const variant = (typeof ctaRaw.variant === 'string' ? ctaRaw.variant.trim() : '') as string;
  const variantNormalized: 'buttons' | 'form' = variant === 'form' ? 'form' : 'buttons';

  const formRaw = (ctaRaw.form ?? {}) as Record<string, unknown>;

  const submitLabel = cleanOptionalText(formRaw.submitLabel, 100);
  const successMessage = cleanOptionalText(formRaw.successMessage, 300);
  const layoutRaw = typeof formRaw.layout === 'string' ? formRaw.layout.trim().toLowerCase() : '';
  const layout: 'center' | 'split' | undefined = layoutRaw === 'split' ? 'split' : layoutRaw === 'center' ? 'center' : undefined;

  const out: SiteSettingsPublic = {
    ...(templateId ? { templateId } : {}),
    theme: {
      primary,
      secondary1,
      ...(secondary2 ? { secondary2 } : {}),
    },
    cta: {
      variant: variantNormalized,
      ...(variantNormalized === 'buttons'
        ? { buttons: {} }
        : {
            form: {
              ...(submitLabel ? { submitLabel } : {}),
              ...(successMessage ? { successMessage } : {}),
              ...(layout ? { layout } : {}),
            },
          }),
    },
  };

  // basic sanity (should never fail with defaults)
  if (!isHexColor(out.theme.primary) || !isHexColor(out.theme.secondary1)) {
    return { ok: false, error: 'Invalid theme colors' };
  }

  return { ok: true, value: out };
}

export function validateAndNormalizeAdminSiteSettings(
  input: unknown
): { ok: true; value: SiteSettingsAdmin } | { ok: false; error: string } {
  const base = validateAndNormalizePublicSiteSettings(input);
  if (!base.ok) return base;

  const raw = (input ?? {}) as Record<string, unknown>;
  const leadRaw = (raw.lead ?? {}) as Record<string, unknown>;

  const notificationEmail = cleanOptionalEmail(leadRaw.notificationEmail, 200);
  const formspreeUrl = cleanOptionalUrl(leadRaw.formspreeUrl, 500);

  return {
    ok: true,
    value: {
      ...base.value,
      lead: {
        ...(notificationEmail ? { notificationEmail } : {}),
        ...(formspreeUrl ? { formspreeUrl } : {}),
      },
    },
  };
}

export function toPublicSiteSettings(row: {
  template_id: string | null;
  theme_primary: string | null;
  theme_secondary1: string | null;
  theme_secondary2: string | null;
  cta_variant: string | null;
  cta_submit_label: string | null;
  cta_success_message: string | null;
  cta_form_layout?: string | null;
}): SiteSettingsPublic {
  const fromDb: SiteSettingsPublic = {
    ...(row.template_id ? { templateId: row.template_id } : {}),
    theme: {
      primary: row.theme_primary ?? DEFAULT_PUBLIC_SITE_SETTINGS.theme.primary,
      secondary1: row.theme_secondary1 ?? DEFAULT_PUBLIC_SITE_SETTINGS.theme.secondary1,
      ...(row.theme_secondary2 ? { secondary2: row.theme_secondary2 } : {}),
    },
    cta: {
      variant: row.cta_variant === 'form' ? 'form' : 'buttons',
    },
  };

  if (fromDb.cta.variant === 'buttons') {
    fromDb.cta.buttons = {};
  } else {
    fromDb.cta.form = {
      ...(row.cta_submit_label ? { submitLabel: row.cta_submit_label } : {}),
      ...(row.cta_success_message ? { successMessage: row.cta_success_message } : {}),
      ...(row.cta_form_layout === 'split' ? { layout: 'split' } : row.cta_form_layout === 'center' ? { layout: 'center' } : {}),
    };
  }

  // Normalize colors on output too (so #rgb doesn't leak to frontend)
  const normalized = validateAndNormalizePublicSiteSettings(fromDb);
  return normalized.ok ? normalized.value : DEFAULT_PUBLIC_SITE_SETTINGS;
}

export function toAdminSiteSettings(row: {
  template_id: string | null;
  theme_primary: string | null;
  theme_secondary1: string | null;
  theme_secondary2: string | null;
  cta_variant: string | null;
  cta_submit_label: string | null;
  cta_success_message: string | null;
  cta_form_layout?: string | null;
  lead_notification_email?: string | null;
  lead_formspree_url?: string | null;
}): SiteSettingsAdmin {
  const pub = toPublicSiteSettings(row);
  const lead: SiteSettingsAdmin['lead'] = {
    ...(row.lead_notification_email ? { notificationEmail: row.lead_notification_email } : {}),
    ...(row.lead_formspree_url ? { formspreeUrl: row.lead_formspree_url } : {}),
  };
  const normalized = validateAndNormalizeAdminSiteSettings({ ...pub, lead });
  return normalized.ok ? normalized.value : DEFAULT_ADMIN_SITE_SETTINGS;
}

export function toDbSiteSettings(input: SiteSettingsPublic): {
  template_id: string | null;
  theme_primary: string;
  theme_secondary1: string;
  theme_secondary2: string | null;
  cta_variant: 'buttons' | 'form';
  cta_phone_label: string | null;
  cta_email_label: string | null;
  cta_submit_label: string | null;
  cta_success_message: string | null;
  cta_form_layout: 'center' | 'split';
  updated_at: string;
} {
  const normalized = validateAndNormalizePublicSiteSettings(input);
  const v = normalized.ok ? normalized.value : DEFAULT_PUBLIC_SITE_SETTINGS;

  return {
    template_id: v.templateId ? v.templateId.trim() : null,
    theme_primary: v.theme.primary,
    theme_secondary1: v.theme.secondary1,
    theme_secondary2: v.theme.secondary2 ?? null,
    cta_variant: v.cta.variant,
    cta_phone_label: null,
    cta_email_label: null,
    cta_submit_label: v.cta.variant === 'form' ? (v.cta.form?.submitLabel?.trim() ?? null) : null,
    cta_success_message: v.cta.variant === 'form' ? (v.cta.form?.successMessage?.trim() ?? null) : null,
    cta_form_layout: v.cta.variant === 'form' && v.cta.form?.layout === 'split' ? 'split' : 'center',
    updated_at: new Date().toISOString(),
  };
}

export function toDbAdminSiteSettings(input: SiteSettingsAdmin): ReturnType<typeof toDbSiteSettings> & {
  lead_notification_email: string | null;
  lead_formspree_url: string | null;
} {
  const normalized = validateAndNormalizeAdminSiteSettings(input);
  const v = normalized.ok ? normalized.value : DEFAULT_ADMIN_SITE_SETTINGS;

  return {
    ...toDbSiteSettings(v),
    lead_notification_email: v.lead.notificationEmail?.trim()?.toLowerCase() ?? null,
    lead_formspree_url: v.lead.formspreeUrl?.trim() ?? null,
  };
}


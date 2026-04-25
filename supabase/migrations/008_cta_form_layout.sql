-- CTA form layout option (center | split)

ALTER TABLE site_settings
  ADD COLUMN cta_form_layout TEXT NOT NULL DEFAULT 'center';

ALTER TABLE site_settings
  ADD CONSTRAINT site_settings_cta_form_layout_check
  CHECK (cta_form_layout IN ('center', 'split'));


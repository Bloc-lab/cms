-- Formspree integration per tenant

ALTER TABLE site_settings
  ADD COLUMN lead_formspree_url TEXT;


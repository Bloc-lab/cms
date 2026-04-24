-- Lead notification emails per tenant (stored in site_settings)

ALTER TABLE site_settings
  ADD COLUMN lead_notification_email TEXT;


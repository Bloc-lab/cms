-- Add JSON navigation settings for dynamic menus (public + admin)

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS nav_json JSONB NOT NULL DEFAULT '{}'::jsonb;


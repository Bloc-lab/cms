-- Site settings (public) + CTA leads

-- One row per tenant (public settings for template/theme/CTA)
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id TEXT,

  theme_primary TEXT NOT NULL DEFAULT '#2c4ab1',
  theme_secondary1 TEXT NOT NULL DEFAULT '#5a4fcf',
  theme_secondary2 TEXT,

  cta_variant TEXT NOT NULL DEFAULT 'buttons', -- 'buttons' | 'form'
  cta_phone_label TEXT,
  cta_email_label TEXT,
  cta_submit_label TEXT,
  cta_success_message TEXT,

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- Basic DB-level validation (app still trims/normalizes)
ALTER TABLE site_settings
  ADD CONSTRAINT site_settings_theme_primary_hex
  CHECK (theme_primary ~* '^#([0-9a-f]{3}|[0-9a-f]{6})$');

ALTER TABLE site_settings
  ADD CONSTRAINT site_settings_theme_secondary1_hex
  CHECK (theme_secondary1 ~* '^#([0-9a-f]{3}|[0-9a-f]{6})$');

ALTER TABLE site_settings
  ADD CONSTRAINT site_settings_theme_secondary2_hex
  CHECK (theme_secondary2 IS NULL OR theme_secondary2 ~* '^#([0-9a-f]{3}|[0-9a-f]{6})$');

ALTER TABLE site_settings
  ADD CONSTRAINT site_settings_cta_variant_check
  CHECK (cta_variant IN ('buttons', 'form'));

CREATE INDEX idx_site_settings_tenant ON site_settings(tenant_id);

-- Leads submitted from public CTA form
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  source TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_tenant ON leads(tenant_id);
CREATE INDEX idx_leads_tenant_created ON leads(tenant_id, created_at DESC);

-- RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- site_settings: tenant members (and SUPER_ADMIN) can read/write
CREATE POLICY site_settings_select ON site_settings
  FOR SELECT USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY site_settings_insert ON site_settings
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY site_settings_update ON site_settings
  FOR UPDATE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY site_settings_delete ON site_settings
  FOR DELETE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

-- leads: only tenant members (and SUPER_ADMIN) can read/write in admin.
-- Public inserts are done server-side with service role (bypasses RLS).
CREATE POLICY leads_select ON leads
  FOR SELECT USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY leads_update ON leads
  FOR UPDATE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY leads_delete ON leads
  FOR DELETE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );


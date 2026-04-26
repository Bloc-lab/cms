-- Dev/Admin foundations + rename template "redus" -> "template1"
-- Run via Supabase migrations

-- ============================================
-- Template id rename (data migration)
-- ============================================

UPDATE site_settings
SET template_id = 'template1'
WHERE template_id = 'redus';

-- ============================================
-- Site settings: template version
-- ============================================

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS template_version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_site_settings_template
  ON site_settings(template_id, template_version);

-- ============================================
-- Tenants: status + internal notes (dev/admin)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status') THEN
    CREATE TYPE tenant_status AS ENUM ('active', 'paused', 'deleted');
  END IF;
END $$;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS status tenant_status NOT NULL DEFAULT 'active';

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- ============================================
-- Tenant domains (multiple domains + redirects)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_domain_type') THEN
    CREATE TYPE tenant_domain_type AS ENUM ('web', 'admin');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tenant_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  type tenant_domain_type NOT NULL DEFAULT 'web',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  redirect_to_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain)
);

CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant ON tenant_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant_type ON tenant_domains(tenant_id, type);

-- RLS for tenant_domains
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_domains_select ON tenant_domains
  FOR SELECT USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY tenant_domains_insert ON tenant_domains
  FOR INSERT WITH CHECK (
    is_super_admin()
  );

CREATE POLICY tenant_domains_update ON tenant_domains
  FOR UPDATE USING (
    is_super_admin()
  );

CREATE POLICY tenant_domains_delete ON tenant_domains
  FOR DELETE USING (
    is_super_admin()
  );

-- ============================================
-- Dev/admin audit log (support tooling)
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_audit_log_tenant_created
  ON tenant_audit_log(tenant_id, created_at DESC);

ALTER TABLE tenant_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_audit_log_select ON tenant_audit_log
  FOR SELECT USING (is_super_admin());

CREATE POLICY tenant_audit_log_insert ON tenant_audit_log
  FOR INSERT WITH CHECK (is_super_admin());


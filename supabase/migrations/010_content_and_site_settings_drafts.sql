-- Autosave drafts for page-scoped content (content_entry_drafts) and main-page site_settings (site_settings_drafts).
-- Published rows remain in content_entries / site_settings until publish.

CREATE TABLE content_entry_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL,
  key TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'cs',
  value TEXT DEFAULT '',
  publishing_status TEXT NOT NULL DEFAULT 'not_published',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(tenant_id, page_id, key, lang)
);

CREATE INDEX idx_content_entry_drafts_tenant_page ON content_entry_drafts(tenant_id, page_id);

ALTER TABLE content_entry_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_entry_drafts_select ON content_entry_drafts
  FOR SELECT USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY content_entry_drafts_insert ON content_entry_drafts
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY content_entry_drafts_update ON content_entry_drafts
  FOR UPDATE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY content_entry_drafts_delete ON content_entry_drafts
  FOR DELETE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE TABLE site_settings_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL DEFAULT 'main',
  settings JSONB NOT NULL DEFAULT '{}',
  publishing_status TEXT NOT NULL DEFAULT 'not_published',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(tenant_id, page_id)
);

CREATE INDEX idx_site_settings_drafts_tenant_page ON site_settings_drafts(tenant_id, page_id);

ALTER TABLE site_settings_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_settings_drafts_select ON site_settings_drafts
  FOR SELECT USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY site_settings_drafts_insert ON site_settings_drafts
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY site_settings_drafts_update ON site_settings_drafts
  FOR UPDATE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY site_settings_drafts_delete ON site_settings_drafts
  FOR DELETE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

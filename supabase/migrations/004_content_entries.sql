-- Content entries: key-value content per tenant per language
-- Replaces page-based block system with simple content keys

CREATE TABLE content_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'cs',
  value TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, key, lang)
);

CREATE INDEX idx_content_entries_tenant ON content_entries(tenant_id);
CREATE INDEX idx_content_entries_tenant_lang ON content_entries(tenant_id, lang);

-- RLS
ALTER TABLE content_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_entries_select ON content_entries
  FOR SELECT USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY content_entries_insert ON content_entries
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY content_entries_update ON content_entries
  FOR UPDATE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY content_entries_delete ON content_entries
  FOR DELETE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

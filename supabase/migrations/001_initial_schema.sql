-- Multi-tenant Headless CMS - Initial Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'EDITOR');
CREATE TYPE page_status AS ENUM ('draft', 'published', 'archived');

-- ============================================
-- TABLES
-- ============================================

-- Tenants (organizations/workspaces)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  admin_subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  api_key_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'EDITOR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction: users <-> tenants (many-to-many)
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'EDITOR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Pages (per tenant)
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  status page_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- Page translations (multilingual content)
CREATE TABLE page_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  lang TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, lang)
);

-- Page history (audit trail for content changes)
CREATE TABLE page_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  page_translation_id UUID REFERENCES page_translations(id) ON DELETE SET NULL,
  lang TEXT,
  content_snapshot JSONB NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media (files per tenant)
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  alt_text TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_pages_tenant_id ON pages(tenant_id);
CREATE INDEX idx_pages_tenant_slug ON pages(tenant_id, slug);
CREATE INDEX idx_page_translations_page_id ON page_translations(page_id);
CREATE INDEX idx_page_history_page_id ON page_history(page_id);
CREATE INDEX idx_media_tenant_id ON media(tenant_id);
CREATE INDEX idx_media_tenant_active ON media(tenant_id) WHERE is_deleted = FALSE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Helper function: get tenant_ids for current user
CREATE OR REPLACE FUNCTION get_user_tenant_ids()
RETURNS SETOF UUID AS $$
  SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- SUPER_ADMIN can see all tenants
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Tenants: SUPER_ADMIN sees all, others only their tenants
CREATE POLICY tenants_select ON tenants
  FOR SELECT USING (
    is_super_admin() OR id IN (SELECT get_user_tenant_ids())
  );

CREATE POLICY tenants_insert ON tenants
  FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY tenants_update ON tenants
  FOR UPDATE USING (
    is_super_admin() OR id IN (SELECT get_user_tenant_ids())
  );

CREATE POLICY tenants_delete ON tenants
  FOR DELETE USING (is_super_admin());

-- Profiles: users see own profile, SUPER_ADMIN sees all
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (
    id = auth.uid() OR is_super_admin()
  );

CREATE POLICY profiles_insert ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (id = auth.uid() OR is_super_admin());

-- Tenant_users: only visible to users in same tenant or SUPER_ADMIN
CREATE POLICY tenant_users_select ON tenant_users
  FOR SELECT USING (
    is_super_admin() OR tenant_id IN (SELECT get_user_tenant_ids())
  );

CREATE POLICY tenant_users_insert ON tenant_users
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY tenant_users_update ON tenant_users
  FOR UPDATE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY tenant_users_delete ON tenant_users
  FOR DELETE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

-- Pages: only tenant members
CREATE POLICY pages_select ON pages
  FOR SELECT USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY pages_insert ON pages
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY pages_update ON pages
  FOR UPDATE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY pages_delete ON pages
  FOR DELETE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

-- Page_translations: via page's tenant
CREATE POLICY page_translations_select ON page_translations
  FOR SELECT USING (
    page_id IN (
      SELECT id FROM pages WHERE tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
    )
  );

CREATE POLICY page_translations_insert ON page_translations
  FOR INSERT WITH CHECK (
    page_id IN (
      SELECT id FROM pages WHERE tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
    )
  );

CREATE POLICY page_translations_update ON page_translations
  FOR UPDATE USING (
    page_id IN (
      SELECT id FROM pages WHERE tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
    )
  );

CREATE POLICY page_translations_delete ON page_translations
  FOR DELETE USING (
    page_id IN (
      SELECT id FROM pages WHERE tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
    )
  );

-- Page_history: same as page_translations
CREATE POLICY page_history_select ON page_history
  FOR SELECT USING (
    page_id IN (
      SELECT id FROM pages WHERE tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
    )
  );

CREATE POLICY page_history_insert ON page_history
  FOR INSERT WITH CHECK (
    page_id IN (
      SELECT id FROM pages WHERE tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
    )
  );

-- Media: only tenant members
CREATE POLICY media_select ON media
  FOR SELECT USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY media_insert ON media
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY media_update ON media
  FOR UPDATE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

CREATE POLICY media_delete ON media
  FOR DELETE USING (
    tenant_id IN (SELECT get_user_tenant_ids()) OR is_super_admin()
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile on user signup
-- Použití public.profiles zajišťuje, že trigger najde tabulku i v kontextu auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, COALESCE(NEW.email, ''), 'EDITOR');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

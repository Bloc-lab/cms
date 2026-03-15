export type UserRole = 'SUPER_ADMIN' | 'EDITOR';
export type PageStatus = 'draft' | 'published' | 'archived';

export interface Tenant {
  id: string;
  name: string;
  admin_subdomain: string;
  custom_domain: string | null;
  api_key_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Page {
  id: string;
  tenant_id: string;
  slug: string;
  status: PageStatus;
  created_at: string;
  updated_at: string;
}

export interface PageTranslation {
  id: string;
  page_id: string;
  lang: string;
  title: string;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PageHistory {
  id: string;
  page_id: string;
  page_translation_id: string | null;
  lang: string | null;
  content_snapshot: Record<string, unknown>;
  changed_by: string | null;
  created_at: string;
}

export interface Media {
  id: string;
  tenant_id: string;
  path: string;
  alt_text: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

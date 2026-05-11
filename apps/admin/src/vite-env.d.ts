/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ADMIN_BASE_DOMAIN?: string;
  readonly VITE_EXAMPLE_TENANT_SUBDOMAIN?: string;
  readonly VITE_SITE_NAME?: string;
  readonly VITE_PUBLIC_SITE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

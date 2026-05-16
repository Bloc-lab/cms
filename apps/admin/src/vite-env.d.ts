/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ADMIN_BASE_DOMAIN?: string;
  readonly VITE_EXAMPLE_TENANT_SUBDOMAIN?: string;
  readonly VITE_SITE_NAME?: string;
  readonly VITE_PUBLIC_SITE_URL?: string;
  /** URL náhledu pro výchozí šablonu `template_id=template1` (MONO aj.). */
  readonly VITE_PUBLIC_SITE_URL_TEMPLATE1?: string;
  /** URL náhledu pro šablonu ARCH (`template_id=arch`). */
  readonly VITE_PUBLIC_SITE_URL_ARCH?: string;
  /** Volitelný JSON `{ "template_id": "https://site …" }` – přehledně pro více šablon najednou. */
  readonly VITE_PUBLIC_SITE_URL_MAP?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

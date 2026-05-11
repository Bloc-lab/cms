import { useCallback, useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ADMIN_LOGO_KEY, ADMIN_SITE_NAME_KEY, mergeContentEntriesMap } from '@nase-cms/shared';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../lib/api';
import { CMS_BRANDING_REFRESH_EVENT } from '../lib/branding';
import { tenantHref, tenantPathPrefix } from '../lib/tenantPath';

interface ContentEntry {
  key: string;
  lang: string;
  value: string;
}

function pickLogoUrl(entries: Record<string, string>): string | null {
  const cs = entries[`${ADMIN_LOGO_KEY}:cs`]?.trim();
  const en = entries[`${ADMIN_LOGO_KEY}:en`]?.trim();
  return cs || en || null;
}

function pickSiteName(entries: Record<string, string>): string {
  return (entries[`${ADMIN_SITE_NAME_KEY}:cs`] ?? entries[`${ADMIN_SITE_NAME_KEY}:en`] ?? '').trim();
}

function userInitials(email: string | undefined): string {
  if (!email) return '?';
  const local = email.split('@')[0] ?? email;
  const parts = local.split(/[.\s_-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

function BrandMark({
  logoUrl,
  siteName,
  showSubtitle = true,
}: {
  logoUrl: string | null;
  siteName: string;
  showSubtitle?: boolean;
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={siteName || ''}
        className="max-h-10 max-w-[200px] w-auto object-contain object-left"
      />
    );
  }
  const title = siteName.trim() || '—';
  return (
    <div>
      <p className="text-lg font-semibold text-gray-900 tracking-tight">{title}</p>
      {showSubtitle ? (
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 mt-0.5">Statický CMS</p>
      ) : null}
    </div>
  );
}

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [siteName, setSiteName] = useState('');

  const loadBranding = useCallback(async () => {
    try {
      const data = await apiGet<{ entries: ContentEntry[]; tenantName?: string | null }>(
        '/api/v1/admin/content'
      );
      const map = mergeContentEntriesMap(data.entries ?? []);
      setLogoUrl(pickLogoUrl(map));
      const fromContent = pickSiteName(map);
      const fromTenant = (data.tenantName ?? '').trim();
      const fromEnv = import.meta.env.VITE_SITE_NAME?.trim() ?? '';
      setSiteName(fromContent || fromTenant || fromEnv);
    } catch {
      setLogoUrl(null);
      setSiteName('');
    }
  }, []);

  useEffect(() => {
    void loadBranding();
  }, [loadBranding, location.pathname]);

  useEffect(() => {
    const onRefresh = () => void loadBranding();
    window.addEventListener(CMS_BRANDING_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(CMS_BRANDING_REFRESH_EVENT, onRefresh);
  }, [loadBranding]);

  const handleSignOut = async () => {
    await signOut();
    const px = tenantPathPrefix();
    navigate(px ? `${px}/login` : '/login');
  };

  const pathname = location.pathname;

  const navItemClass = (active: boolean) =>
    `flex items-center px-3 py-2.5 text-[13px] font-semibold uppercase tracking-wide rounded-sm border-l-[3px] -ml-px transition-colors ${
      active
        ? 'border-blue-600 bg-blue-50 text-gray-900'
        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'
    }`;

  const navSectionTitleClass =
    'px-3 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400';

  return (
    <div className="min-h-screen flex items-start bg-[#f5f5f5]">
      <aside className="sticky top-0 z-30 flex h-screen w-[220px] shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white">
        <div className="px-5 py-5 border-b border-gray-200">
          {logoUrl ? (
            <BrandMark logoUrl={logoUrl} siteName={siteName} />
          ) : (
            <div className="mt-3">
              <BrandMark logoUrl={null} siteName={siteName} />
            </div>
          )}
        </div>
        <nav className="flex-1 pb-5">
          <div className={navSectionTitleClass}>Obsah</div>
          <div className="px-3 space-y-1">
            <NavLink
              to={tenantHref('/')}
              className={({ isActive }) => navItemClass(isActive || pathname.includes('/page/'))}
            >
              Stránky
            </NavLink>
          </div>

          <div className={navSectionTitleClass}>Média</div>
          <div className="px-3 space-y-1">
            <NavLink to={tenantHref('/media')} className={({ isActive }) => navItemClass(isActive)}>
              Knihovna médií
            </NavLink>
          </div>

          <div className={navSectionTitleClass}>Nastavení webu</div>
          <div className="px-3 space-y-1">
            <NavLink to={tenantHref('/metadata')} className={({ isActive }) => navItemClass(isActive)}>
              Základní nastavení
            </NavLink>
            <NavLink to={tenantHref('/settings/template')} className={({ isActive }) => navItemClass(isActive)}>
              Šablona / Vzhled
            </NavLink>
            <NavLink to={tenantHref('/settings/contact')} className={({ isActive }) => navItemClass(isActive)}>
              Kontakt a firma
            </NavLink>
          </div>

        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-end gap-4 border-b border-gray-200 bg-white px-4 md:px-6">
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="hidden md:inline max-w-[180px] truncate text-sm text-gray-500"
              title={user?.email ?? ''}
            >
              {user?.email}
            </span>
            <div
              className="h-9 w-9 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold flex items-center justify-center border border-gray-200"
              title={user?.email ?? ''}
            >
              {userInitials(user?.email)}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Odhlásit
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 bg-white">
          <div className="w-full px-3 py-8 pb-28 pr-5 md:px-4 md:pr-8 lg:pl-3 lg:pr-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

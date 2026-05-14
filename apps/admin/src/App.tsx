import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import PlatformLayout from './components/PlatformLayout';
import Login from './pages/Login';
import SitePages from './pages/SitePages';
import Metadata from './pages/Metadata';
import MediaLibrary from './pages/MediaLibrary';
import PageContentEdit from './pages/PageContentEdit';
import SettingsContact from './pages/SettingsContact';
import TemplateAppearance from './pages/TemplateAppearance';
import MenuSettings from './pages/MenuSettings';
import DevTenants from './pages/DevTenants';
import PlatformTenantDetail from './pages/PlatformTenantDetail';
import { needsPathTenantSlug, tenantHref } from './lib/tenantPath';

function ProtectedRoute({ children, loginTo }: { children: React.ReactNode; loginTo: string }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5] text-sm text-gray-500">
        Načítání…
      </div>
    );
  }
  if (!user) return <Navigate to={loginTo} replace />;
  return <>{children}</>;
}

function PathDeploymentHint() {
  const example =
    import.meta.env.VITE_EXAMPLE_TENANT_SUBDOMAIN?.trim() || 'tvuj-tenant';
  const sample = `${window.location.origin}/t/${example}/login`;
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4">
      <div className="max-w-lg rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-700 shadow-sm">
        <p className="font-semibold text-gray-900">Admin na sdílené doméně (např. Vercel)</p>
        <p className="mt-3 leading-relaxed">
          Tenant se z hostname nepozná. Otevři přihlášení v cestě{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">/t/</code> +{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">admin_subdomain</code> z databáze:
        </p>
        <code className="mt-4 block break-all rounded-md bg-gray-50 p-3 text-xs text-gray-800">{sample}</code>
        <p className="mt-4 text-gray-600">
          Přístup bez tenantové subdomény:{' '}
          <a className="text-blue-600 hover:underline" href="/platform/tenants">
            Platform admin
          </a>{' '}
          (po přihlášení na{' '}
          <a className="text-blue-600 hover:underline" href="/login">
            /login
          </a>
          ).
        </p>
      </div>
    </div>
  );
}

/** `/content` → tenant scope root (legacy `/` or `/t/:slug`). */
function ContentScopeRedirect() {
  return <Navigate to={tenantHref('/')} replace />;
}

function CmsShell() {
  const { tenantSlug } = useParams();
  const loginTo = tenantSlug ? `/t/${tenantSlug}/login` : '/login';
  return (
    <ProtectedRoute loginTo={loginTo}>
      <Layout />
    </ProtectedRoute>
  );
}

function HomeRedirect() {
  const host = window.location.host.toLowerCase();
  if (host.startsWith('admin.localhost')) {
    return <Navigate to="/platform/tenants" replace />;
  }
  return <SitePages />;
}

const CMS_NESTED_ROUTES = [
  <Route key="index" index element={<HomeRedirect />} />,
  <Route key="content" path="content" element={<ContentScopeRedirect />} />,
  <Route key="metadata" path="metadata" element={<Metadata />} />,
  <Route key="menu" path="settings/menu" element={<MenuSettings />} />,
  <Route key="tpl" path="settings/template" element={<TemplateAppearance />} />,
  <Route key="contact" path="settings/contact" element={<SettingsContact />} />,
  <Route key="media" path="media" element={<MediaLibrary />} />,
  <Route key="page" path="page/:pageId" element={<PageContentEdit />} />,
  <Route key="star" path="*" element={<Navigate to="." replace />} />,
];

export default function App() {
  const sharedHostTenantMode = needsPathTenantSlug();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/t/:tenantSlug/login" element={<Login />} />

      <Route
        path="/platform"
        element={
          <ProtectedRoute loginTo="/login">
            <PlatformLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/platform/tenants" replace />} />
        <Route path="tenants" element={<DevTenants />} />
        <Route path="tenants/:tenantId" element={<Navigate to="overview" replace />} />
        <Route path="tenants/:tenantId/:section" element={<PlatformTenantDetail />} />
      </Route>

      {sharedHostTenantMode ? (
        <Route path="/" element={<PathDeploymentHint />} />
      ) : (
        <Route path="/" element={<CmsShell />}>
          {CMS_NESTED_ROUTES}
        </Route>
      )}

      <Route path="/t/:tenantSlug" element={<CmsShell />}>
        {CMS_NESTED_ROUTES}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { Routes, Route, Navigate } from 'react-router-dom';
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
import DevTenants from './pages/DevTenants';
import PlatformTenantDetail from './pages/PlatformTenantDetail';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5] text-sm text-gray-500">
        Načítání…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const host = window.location.host.toLowerCase();
  if (host.startsWith('admin.localhost')) {
    return <Navigate to="/platform/tenants" replace />;
  }
  return <SitePages />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/platform"
        element={
          <ProtectedRoute>
            <PlatformLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/platform/tenants" replace />} />
        <Route path="tenants" element={<DevTenants />} />
        <Route path="tenants/:tenantId" element={<Navigate to="overview" replace />} />
        <Route path="tenants/:tenantId/:section" element={<PlatformTenantDetail />} />
      </Route>

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route path="content" element={<Navigate to="/" replace />} />
        <Route path="metadata" element={<Metadata />} />
        <Route path="settings/template" element={<TemplateAppearance />} />
        <Route path="settings/contact" element={<SettingsContact />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="page/:pageId" element={<PageContentEdit />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

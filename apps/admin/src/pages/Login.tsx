import { useState, useEffect } from 'react';
import { useNavigate, Navigate, useMatch } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchPublicSiteInfo } from '../lib/siteInfo';
import { needsPathTenantSlug } from '../lib/tenantPath';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { user, loading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const tenantLoginMatch = useMatch('/t/:tenantSlug/login');
  const pathTenantSlug = tenantLoginMatch?.params.tenantSlug;
  const defaultAfterLogin =
    typeof pathTenantSlug === 'string'
      ? `/t/${pathTenantSlug}/`
      : needsPathTenantSlug()
        ? '/platform/tenants'
        : '/';

  useEffect(() => {
    const envName = import.meta.env.VITE_SITE_NAME?.trim() ?? '';
    void fetchPublicSiteInfo().then((info) => {
      if (!info) {
        setSiteName(envName);
        return;
      }
      setSiteName(info.siteName || envName);
      setLogoUrl(info.logoUrl);
    });
  }, []);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5] text-sm text-gray-500">
        Načítání…
      </div>
    );
  }
  if (user) return <Navigate to={defaultAfterLogin} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate(defaultAfterLogin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Přihlášení selhalo');
    } finally {
      setLoading(false);
    }
  };

  const title = siteName.trim() || '—';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg border border-gray-200 shadow-sm">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 text-center">Archiv</p>
        {logoUrl ? (
          <div className="flex justify-center mt-3">
            <img src={logoUrl} alt="" className="max-h-12 max-w-[240px] object-contain" />
          </div>
        ) : (
          <p className="text-lg font-semibold text-center text-gray-900 mt-2">{title}</p>
        )}
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 text-center mt-2">
          Statický CMS
        </p>
        <h1 className="text-xl font-semibold text-center text-gray-900 mt-6 mb-6">Přihlášení</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Heslo</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
            />
          </div>
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 shadow-sm"
          >
            {loading ? 'Přihlašování…' : 'Přihlásit'}
          </button>
        </form>
      </div>
    </div>
  );
}

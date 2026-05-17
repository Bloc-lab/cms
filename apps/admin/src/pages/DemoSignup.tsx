import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { tenantAdminHomeUrl } from '../lib/tenantPath';
import { API_BASE } from '../lib/api';

type DemoTemplate = { id: string; label: string };

export default function DemoSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates] = useState<DemoTemplate[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/demo/templates`);
        const data = (await res.json()) as { templates?: DemoTemplate[] };
        if (cancelled) return;
        const list = data.templates ?? [];
        setTemplates(list);
        if (list.length > 0) {
          setTemplateId((prev) => prev || list[0]!.id);
        }
      } catch {
        if (!cancelled) setError('Nepodařilo se načíst šablony.');
      } finally {
        if (!cancelled) setLoadingTemplates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/demo/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, templateId }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string; tenant?: { admin_subdomain?: string } };
      if (!res.ok) {
        const msg = body.detail ?? body.error ?? 'Registrace se nezdařila';
        setError(msg);
        return;
      }
      const subdomain = body.tenant?.admin_subdomain?.trim();
      if (!subdomain) {
        setError('Chybí identifikátor webu.');
        return;
      }
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) {
        setError(
          'Účet byl vytvořen, ale přihlášení selhalo. Zkuste se přihlásit ručně na přihlašovací stránce.'
        );
        return;
      }
      const home = tenantAdminHomeUrl(subdomain);
      if (home.startsWith('http')) {
        window.location.assign(home);
      } else {
        navigate(home, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrace selhala');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg border border-gray-200 shadow-sm">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 text-center">Ukázka</p>
        <h1 className="text-xl font-semibold text-center text-gray-900 mt-4 mb-2">Demo účet</h1>
        <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
          Vytvoří se samostatné sandbox prostředí. Změny se ukládají jako koncept a můžete si je prohlédnout v náhledu -
          veřejné publikování je u demo účtů vypnuté.
        </p>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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
              minLength={8}
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Nejméně 8 znaků.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Šablona</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              required
              disabled={loadingTemplates || templates.length === 0}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 bg-white"
            >
              {templates.length === 0 ? (
                <option value="">-</option>
              ) : (
                templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))
              )}
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || loadingTemplates || templates.length === 0}
            className="w-full py-2.5 px-4 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 shadow-sm"
          >
            {loading ? 'Zakládám účet…' : 'Založit demo účet'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Už máte účet?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Přihlásit se
          </Link>
        </p>
      </div>
    </div>
  );
}

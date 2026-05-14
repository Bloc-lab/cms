import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { apiGet } from '../lib/api';
import { apiPost } from '../lib/api';

type DevTenant = {
  id: string;
  name: string;
  admin_subdomain: string;
  custom_domain: string | null;
  status?: string;
  created_at: string;
  updated_at: string;
  template?: { id?: string | null; version?: number | null };
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const TEMPLATE_LABELS: Record<string, string> = {
  template1: 'MONO',
  template2: 'FLOW',
  template3: 'BLOCK',
  arch: 'ARCH (renovace)',
};

function templateLabel(id: string | null | undefined): string {
  const key = (id ?? '').trim();
  return TEMPLATE_LABELS[key] ?? (key || '-');
}

export default function DevTenants() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<DevTenant[]>([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busyId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSubdomain, setCreateSubdomain] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');

  const load = async (query: string) => {
    setLoading(true);
    setError('');
    try {
      const url = query.trim().length
        ? `/api/v1/platform/tenants?q=${encodeURIComponent(query.trim())}`
        : '/api/v1/platform/tenants';
      const data = await apiGet<{ tenants: DevTenant[] }>(url);
      setTenants(data.tenants ?? []);
    } catch (e) {
      setTenants([]);
      setError(e instanceof Error ? e.message : 'Chyba při načítání tenantů');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load('');
  }, []);

  const filtered = useMemo(() => tenants, [tenants]);

  const onCreateTenant = async () => {
    setCreateBusy(true);
    setError('');
    try {
      const res = await apiPost<{ tenant: { id: string } }>('/api/v1/platform/tenants', {
        tenantName: createName,
        adminSubdomain: createSubdomain,
        userEmail: createEmail,
        userPassword: createPassword,
        userRole: 'EDITOR',
        templateId: 'template1',
        templateVersion: 1,
      });
      setToast('Tenant vytvořen');
      setCreateOpen(false);
      setCreateName('');
      setCreateSubdomain('');
      setCreateEmail('');
      setCreatePassword('');
      await load(q);
      navigate(`/platform/tenants/${res.tenant.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chyba při vytváření tenanta');
    } finally {
      setCreateBusy(false);
    }
  };

  return (
    <div>
      <Toast message={toast} show={toast.length > 0} onClose={() => setToast('')} />

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Tenant overview</h1>
          <p className="text-sm text-gray-500 mt-1">Vyhledej tenanta a otevři jeho CMS nebo spusť seed.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 text-sm font-semibold rounded-md border border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
          >
            + Nový tenant
          </button>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledat (název / subdoména / doména)…"
            className="w-[320px] max-w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => void load(q)}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm"
          >
            Hledat
          </button>
        </div>
      </div>

      {createOpen ? (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Vytvořit tenant + uživatele</h2>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="text-sm font-semibold text-gray-500 hover:text-gray-800"
            >
              Zavřít
            </button>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Název tenanta</label>
              <input value={createName} onChange={(e) => setCreateName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Admin subdoména</label>
              <input
                value={createSubdomain}
                onChange={(e) => setCreateSubdomain(e.target.value)}
                placeholder="např. kadernictvi"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">Použije se jako `TENANT.admin.localhost`.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Admin email</label>
              <input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="např. admin@klient.cz" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Heslo</label>
              <input
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="min. 8 znaků"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
              />
            </div>
          </div>
          <div className="px-5 pb-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 text-sm font-semibold rounded-md border border-gray-200 bg-white hover:bg-gray-50"
            >
              Zrušit
            </button>
            <button
              type="button"
              disabled={createBusy}
              onClick={() => void onCreateTenant()}
              className="px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createBusy ? 'Vytvářím…' : 'Vytvořit'}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Tenanti</h2>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="py-10 text-sm text-gray-500">Načítání…</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-sm text-gray-500">Žádní tenanti.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 pr-4">Tenant</th>
                    <th className="text-left py-2 pr-4">Subdoména</th>
                    <th className="text-left py-2 pr-4">Doména</th>
                    <th className="text-left py-2 pr-4">Šablona</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2 pr-4">Updated</th>
                    <th className="text-right py-2 pl-4">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((t) => {
                    const busy = busyId === t.id;
                    return (
                      <tr
                        key={t.id}
                        className={`${busy ? 'opacity-60' : ''} hover:bg-gray-50 cursor-pointer`}
                        onClick={() => navigate(`/platform/tenants/${t.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') navigate(`/platform/tenants/${t.id}`);
                        }}
                        aria-label={`Open tenant ${t.name}`}
                      >
                        <td className="py-3 pr-4">
                          <div className="font-semibold text-gray-900">{t.name}</div>
                          <div className="text-xs text-gray-500">{t.id}</div>
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-gray-700">{t.admin_subdomain}</td>
                        <td className="py-3 pr-4 text-gray-700">{t.custom_domain ?? '-'}</td>
                        <td className="py-3 pr-4 text-gray-700">
                          {templateLabel(t.template?.id ?? null)}{' '}
                          {t.template?.version != null ? <span className="text-xs text-gray-500">v{t.template.version}</span> : null}
                        </td>
                        <td className="py-3 pr-4 text-gray-700">{t.status ?? '-'}</td>
                        <td className="py-3 pr-4 text-gray-700">{fmtDate(t.updated_at)}</td>
                        <td className="py-3 pl-4">
                          <div className="flex items-center justify-end text-gray-400 font-semibold">›</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


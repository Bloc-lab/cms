import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import Toast from '../components/Toast';
import { apiDelete, apiGet, apiPost, apiPut, apiPatch } from '../lib/api';

type Tenant = {
  id: string;
  name: string;
  admin_subdomain: string;
  custom_domain: string | null;
  status?: 'active' | 'paused' | 'deleted' | string;
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
};

type DomainRow = {
  id: string;
  domain: string;
  type: 'web' | 'admin';
  is_primary: boolean;
  redirect_to_primary: boolean;
  created_at: string;
  updated_at: string;
};

type TenantDetailResponse = {
  tenant: Tenant;
  template: { id: string | null; version: number | null };
  domains: DomainRow[];
};

type TenantUserItem = {
  user_id: string;
  role: string;
  email: string;
};

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

const selectClass =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

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

function tenantCmsUrl(subdomain: string): string {
  const platformHost = window.location.host; // admin.localhost:5173
  const hostNoPort = platformHost.split(':')[0] ?? platformHost;
  const port = platformHost.includes(':') ? platformHost.split(':')[1] : '';
  const tenantHost = `${subdomain}.${hostNoPort}${port ? `:${port}` : ''}`;
  return `${window.location.protocol}//${tenantHost}/`;
}

const TEMPLATE_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'template1', label: 'Šablona 1' },
  { id: 'template2', label: 'Šablona 2' },
  { id: 'template3', label: 'Šablona 3' },
];

export default function PlatformTenantDetail() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const id = tenantId ?? '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [data, setData] = useState<TenantDetailResponse | null>(null);

  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'paused' | 'deleted'>('active');
  const [editNotes, setEditNotes] = useState('');

  const [templateId, setTemplateId] = useState('template1');
  const [templateVersion, setTemplateVersion] = useState(1);

  const [domainValue, setDomainValue] = useState('');
  const [domainType, setDomainType] = useState<'web' | 'admin'>('web');
  const [domainPrimary, setDomainPrimary] = useState(true);

  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState<TenantUserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'EDITOR' | 'SUPER_ADMIN'>('EDITOR');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiGet<TenantDetailResponse>(`/api/v1/platform/tenants/${id}`);
      setData(res);
      setEditName(res.tenant.name ?? '');
      setEditStatus((res.tenant.status as any) === 'paused' ? 'paused' : (res.tenant.status as any) === 'deleted' ? 'deleted' : 'active');
      setEditNotes((res.tenant.internal_notes ?? '') as string);
      setTemplateId(res.template.id ?? 'template1');
      setTemplateVersion(res.template.version ?? 1);
      setDomainValue('');
      setDomainType('web');
      setDomainPrimary(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chyba při načítání');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!id) return;
    setUsersLoading(true);
    try {
      const res = await apiGet<{ users: TenantUserItem[] }>(`/api/v1/platform/tenants/${id}/users`);
      setUsers(res.users ?? []);
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const section = useMemo(() => {
    const path = location.pathname;
    const raw = path.split(`/platform/tenants/${id}/`)[1] ?? 'overview';
    return raw.split('/')[0] ?? 'overview';
  }, [id, location.pathname]);

  useEffect(() => {
    if (section === 'users') {
      void loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, id]);

  const cmsUrl = useMemo(() => (data ? tenantCmsUrl(data.tenant.admin_subdomain) : ''), [data]);

  const saveOverview = async () => {
    if (!id) return;
    setBusy(true);
    setError('');
    try {
      await apiPatch(`/api/v1/platform/tenants/${id}`, {
        name: editName,
        status: editStatus,
        internal_notes: editNotes,
      });
      setToast('Uloženo');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chyba při ukládání');
    } finally {
      setBusy(false);
    }
  };

  const saveTemplate = async () => {
    if (!id) return;
    setBusy(true);
    setError('');
    try {
      await apiPut(`/api/v1/platform/tenants/${id}/template`, {
        templateId,
        templateVersion,
      });
      setToast('Šablona uložena');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chyba při ukládání šablony');
    } finally {
      setBusy(false);
    }
  };

  const addDomain = async () => {
    if (!id) return;
    setBusy(true);
    setError('');
    try {
      await apiPost(`/api/v1/platform/tenants/${id}/domains`, {
        domain: domainValue,
        type: domainType,
        isPrimary: domainPrimary,
        redirectToPrimary: true,
      });
      setToast('Doména přidána');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chyba při přidání domény');
    } finally {
      setBusy(false);
    }
  };

  const deleteDomain = async (domainId: string) => {
    if (!id) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm('Smazat doménu?')) return;
    setBusy(true);
    setError('');
    try {
      await apiDelete(`/api/v1/platform/tenants/${id}/domains/${domainId}`);
      setToast('Doména smazána');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chyba při mazání domény');
    } finally {
      setBusy(false);
    }
  };

  const seed = async (overwrite: boolean) => {
    if (!id) return;
    const confirmText = overwrite
      ? 'Opravdu chcete PŘEPSAT všechny hodnoty lorem ipsum? Tato akce přepíše existující texty.'
      : 'Naplnit jen chybějící (prázdné) hodnoty lorem ipsum? Existující texty zůstanou.';
    // eslint-disable-next-line no-alert
    if (!window.confirm(confirmText)) return;

    setBusy(true);
    setError('');
    try {
      await apiPost(`/api/v1/platform/tenants/${id}/seed`, { preset: 'lorem', overwrite, langs: ['cs', 'en', 'it'] });
      setToast(overwrite ? 'Hotovo: přepsáno lorem ipsum' : 'Hotovo: doplněno lorem ipsum');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chyba při seedování');
    } finally {
      setBusy(false);
    }
  };

  const addUser = async () => {
    if (!id) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm('Vytvořit uživatele a dát mu přístup do CMS tohoto tenanta?')) return;
    setBusy(true);
    setError('');
    try {
      await apiPost(`/api/v1/platform/tenants/${id}/users`, {
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      setToast('Uživatel vytvořen');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('EDITOR');
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chyba při vytváření uživatele');
    } finally {
      setBusy(false);
    }
  };

  if (!id) {
    return (
      <div className="text-sm text-gray-600">
        Chybí `tenantId`. <button className="underline" onClick={() => navigate('/platform/tenants')}>Zpět</button>
      </div>
    );
  }

  return (
    <div>
      <Toast message={toast} show={toast.length > 0} onClose={() => setToast('')} />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-gray-500">
            <Link to="/platform/tenants" className="hover:text-gray-700 underline-offset-2 hover:underline">
              Tenants
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-gray-900 font-medium">{data?.tenant?.name ?? 'Tenant'}</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mt-2">Tenant detail</h1>
          {data ? <p className="text-sm text-gray-500 mt-1 font-mono">{data.tenant.id}</p> : null}
        </div>
        {data ? (
          <a
            href={cmsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 text-sm font-semibold rounded-md border border-gray-200 bg-white hover:bg-gray-50"
          >
            Otevřít CMS
          </a>
        ) : null}
      </div>

      {error ? <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

      <div className="mb-6 flex items-center gap-2 border-b border-gray-200">
        {[
          { to: 'overview', label: 'Overview' },
          { to: 'domains', label: 'Domény' },
          { to: 'template', label: 'Šablona' },
          { to: 'content', label: 'Content ops' },
          { to: 'users', label: 'Users' },
        ].map((t) => (
          <NavLink
            key={t.to}
            to={`/platform/tenants/${id}/${t.to}`}
            className={({ isActive }) =>
              `px-3 py-2 text-sm font-semibold border-b-2 -mb-px ${
                isActive ? 'border-blue-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-sm text-gray-500">Načítání…</div>
      ) : !data ? (
        <div className="py-10 text-sm text-gray-500">Tenant nenalezen.</div>
      ) : (
        <div className="space-y-6">
          {/* Render section by path - very small router substitute */}
          {/* We rely on the URL segment after tenant id */}
          {(() => {
            const s = section;

            if (s === 'users') {
              return (
                <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Uživatelé (CMS přístup)</h2>
                  </div>
                  <div className="p-5 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="email"
                        className={inputClass}
                      />
                      <input
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="heslo (min 8 znaků)"
                        className={inputClass}
                      />
                      <div className="flex items-center gap-2">
                        <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'EDITOR')} className={selectClass}>
                          <option value="EDITOR">EDITOR</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void addUser()}
                          className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Přidat
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                          <tr>
                            <th className="text-left py-2 pr-4">Email</th>
                            <th className="text-left py-2 pr-4">Role</th>
                            <th className="text-left py-2 pr-4">User ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {usersLoading ? (
                            <tr>
                              <td className="py-4 text-gray-500" colSpan={3}>
                                Načítání…
                              </td>
                            </tr>
                          ) : users.length === 0 ? (
                            <tr>
                              <td className="py-4 text-gray-500" colSpan={3}>
                                Žádní uživatelé.
                              </td>
                            </tr>
                          ) : (
                            users.map((u) => (
                              <tr key={u.user_id}>
                                <td className="py-3 pr-4 text-gray-800">{u.email || '—'}</td>
                                <td className="py-3 pr-4 text-gray-700">{u.role}</td>
                                <td className="py-3 pr-4 font-mono text-xs text-gray-600">{u.user_id}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              );
            }

            if (s === 'domains') {
              return (
                <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Domény</h2>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        value={domainValue}
                        onChange={(e) => setDomainValue(e.target.value)}
                        placeholder="např. klient.cz nebo klient.localhost"
                        className={inputClass}
                      />
                      <select value={domainType} onChange={(e) => setDomainType(e.target.value === 'admin' ? 'admin' : 'web')} className={selectClass}>
                        <option value="web">web</option>
                        <option value="admin">admin</option>
                      </select>
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-600 flex items-center gap-2">
                          <input type="checkbox" checked={domainPrimary} onChange={(e) => setDomainPrimary(e.target.checked)} />
                          Primary
                        </label>
                        <button
                          type="button"
                          disabled={busy || !domainValue.trim()}
                          onClick={() => void addDomain()}
                          className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Přidat
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                          <tr>
                            <th className="text-left py-2 pr-4">Doména</th>
                            <th className="text-left py-2 pr-4">Typ</th>
                            <th className="text-left py-2 pr-4">Primary</th>
                            <th className="text-left py-2 pr-4">Redirect</th>
                            <th className="text-left py-2 pr-4">Updated</th>
                            <th className="text-right py-2 pl-4">Akce</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(data.domains ?? []).map((d) => (
                            <tr key={d.id}>
                              <td className="py-3 pr-4 font-mono text-xs text-gray-800">{d.domain}</td>
                              <td className="py-3 pr-4 text-gray-700">{d.type}</td>
                              <td className="py-3 pr-4 text-gray-700">{d.is_primary ? 'ano' : 'ne'}</td>
                              <td className="py-3 pr-4 text-gray-700">{d.redirect_to_primary ? 'ano' : 'ne'}</td>
                              <td className="py-3 pr-4 text-gray-700">{fmtDate(d.updated_at)}</td>
                              <td className="py-3 pl-4 text-right">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void deleteDomain(d.id)}
                                  className="px-3 py-2 text-xs font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Smazat
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              );
            }

            if (s === 'template') {
              return (
                <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Šablona / verze</h2>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Šablona</label>
                        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={selectClass}>
                          {TEMPLATE_OPTIONS.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Verze</label>
                        <input
                          type="number"
                          min={1}
                          value={templateVersion}
                          onChange={(e) => setTemplateVersion(Math.max(1, parseInt(e.target.value || '1', 10)))}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void saveTemplate()}
                        className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Uložit
                      </button>
                      <div className="text-xs text-gray-500">
                        Aktuálně v DB: {(data.template.id ?? '—')} {data.template.version ? `v${data.template.version}` : ''}
                      </div>
                    </div>
                  </div>
                </section>
              );
            }

            if (s === 'content') {
              return (
                <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Content operations</h2>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void seed(false)}
                        className="px-4 py-2 text-sm font-semibold rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Seed lorem (safe)
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void seed(true)}
                        className="px-4 py-2 text-sm font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Seed lorem (overwrite)
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Safe doplní jen prázdné hodnoty. Overwrite přepíše všechno lorem ipsum (destruktivní).
                    </p>
                  </div>
                </section>
              );
            }

            // overview (default)
            return (
              <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Overview</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Název</label>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Status</label>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className={selectClass}>
                        <option value="active">active</option>
                        <option value="paused">paused</option>
                        <option value="deleted">deleted</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Internal notes</label>
                    <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className={inputClass} rows={4} />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void saveOverview()}
                      className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Uložit
                    </button>
                    <a
                      href={cmsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 text-sm font-semibold rounded-md border border-gray-200 bg-white hover:bg-gray-50"
                    >
                      Otevřít CMS
                    </a>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      <span className="font-mono">admin_subdomain</span>: {data.tenant.admin_subdomain}
                    </div>
                    <div>
                      <span className="font-mono">custom_domain</span>: {data.tenant.custom_domain ?? '—'}
                    </div>
                    <div>
                      <span className="font-mono">updated</span>: {fmtDate(data.tenant.updated_at)}
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}
        </div>
      )}
    </div>
  );
}


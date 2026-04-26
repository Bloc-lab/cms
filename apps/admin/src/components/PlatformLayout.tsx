import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function userInitials(email: string | undefined): string {
  if (!email) return '?';
  const local = email.split('@')[0] ?? email;
  const parts = local.split(/[.\s_-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export default function PlatformLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Platform admin</div>
            <div className="text-sm font-semibold text-gray-900 truncate">Tenants</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline max-w-[220px] truncate text-sm text-gray-500" title={user?.email ?? ''}>
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
        </div>
      </header>

      <main>
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


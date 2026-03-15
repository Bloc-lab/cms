import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex gap-6">
            <Link to="/" className="text-lg font-semibold text-gray-800 hover:text-gray-600">
              Nase CMS
            </Link>
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Obsah
            </Link>
            <Link to="/media" className="text-gray-600 hover:text-gray-900">
              Média
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Odhlásit
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

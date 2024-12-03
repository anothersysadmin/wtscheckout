import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Monitor } from 'lucide-react';
import { useAuth } from '../contexts/auth-context';
import { AccountMenu } from './account-menu';

export function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user?.isAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            aria-label="Go to homepage"
          >
            <Monitor className="h-8 w-8 text-sky-500" />
            <h1 className="text-xl font-semibold text-gray-900">
              WTS Device Management
            </h1>
          </Link>
          {user && <AccountMenu />}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Washington Township Schools
          </p>
          {user?.isAdmin && (
            <button
              onClick={handleAdminClick}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Admin Portal
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

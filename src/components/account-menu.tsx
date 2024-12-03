import { User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/auth-context';

export function AccountMenu() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="relative">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <User className="h-5 w-5" />
          <span>{user.username}</span>
        </div>
        <button
          onClick={signOut}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

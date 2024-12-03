import { Link, Outlet, useLocation } from 'react-router-dom';
import { Database, Building2, Calendar, Wrench } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AdminLayout() {
  const location = useLocation();

  const navigation = [
    { name: 'Device Inventory', href: '/admin/dashboard/inventory', icon: Database },
    { name: 'Schools', href: '/admin/dashboard/schools', icon: Building2 },
    { name: 'Device Logs', href: '/admin/dashboard/logs', icon: Calendar },
    { name: 'Repair Tickets', href: '/admin/dashboard/repair-tickets', icon: Wrench }
  ];

  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-white border-r">
        <nav className="flex flex-col h-full">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900">Admin Portal</h2>
          </div>
          <div className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md',
                    isActive
                      ? 'bg-sky-50 text-sky-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5',
                      isActive ? 'text-sky-500' : 'text-gray-400'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      <div className="flex-1 min-w-0 bg-gray-50">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

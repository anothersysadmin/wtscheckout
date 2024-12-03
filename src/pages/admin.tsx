import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';

export function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only allow admin users to access the admin dashboard
    if (user?.isAdmin) {
      navigate('/admin/dashboard/inventory');
    } else {
      navigate('/');
    }
  }, [user, navigate]);

  return null;
}

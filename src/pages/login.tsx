import { LoginForm } from '../components/login-form';
import { useAuth } from '../contexts/auth-context';
import { Navigate } from 'react-router-dom';

export function LoginPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <LoginForm />;
}

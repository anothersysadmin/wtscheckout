import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type User = {
  username: string;
  isAdmin: boolean;
  lastLogin: number;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const AUTH_STORAGE_KEY = 'auth_session';

const CREDENTIALS = {
  admin: {
    username: 'admin',
    password: import.meta.env.VITE_ADMIN_PASSWORD || "where'dtheyallgo?",
    isAdmin: true
  },
  checkout: {
    username: 'checkout',
    password: import.meta.env.VITE_CHECKOUT_PASSWORD || 'chromebooks@51',
    isAdmin: false
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        const elapsed = Date.now() - session.lastLogin;
        if (elapsed < SESSION_TIMEOUT) {
          return session;
        }
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (error) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    return null;
  });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check session timeout periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        const elapsed = Date.now() - user.lastLogin;
        if (elapsed >= SESSION_TIMEOUT) {
          signOut();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user]);

  // Update lastLogin periodically to keep session alive during activity
  useEffect(() => {
    if (user) {
      const activity = () => {
        const newSession = { ...user, lastLogin: Date.now() };
        setUser(newSession);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newSession));
      };

      window.addEventListener('mousemove', activity);
      window.addEventListener('keydown', activity);

      return () => {
        window.removeEventListener('mousemove', activity);
        window.removeEventListener('keydown', activity);
      };
    }
  }, [user]);

  const signIn = async (username: string, password: string) => {
    const userCredentials = Object.values(CREDENTIALS).find(
      cred => cred.username === username
    );

    if (userCredentials && userCredentials.password === password) {
      const newSession = {
        username: userCredentials.username,
        isAdmin: userCredentials.isAdmin,
        lastLogin: Date.now()
      };
      setUser(newSession);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newSession));
      
      if (userCredentials.isAdmin) {
        navigate('/admin/dashboard/inventory');
      } else {
        navigate('/');
      }
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

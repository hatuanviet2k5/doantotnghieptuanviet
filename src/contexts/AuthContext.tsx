import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, ReaderCard } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  readerCard: ReaderCard | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: Role | Role[]) => boolean;
  setReaderCard: (card: ReaderCard | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [readerCard, setReaderCard] = useState<ReaderCard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedCard = localStorage.getItem('readerCard');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedCard) {
          setReaderCard(JSON.parse(storedCard));
        }
      }
    } catch (e) {
      console.error('Error restoring session from localStorage:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.login(username, password);
      setUser(res.user);
      setToken(res.token);
      setReaderCard(res.readerCard || null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    setReaderCard(null);
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        readerCard,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        hasRole,
        setReaderCard,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

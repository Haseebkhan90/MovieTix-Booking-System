import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { AuthUser } from '../types';

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isStaff: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ user: AuthUser | null }>('/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await api<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const isStaff = Boolean(user && ['STAFF', 'MANAGER', 'TENANT_ADMIN', 'PLATFORM_ADMIN'].includes(user.role));

  const value = useMemo(
    () => ({ user, loading, login, register, logout, isStaff }),
    [user, loading, login, register, logout, isStaff]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

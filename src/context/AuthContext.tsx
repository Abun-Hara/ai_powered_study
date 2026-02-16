import { createContext, useContext, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthContextValue {
  user: ReturnType<typeof useAuthStore.getState>['user'];
  token: string | null;
  refreshToken: string | null;
  isInitializing: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (patch: { name: string; username?: string; avatarUrl?: string; phone?: string; bio?: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initialize = useAuthStore((state) => state.initialize);
  const syncSession = useAuthStore((state) => state.syncSession);

  useEffect(() => {
    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      void syncSession(session);
    });

    return () => subscription.unsubscribe();
  }, [initialize, syncSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      refreshToken,
      isInitializing,
      login,
      register,
      updateProfile,
      logout,
      isAuthenticated,
      hasRole: (role: UserRole) => user?.role === role,
    }),
    [user, token, refreshToken, isInitializing, login, register, updateProfile, logout, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

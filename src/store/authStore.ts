import { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { create } from 'zustand';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  username: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  initialize: () => Promise<void>;
  syncSession: (session: Session | null) => Promise<void>;
  login: (email: string, password: string, _rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (patch: Pick<User, 'name' | 'username' | 'avatarUrl' | 'phone' | 'bio'>) => Promise<void>;
  logout: () => Promise<void>;
}

function normalizeRole(role: string | null | undefined): UserRole {
  return role === 'admin' ? 'admin' : 'student';
}

function toAppUser(authUser: SupabaseAuthUser, profile: UserRow): User {
  return {
    id: authUser.id,
    email: authUser.email ?? profile.email,
    name: profile.name,
    role: normalizeRole(profile.role),
    username: profile.username ?? undefined,
    avatarUrl: profile.avatar_url ?? undefined,
    phone: profile.phone ?? undefined,
    bio: profile.bio ?? undefined,
  };
}

async function ensureProfile(authUser: SupabaseAuthUser): Promise<UserRow> {
  const { data: profile, error } = await supabase
    .from('users')
    .select('id, email, name, role, username, avatar_url, phone, bio')
    .eq('id', authUser.id)
    .maybeSingle<UserRow>();

  if (error) {
    throw error;
  }

  if (profile) {
    return profile;
  }

  const fallbackName =
    (authUser.user_metadata?.name as string | undefined) ??
    (authUser.user_metadata?.full_name as string | undefined) ??
    authUser.email?.split('@')[0] ??
    'Student';

  const fallbackRole = normalizeRole(authUser.user_metadata?.role as string | undefined);

  const { data: inserted, error: insertError } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      email: authUser.email ?? '',
      name: fallbackName,
      role: fallbackRole === 'admin' ? 'admin' : 'user',
    })
    .select('id, email, name, role, username, avatar_url, phone, bio')
    .single<UserRow>();

  if (insertError || !inserted) {
    throw insertError ?? new Error('Failed to create profile');
  }

  return inserted;
}

function applySessionState(set: (partial: Partial<AuthState>) => void, user: User, session: Session) {
  set({
    user,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    isAuthenticated: true,
    isInitializing: false,
  });
}

function clearSessionState(set: (partial: Partial<AuthState>) => void) {
  set({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isInitializing: false,
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isInitializing: true,

  initialize: async () => {
    set({ isInitializing: true });
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      clearSessionState(set);
      return;
    }

    await get().syncSession(data.session);
  },

  syncSession: async (session) => {
    if (!session) {
      clearSessionState(set);
      return;
    }

    try {
      const profile = await ensureProfile(session.user);
      const user = toAppUser(session.user, profile);
      applySessionState(set, user, session);
    } catch {
      clearSessionState(set);
    }
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      throw error ?? new Error('Login failed');
    }

    await get().syncSession(data.session);
  },

  register: async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error('Account created. Confirm your email, then log in.');
    }

    await get().syncSession(data.session);
  },

  updateProfile: async (patch) => {
    const current = get().user;
    if (!current) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: current.id,
        email: current.email,
        name: patch.name,
        username: patch.username ?? null,
        avatar_url: patch.avatarUrl ?? null,
        phone: patch.phone ?? null,
        bio: patch.bio ?? null,
      }, { onConflict: 'id' })
      .select('id, email, name, role, username, avatar_url, phone, bio')
      .single<UserRow>();

    if (error || !data) {
      throw error ?? new Error('Failed to update profile');
    }

    set({
      user: {
        id: current.id,
        email: current.email,
        name: data.name,
        role: normalizeRole(data.role),
        username: data.username ?? undefined,
        avatarUrl: data.avatar_url ?? undefined,
        phone: data.phone ?? undefined,
        bio: data.bio ?? undefined,
      },
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    clearSessionState(set);
  },
}));

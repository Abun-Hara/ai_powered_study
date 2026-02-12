import { create } from 'zustand';
import { User, UserRole } from '../types';
import { ensureManagedUser, findManagedUserByEmail } from '../features/admin/api';

type PersistMode = 'local' | 'session';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  persistMode: PersistMode;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (patch: Pick<User, 'name' | 'username' | 'avatarUrl' | 'phone' | 'bio'>) => void;
  logout: () => void;
  setSession: (session: {
    user: User;
    accessToken: string;
    refreshToken: string;
    rememberMe?: boolean;
  }) => void;
}

const AUTH_STORAGE_KEY = 'study_planner_auth_state_v2';

interface PersistedAuth {
  user: User;
  accessToken: string;
  refreshToken: string;
}

function readPersistedAuth(): { mode: PersistMode; auth: PersistedAuth } | null {
  const local = localStorage.getItem(AUTH_STORAGE_KEY);
  if (local) {
    return { mode: 'local', auth: JSON.parse(local) as PersistedAuth };
  }

  const session = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (session) {
    return { mode: 'session', auth: JSON.parse(session) as PersistedAuth };
  }

  return null;
}

function persistAuth(mode: PersistMode, payload: PersistedAuth) {
  if (mode === 'local') {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function clearPersistedAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

const initial = readPersistedAuth();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initial?.auth.user ?? null,
  accessToken: initial?.auth.accessToken ?? null,
  refreshToken: initial?.auth.refreshToken ?? null,
  persistMode: initial?.mode ?? 'local',
  isAuthenticated: Boolean(initial?.auth.user && initial?.auth.accessToken),

  setSession: ({ user, accessToken, refreshToken, rememberMe = true }) => {
    const mode: PersistMode = rememberMe ? 'local' : 'session';
    persistAuth(mode, { user, accessToken, refreshToken });
    set({ user, accessToken, refreshToken, persistMode: mode, isAuthenticated: true });
  },

  login: async (email: string, _password: string, rememberMe = true) => {
    const managed = findManagedUserByEmail(email);
    if (managed?.status === 'suspended') {
      throw new Error('Account is suspended');
    }

    const role: UserRole = managed?.role ?? (email.includes('admin') ? 'admin' : 'student');
    const user: User = {
      id: managed?.id ?? crypto.randomUUID(),
      name: managed?.name ?? (role === 'admin' ? 'Admin User' : 'Student User'),
      email,
      role,
      username: managed?.username,
      avatarUrl: managed?.avatarUrl,
      phone: managed?.phone,
      bio: managed?.bio,
    };

    const accessToken = `access_demo_${Date.now()}`;
    const refreshToken = `refresh_demo_${Date.now()}`;

    get().setSession({ user, accessToken, refreshToken, rememberMe });
    ensureManagedUser(user);
  },

  register: async (name: string, email: string, _password: string) => {
    const user: User = {
      id: crypto.randomUUID(),
      name,
      email,
      role: 'student',
    };

    const accessToken = `access_demo_${Date.now()}`;
    const refreshToken = `refresh_demo_${Date.now()}`;

    get().setSession({ user, accessToken, refreshToken, rememberMe: true });
    ensureManagedUser(user);
  },

  updateProfile: (patch) => {
    const state = get();
    if (!state.user) return;

    const nextUser: User = { ...state.user, ...patch };
    persistAuth(state.persistMode, {
      user: nextUser,
      accessToken: state.accessToken ?? '',
      refreshToken: state.refreshToken ?? '',
    });
    set({ user: nextUser });
  },

  logout: () => {
    clearPersistedAuth();
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));

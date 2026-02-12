import { ManagedUser, UserStatus } from './types';
import { User, UserRole } from '../../types';

const USERS_KEY = 'study_planner_managed_users_v1';

const seedUsers: ManagedUser[] = [
  {
    id: 'u-admin',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    username: 'admin.master',
    avatarUrl: '',
    phone: '+1 555-0101',
    status: 'active',
    joinedAt: '2026-01-10',
    lastActiveAt: '2026-02-12',
    bio: 'Platform administrator',
  },
  {
    id: 'u-student-1',
    name: 'Alice Brown',
    email: 'alice@college.edu',
    role: 'student',
    username: 'alice.b',
    avatarUrl: '',
    phone: '+1 555-0113',
    status: 'active',
    joinedAt: '2026-01-18',
    lastActiveAt: '2026-02-11',
    bio: 'Computer science undergrad focused on data systems.',
  },
  {
    id: 'u-student-2',
    name: 'Mark Chen',
    email: 'mark@college.edu',
    role: 'student',
    username: 'mark.c',
    avatarUrl: '',
    phone: '+1 555-0142',
    status: 'suspended',
    joinedAt: '2026-01-22',
    lastActiveAt: '2026-02-05',
    bio: 'Preparing for systems design interviews.',
  },
];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readUsers(): ManagedUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
    return seedUsers;
  }
  return JSON.parse(raw) as ManagedUser[];
}

function writeUsers(users: ManagedUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function fetchManagedUsers() {
  await wait(200);
  return readUsers();
}

export function findManagedUserByEmail(email: string) {
  return readUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function ensureManagedUser(user: User) {
  const users = readUsers();
  const existing = users.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (existing) {
    return existing;
  }

  const next: ManagedUser = {
    id: user.id || crypto.randomUUID(),
    name: user.name,
    email: user.email,
    role: user.role,
    username: user.username,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    status: 'active',
    joinedAt: new Date().toISOString().slice(0, 10),
    lastActiveAt: new Date().toISOString().slice(0, 10),
    bio: user.bio ?? 'Newly registered user',
  };
  writeUsers([next, ...users]);
  return next;
}

export async function fetchManagedUserByEmail(email: string) {
  await wait(120);
  return findManagedUserByEmail(email);
}

export async function updateManagedUserProfile(input: {
  email: string;
  patch: Pick<ManagedUser, 'name' | 'username' | 'avatarUrl' | 'phone' | 'bio'>;
}) {
  await wait(180);
  const { email, patch } = input;
  const users = readUsers();
  const next = users.map((u) =>
    u.email.toLowerCase() === email.toLowerCase()
      ? { ...u, ...patch, lastActiveAt: new Date().toISOString().slice(0, 10) }
      : u
  );
  writeUsers(next);
  return next.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function updateManagedUserRole(userId: string, role: UserRole) {
  await wait(180);
  const users = readUsers();
  const next = users.map((u) => (u.id === userId ? { ...u, role } : u));
  writeUsers(next);
  return next;
}

export async function updateManagedUserStatus(userId: string, status: UserStatus) {
  await wait(180);
  const users = readUsers();
  const next = users.map((u) => (u.id === userId ? { ...u, status } : u));
  writeUsers(next);
  return next;
}

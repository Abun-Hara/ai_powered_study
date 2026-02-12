import { UserRole } from '../../types';

export type UserStatus = 'active' | 'suspended';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  username?: string;
  avatarUrl?: string;
  phone?: string;
  status: UserStatus;
  joinedAt: string;
  lastActiveAt: string;
  bio: string;
}

import { UserRole } from '../../types';

export interface RoleCapabilities {
  canManageOwnCourses: boolean;
  canManageStudyPlanner: boolean;
  canUseAI: boolean;
  canViewPersonalAnalytics: boolean;
  canManageProfile: boolean;
  canAccessAdminDashboard: boolean;
  canManageUsers: boolean;
  canViewSystemAnalytics: boolean;
  canModerateContent: boolean;
  canManageSystemSettings: boolean;
  canControlAILimits: boolean;
}

export const roleCapabilities: Record<UserRole, RoleCapabilities> = {
  student: {
    canManageOwnCourses: true,
    canManageStudyPlanner: true,
    canUseAI: true,
    canViewPersonalAnalytics: true,
    canManageProfile: true,
    canAccessAdminDashboard: false,
    canManageUsers: false,
    canViewSystemAnalytics: false,
    canModerateContent: false,
    canManageSystemSettings: false,
    canControlAILimits: false,
  },
  admin: {
    canManageOwnCourses: false,
    canManageStudyPlanner: false,
    canUseAI: false,
    canViewPersonalAnalytics: false,
    canManageProfile: true,
    canAccessAdminDashboard: true,
    canManageUsers: true,
    canViewSystemAnalytics: true,
    canModerateContent: true,
    canManageSystemSettings: true,
    canControlAILimits: true,
  },
};

export function getRoleCapabilities(role: UserRole) {
  return roleCapabilities[role];
}


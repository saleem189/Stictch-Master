import { UserRole } from '../types';

export function getRoleLandingPath(role?: UserRole | null): string {
  if (role === 'admin' || role === 'employee') return '/admin';
  if (role === 'client') return '/client';
  return '/';
}

export function canAccessAdminRoutes(role?: UserRole | null): boolean {
  return role === 'admin' || role === 'employee';
}

export function canAccessClientRoutes(role?: UserRole | null): boolean {
  return role === 'client';
}

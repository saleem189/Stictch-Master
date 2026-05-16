import { describe, expect, it } from 'vitest';
import { canAccessAdminRoutes, canAccessClientRoutes, getRoleLandingPath } from './roleRouting';

describe('role routing', () => {
  it('routes admins and employees to admin', () => {
    expect(getRoleLandingPath('admin')).toBe('/admin');
    expect(getRoleLandingPath('employee')).toBe('/admin');
  });

  it('routes clients to the client portal', () => {
    expect(getRoleLandingPath('client')).toBe('/client');
  });

  it('falls back to the public homepage when role is unknown', () => {
    expect(getRoleLandingPath(undefined)).toBe('/');
  });

  it('protects admin routes from clients', () => {
    expect(canAccessAdminRoutes('admin')).toBe(true);
    expect(canAccessAdminRoutes('employee')).toBe(true);
    expect(canAccessAdminRoutes('client')).toBe(false);
  });

  it('protects client routes from staff roles', () => {
    expect(canAccessClientRoutes('client')).toBe(true);
    expect(canAccessClientRoutes('admin')).toBe(false);
    expect(canAccessClientRoutes('employee')).toBe(false);
  });
});

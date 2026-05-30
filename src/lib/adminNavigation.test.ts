import { describe, expect, it } from 'vitest';
import {
  getAdminNavGroups,
  getPrimaryMobileAdminNavItems,
  isAdminNavItemVisible,
} from './adminNavigation';

describe('adminNavigation', () => {
  it('hides admin-only modules from employees', () => {
    expect(isAdminNavItemVisible({ adminOnly: true }, false)).toBe(false);
    expect(isAdminNavItemVisible({ adminOnly: false }, false)).toBe(true);
  });

  it('shows all modules to admins', () => {
    expect(isAdminNavItemVisible({ adminOnly: true }, true)).toBe(true);
    expect(isAdminNavItemVisible({ adminOnly: false }, true)).toBe(true);
  });

  it('keeps mobile navigation focused on primary operational modules', () => {
    const groups = getAdminNavGroups(true);
    expect(getPrimaryMobileAdminNavItems(groups).map(item => item.to)).toEqual([
      '/admin',
      '/admin/orders',
      '/admin/quotes',
      '/admin/clients',
      '/admin/inventory',
    ]);
  });

  it('groups restricted modules separately for admins', () => {
    const groups = getAdminNavGroups(true);
    expect(groups.admin.map(item => item.to)).toEqual([
      '/admin/vendors',
      '/admin/accounting',
      '/admin/employees',
      '/admin/branches',
    ]);
  });

  it('removes restricted group items for employees', () => {
    const groups = getAdminNavGroups(false);
    expect(groups.admin).toEqual([]);
    expect(groups.primary.some(item => item.to === '/admin/accounting')).toBe(false);
  });
});

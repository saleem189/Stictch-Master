import { describe, expect, it } from 'vitest';
import { adminPageLoaders, publicPageLoaders } from './routeModules';

describe('route module loaders', () => {
  it('lists every public/client page routed by App', () => {
    expect(Object.keys(publicPageLoaders).sort()).toEqual([
      'clientDashboard',
      'home',
      'requestQuote',
    ]);
  });

  it('lists every admin page routed by App', () => {
    expect(Object.keys(adminPageLoaders).sort()).toEqual([
      'accounting',
      'appointments',
      'branches',
      'clients',
      'dashboard',
      'employees',
      'inventory',
      'orders',
      'profile',
      'quoteRequests',
      'vendors',
    ]);
  });
});

export type AdminNavSection = 'primary' | 'admin' | 'account';

export interface AdminNavItemConfig {
  to: string;
  labelKey: string;
  adminOnly: boolean;
  section: AdminNavSection;
  mobilePrimary?: boolean;
}

export interface AdminNavGroups {
  primary: AdminNavItemConfig[];
  admin: AdminNavItemConfig[];
  account: AdminNavItemConfig[];
}

export const adminNavItems: AdminNavItemConfig[] = [
  { to: '/admin', labelKey: 'Dashboard', adminOnly: false, section: 'primary', mobilePrimary: true },
  { to: '/admin/orders', labelKey: 'Work Orders', adminOnly: false, section: 'primary', mobilePrimary: true },
  { to: '/admin/quotes', labelKey: 'Quote Review', adminOnly: false, section: 'primary', mobilePrimary: true },
  { to: '/admin/clients', labelKey: 'Clients', adminOnly: false, section: 'primary', mobilePrimary: true },
  { to: '/admin/appointments', labelKey: 'Appointments', adminOnly: false, section: 'primary' },
  { to: '/admin/inventory', labelKey: 'Inventory', adminOnly: false, section: 'primary', mobilePrimary: true },
  { to: '/admin/vendors', labelKey: 'Vendors', adminOnly: true, section: 'admin' },
  { to: '/admin/accounting', labelKey: 'General Ledger', adminOnly: true, section: 'admin' },
  { to: '/admin/employees', labelKey: 'Employees', adminOnly: true, section: 'admin' },
  { to: '/admin/branches', labelKey: 'Branches', adminOnly: true, section: 'admin' },
  { to: '/admin/profile', labelKey: 'My Profile', adminOnly: false, section: 'account' },
];

export function isAdminNavItemVisible(item: Pick<AdminNavItemConfig, 'adminOnly'>, isAdmin: boolean): boolean {
  return !item.adminOnly || isAdmin;
}

export function getAdminNavGroups(isAdmin: boolean): AdminNavGroups {
  return adminNavItems.reduce<AdminNavGroups>(
    (groups, item) => {
      if (!isAdminNavItemVisible(item, isAdmin)) return groups;
      groups[item.section].push(item);
      return groups;
    },
    { primary: [], admin: [], account: [] }
  );
}

export function getPrimaryMobileAdminNavItems(groups: AdminNavGroups): AdminNavItemConfig[] {
  return [...groups.primary, ...groups.account].filter(item => item.mobilePrimary);
}

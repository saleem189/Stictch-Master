export const publicPageLoaders = {
  home: () => import('../pages/Home'),
  clientDashboard: () => import('../pages/ClientDashboard'),
  requestQuote: () => import('../pages/RequestQuote'),
};

export const adminPageLoaders = {
  dashboard: () => import('../pages/Dashboard'),
  orders: () => import('../pages/Orders'),
  quoteRequests: () => import('../pages/QuoteRequests'),
  clients: () => import('../pages/Clients'),
  appointments: () => import('../pages/Appointments'),
  inventory: () => import('../pages/Inventory'),
  vendors: () => import('../pages/Vendors'),
  accounting: () => import('../pages/Accounting'),
  employees: () => import('../pages/Employees'),
  branches: () => import('../pages/Branches'),
  profile: () => import('../pages/Profile'),
};

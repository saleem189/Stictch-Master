import {
  Account,
  Appointment,
  Branch,
  Client,
  Employee,
  FinancialDocument,
  InventoryItem,
  Notification,
  Order,
  QuoteRequest,
  RecurringTransaction,
  Task,
  Transaction,
  UserPermissions,
  UserProfile,
  Vendor,
  VendorBill,
} from '../types';

export const SEED_IDS = {
  adminUser: 'seed_admin_owner',
  cutterUser: 'seed_employee_cutter',
  stitcherUser: 'seed_employee_stitcher',
  clientUserA: 'seed_client_saleem',
  clientUserB: 'seed_client_ayesha',
  branchMain: 'seed_branch_lahore_hq',
  branchGulberg: 'seed_branch_gulberg',
  employeeCutter: 'seed_emp_master_saleem',
  employeeStitcher: 'seed_emp_zahid_stitcher',
  orderA: 'seed_order_saleem_wedding',
  orderB: 'seed_order_ayesha_suit',
  orderC: 'seed_order_saleem_alteration',
  accountCash: 'seed_account_cash',
  accountBank: 'seed_account_bank',
  accountReceivable: 'seed_account_receivable',
  accountSales: 'seed_account_sales',
  accountPayroll: 'seed_account_payroll',
  accountInventory: 'seed_account_inventory',
  accountVendorPayable: 'seed_account_vendor_payable',
  inventoryCream: 'seed_inventory_wash_wear_cream',
  inventoryLatha: 'seed_inventory_latha_white',
  inventoryButtons: 'seed_inventory_buttons_pearl',
  vendorFabric: 'seed_vendor_fabric_house',
};

export const adminPermissions: UserPermissions = {
  canEditMeasurements: true,
  canApprovePayroll: true,
  canProcessPayments: true,
  canAdjustInventory: true,
  canDeleteOrders: true,
  canViewFinancialReports: true,
  canManageEmployees: true,
  canManageSystemSettings: true,
  canManageInventory: true,
  canManageClients: true,
  canManageAccounting: true,
  canManageOrders: true,
};

export const employeePermissions: UserPermissions = {
  canEditMeasurements: true,
  canApprovePayroll: false,
  canProcessPayments: true,
  canAdjustInventory: true,
  canDeleteOrders: false,
  canViewFinancialReports: false,
  canManageEmployees: false,
  canManageSystemSettings: false,
  canManageInventory: true,
  canManageClients: true,
  canManageAccounting: false,
  canManageOrders: true,
};

export const clientPermissions: UserPermissions = {
  canEditMeasurements: false,
  canApprovePayroll: false,
  canProcessPayments: false,
  canAdjustInventory: false,
  canDeleteOrders: false,
  canViewFinancialReports: false,
  canManageEmployees: false,
  canManageSystemSettings: false,
  canManageInventory: false,
  canManageClients: false,
  canManageAccounting: false,
  canManageOrders: false,
};

export interface SeedData {
  users: UserProfile[];
  branches: Branch[];
  employees: Employee[];
  clients: Client[];
  inventory: InventoryItem[];
  vendors: Vendor[];
  vendorBills: VendorBill[];
  accounts: Account[];
  orders: Order[];
  tasks: Task[];
  appointments: Appointment[];
  quoteRequests: QuoteRequest[];
  transactions: Transaction[];
  financialDocuments: FinancialDocument[];
  recurringTransactions: RecurringTransaction[];
  notifications: Notification[];
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function addMonths(isoDate: string, months: number): string {
  const date = new Date(isoDate);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

export function buildSeedData(nowIso = new Date().toISOString()): SeedData {
  const currentMonth = nowIso.slice(0, 7);

  const branches: Branch[] = [
    {
      id: SEED_IDS.branchMain,
      name: 'Imperial Headquarters',
      location: 'DHA Phase 5, Lahore',
      address: 'Shop 12, Commercial Broadway, DHA Phase 5, Lahore',
      phone: '+92 42 3571 1200',
      email: 'hq@tailoringerp.local',
      manager: 'Rana Farooq',
      managerId: SEED_IDS.adminUser,
      isActive: true,
      createdAt: nowIso,
    },
    {
      id: SEED_IDS.branchGulberg,
      name: 'Gulberg Fitting Studio',
      location: 'Gulberg III, Lahore',
      address: 'MM Alam Road, Gulberg III, Lahore',
      phone: '+92 42 3571 1300',
      email: 'gulberg@tailoringerp.local',
      manager: 'Master Saleem',
      managerId: SEED_IDS.employeeCutter,
      isActive: true,
      createdAt: nowIso,
    },
  ];

  const employees: Employee[] = [
    {
      id: SEED_IDS.employeeCutter,
      name: 'Master Saleem',
      role: 'Head Cutter',
      salary: 85000,
      phone: '03001234567',
      email: 'cutter@tailoringerp.local',
      address: 'Model Town, Lahore',
      joinedAt: addMonths(nowIso, -18),
    },
    {
      id: SEED_IDS.employeeStitcher,
      name: 'Zahid Tailor',
      role: 'Senior Stitcher',
      salary: 52000,
      phone: '03007654321',
      email: 'stitcher@tailoringerp.local',
      address: 'Ichhra, Lahore',
      joinedAt: addMonths(nowIso, -11),
    },
  ];

  const clients: Client[] = [
    {
      id: SEED_IDS.clientUserA,
      name: 'Mian Saleem Ayoub',
      phone: '03218440001',
      email: 'saleem.client@tailoringerp.local',
      address: 'DHA Phase 5, Lahore',
      measurements: { neck: 15.5, chest: 42, waist: 36, shoulder: 18, sleeve: 24, length: 40, inseam: 31 },
      createdAt: addMonths(nowIso, -8),
    },
    {
      id: SEED_IDS.clientUserB,
      name: 'Ayesha Khan',
      phone: '03014450002',
      email: 'ayesha.client@tailoringerp.local',
      address: 'Gulberg III, Lahore',
      measurements: { neck: 13.5, chest: 36, waist: 30, hip: 39, shoulder: 15, sleeve: 22, length: 38 },
      createdAt: addMonths(nowIso, -5),
    },
  ];

  const users: UserProfile[] = [
    {
      uid: SEED_IDS.adminUser,
      email: 'owner@tailoringerp.local',
      role: 'admin',
      name: 'Rana Farooq',
      phone: '03000000001',
      branchId: SEED_IDS.branchMain,
      permissions: adminPermissions,
      createdAt: nowIso,
    },
    {
      uid: SEED_IDS.cutterUser,
      email: 'cutter@tailoringerp.local',
      role: 'employee',
      employeeId: SEED_IDS.employeeCutter,
      name: 'Master Saleem',
      phone: '03001234567',
      branchId: SEED_IDS.branchGulberg,
      permissions: employeePermissions,
      createdAt: nowIso,
    },
    {
      uid: SEED_IDS.stitcherUser,
      email: 'stitcher@tailoringerp.local',
      role: 'employee',
      employeeId: SEED_IDS.employeeStitcher,
      name: 'Zahid Tailor',
      phone: '03007654321',
      branchId: SEED_IDS.branchMain,
      permissions: employeePermissions,
      createdAt: nowIso,
    },
    {
      uid: SEED_IDS.clientUserA,
      email: 'saleem.client@tailoringerp.local',
      role: 'client',
      clientId: SEED_IDS.clientUserA,
      name: 'Mian Saleem Ayoub',
      phone: '03218440001',
      address: 'DHA Phase 5, Lahore',
      permissions: clientPermissions,
      createdAt: nowIso,
    },
    {
      uid: SEED_IDS.clientUserB,
      email: 'ayesha.client@tailoringerp.local',
      role: 'client',
      clientId: SEED_IDS.clientUserB,
      name: 'Ayesha Khan',
      phone: '03014450002',
      address: 'Gulberg III, Lahore',
      permissions: clientPermissions,
      createdAt: nowIso,
    },
  ];

  const accounts: Account[] = [
    { id: SEED_IDS.accountCash, code: '1001', name: 'Petty Cash', type: 'asset', balance: 50000 },
    { id: SEED_IDS.accountBank, code: '1002', name: 'Bank - Al-Falah', type: 'asset', balance: 250000 },
    { id: SEED_IDS.accountReceivable, code: '1100', name: 'Accounts Receivable', type: 'asset', balance: 45000 },
    { id: SEED_IDS.accountInventory, code: '1200', name: 'Fabric Inventory', type: 'asset', balance: 120000 },
    { id: SEED_IDS.accountVendorPayable, code: '2001', name: 'Vendor Payables', type: 'liability', balance: 32000 },
    { id: SEED_IDS.accountSales, code: '4001', name: 'Sales Revenue', type: 'revenue', balance: 0 },
    { id: SEED_IDS.accountPayroll, code: '5001', name: 'Payroll Expense', type: 'expense', balance: 0 },
  ];

  const inventory: InventoryItem[] = [
    { id: SEED_IDS.inventoryCream, name: 'Wash & Wear - Cream', category: 'Fabric', quantity: 45, unit: 'meters', minLevel: 10, pricePerUnit: 850, isRollTracked: true, lastUpdated: nowIso },
    { id: SEED_IDS.inventoryLatha, name: 'Latha - White', category: 'Fabric', quantity: 120, unit: 'meters', minLevel: 20, pricePerUnit: 650, isRollTracked: true, lastUpdated: nowIso },
    { id: SEED_IDS.inventoryButtons, name: 'Mother of Pearl Buttons', category: 'Notions', quantity: 8, unit: 'pieces', minLevel: 24, pricePerUnit: 45, isRollTracked: false, lastUpdated: nowIso },
  ];

  const orders: Order[] = [
    {
      id: SEED_IDS.orderA,
      clientId: SEED_IDS.clientUserA,
      clientName: 'Mian Saleem Ayoub',
      clientPhone: '03218440001',
      branchId: SEED_IDS.branchMain,
      status: 'in-progress',
      totalAmount: 12500,
      paidAmount: 5000,
      advancePayment: 5000,
      assignedTo: SEED_IDS.employeeStitcher,
      dueDate: addDays(nowIso, 7).slice(0, 10),
      createdAt: addDays(nowIso, -3),
      updatedAt: nowIso,
      taskStatus: { cutting: 'completed', stitching: 'in-progress', finishing: 'pending' },
      auditTrail: [{ action: 'create', actor: 'Rana Farooq', timestamp: addDays(nowIso, -3), details: 'Wedding shalwar kameez order created' }],
      items: [
        {
          id: 'seed_order_a_item_1',
          type: 'Shalwar Kameez',
          description: 'Cream wash-and-wear formal set',
          price: 12500,
          assignedTo: SEED_IDS.employeeStitcher,
          status: 'stitching',
          dueDate: addDays(nowIso, 7).slice(0, 10),
          measurements: clients[0].measurements,
          fabricUsage: [{ inventoryId: SEED_IDS.inventoryCream, lengthUsed: 4.5 }],
        },
      ],
    },
    {
      id: SEED_IDS.orderB,
      clientId: SEED_IDS.clientUserB,
      clientName: 'Ayesha Khan',
      clientPhone: '03014450002',
      branchId: SEED_IDS.branchGulberg,
      status: 'ready',
      totalAmount: 42000,
      paidAmount: 42000,
      advancePayment: 20000,
      assignedTo: SEED_IDS.employeeCutter,
      dueDate: addDays(nowIso, 2).slice(0, 10),
      createdAt: addDays(nowIso, -21),
      updatedAt: nowIso,
      taskStatus: { cutting: 'completed', stitching: 'completed', finishing: 'completed' },
      auditTrail: [{ action: 'status', actor: 'Master Saleem', timestamp: nowIso, details: 'Order marked ready for collection' }],
      items: [
        {
          id: 'seed_order_b_item_1',
          type: 'Suit',
          description: 'Navy formal two-piece suit',
          price: 42000,
          assignedTo: SEED_IDS.employeeCutter,
          status: 'ready',
          dueDate: addDays(nowIso, 2).slice(0, 10),
          measurements: clients[1].measurements,
        },
      ],
    },
    {
      id: SEED_IDS.orderC,
      clientId: SEED_IDS.clientUserA,
      clientName: 'Mian Saleem Ayoub',
      clientPhone: '03218440001',
      branchId: SEED_IDS.branchMain,
      status: 'pending',
      totalAmount: 3500,
      paidAmount: 0,
      assignedTo: SEED_IDS.employeeCutter,
      dueDate: addDays(nowIso, 4).slice(0, 10),
      createdAt: addDays(nowIso, -1),
      updatedAt: nowIso,
      auditTrail: [{ action: 'create', actor: 'Rana Farooq', timestamp: addDays(nowIso, -1), details: 'Alteration request registered' }],
      items: [
        {
          id: 'seed_order_c_item_1',
          type: 'Alteration',
          description: 'Waist and sleeve adjustment',
          price: 3500,
          assignedTo: SEED_IDS.employeeCutter,
          status: 'measurement',
          dueDate: addDays(nowIso, 4).slice(0, 10),
          measurements: clients[0].measurements,
          isAlterationLoop: true,
        },
      ],
    },
  ];

  const tasks: Task[] = [
    { id: 'seed_task_order_a_cutting', orderId: SEED_IDS.orderA, employeeId: SEED_IDS.employeeCutter, employeeName: 'Master Saleem', type: 'cutting', status: 'completed', startedAt: addDays(nowIso, -3), completedAt: addDays(nowIso, -2) },
    { id: 'seed_task_order_a_stitching', orderId: SEED_IDS.orderA, employeeId: SEED_IDS.employeeStitcher, employeeName: 'Zahid Tailor', type: 'stitching', status: 'in-progress', startedAt: addDays(nowIso, -1) },
    { id: 'seed_task_order_a_finishing', orderId: SEED_IDS.orderA, employeeId: SEED_IDS.employeeStitcher, employeeName: 'Zahid Tailor', type: 'finishing', status: 'pending' },
    { id: 'seed_task_order_b_finishing', orderId: SEED_IDS.orderB, employeeId: SEED_IDS.employeeCutter, employeeName: 'Master Saleem', type: 'finishing', status: 'completed', startedAt: addDays(nowIso, -3), completedAt: nowIso },
  ];

  const quoteRequests: QuoteRequest[] = [
    {
      id: 'seed_quote_ayesha_sherwani',
      clientId: SEED_IDS.clientUserB,
      clientName: 'Ayesha Khan',
      clientEmail: 'ayesha.client@tailoringerp.local',
      garmentType: 'Sherwani',
      styleNotes: 'Ivory reception sherwani with restrained gold embroidery.',
      preferredDueDate: addDays(nowIso, 30).slice(0, 10),
      budgetRange: '50000-100000',
      measurementSource: 'existing',
      inspirationNotes: 'Client prefers a clean collar and lighter embroidery near cuffs.',
      status: 'submitted',
      createdAt: addDays(nowIso, -1),
      updatedAt: addDays(nowIso, -1),
    },
    {
      id: 'seed_quote_saleem_waistcoat',
      clientId: SEED_IDS.clientUserA,
      clientName: 'Mian Saleem Ayoub',
      clientEmail: 'saleem.client@tailoringerp.local',
      garmentType: 'Waistcoat',
      styleNotes: 'Charcoal waistcoat for Eid, slim but comfortable fit.',
      preferredDueDate: addDays(nowIso, 18).slice(0, 10),
      budgetRange: '25000-50000',
      measurementSource: 'book-measurement',
      status: 'reviewed',
      reviewedBy: 'Master Saleem',
      reviewNotes: 'Book fresh measurement appointment before conversion.',
      createdAt: addDays(nowIso, -6),
      updatedAt: addDays(nowIso, -5),
    },
  ];

  const appointments: Appointment[] = [
    { id: 'seed_appointment_saleem_measurement', clientId: SEED_IDS.clientUserA, clientName: 'Mian Saleem Ayoub', type: 'measurement', status: 'scheduled', startTime: addDays(nowIso, 1), endTime: addDays(nowIso, 1), assignedTo: SEED_IDS.employeeCutter, notes: 'Confirm waistcoat measurements.', createdAt: nowIso },
    { id: 'seed_appointment_ayesha_trial', clientId: SEED_IDS.clientUserB, clientName: 'Ayesha Khan', type: 'trial', status: 'scheduled', startTime: addDays(nowIso, 2), endTime: addDays(nowIso, 2), assignedTo: SEED_IDS.employeeStitcher, orderId: SEED_IDS.orderB, notes: 'Final shoulder and sleeve check.', createdAt: nowIso },
  ];

  const transactions: Transaction[] = [
    { id: 'seed_txn_order_a_advance', date: addDays(nowIso, -3), description: 'Advance received for wedding shalwar kameez', amount: 5000, debitAccountId: SEED_IDS.accountCash, creditAccountId: SEED_IDS.accountSales, reference: SEED_IDS.orderA, type: 'sale' },
    { id: 'seed_txn_order_b_full', date: addDays(nowIso, -8), description: 'Final receipt for navy suit', amount: 42000, debitAccountId: SEED_IDS.accountBank, creditAccountId: SEED_IDS.accountSales, reference: SEED_IDS.orderB, type: 'sale' },
    { id: 'seed_txn_payroll_current', date: `${currentMonth}-01T09:00:00.000Z`, description: 'Monthly payroll accrual', amount: 137000, debitAccountId: SEED_IDS.accountPayroll, creditAccountId: SEED_IDS.accountBank, type: 'payroll' },
    { id: 'seed_txn_vendor_fabric', date: addDays(nowIso, -10), description: 'Fabric purchase from Premium Fabric House', amount: 32000, debitAccountId: SEED_IDS.accountInventory, creditAccountId: SEED_IDS.accountVendorPayable, type: 'purchase' },
  ];

  const financialDocuments: FinancialDocument[] = [
    { id: 'seed_fin_doc_order_a_receipt', type: 'receipt', clientId: SEED_IDS.clientUserA, clientName: 'Mian Saleem Ayoub', orderId: SEED_IDS.orderA, amount: 5000, date: addDays(nowIso, -3), status: 'paid', createdAt: addDays(nowIso, -3), createdBy: SEED_IDS.adminUser, auditTrail: ['Seed receipt created for order advance'] },
    { id: 'seed_fin_doc_order_b_final', type: 'final-invoice', clientId: SEED_IDS.clientUserB, clientName: 'Ayesha Khan', orderId: SEED_IDS.orderB, amount: 42000, date: addDays(nowIso, -8), status: 'paid', createdAt: addDays(nowIso, -8), createdBy: SEED_IDS.adminUser, auditTrail: ['Seed final invoice created'] },
  ];

  const vendors: Vendor[] = [
    { id: SEED_IDS.vendorFabric, name: 'Premium Fabric House', contactPerson: 'Imran Shah', phone: '03005550111', email: 'orders@premiumfabric.local', address: 'Liberty Market, Lahore', category: 'Fabric Supplier', balance: 32000 },
  ];

  const vendorBills: VendorBill[] = [
    { id: 'seed_vendor_bill_fabric_may', vendorId: SEED_IDS.vendorFabric, amount: 32000, paidAmount: 0, date: addDays(nowIso, -10), status: 'unpaid', items: [{ inventoryId: SEED_IDS.inventoryCream, quantity: 20, rate: 850 }, { inventoryId: SEED_IDS.inventoryLatha, quantity: 15, rate: 650 }] },
  ];

  const recurringTransactions: RecurringTransaction[] = [
    { id: 'seed_recurring_rent', description: 'Studio rent', amount: 75000, frequency: 'monthly', type: 'expense', category: 'Rent', debitAccountId: SEED_IDS.accountPayroll, creditAccountId: SEED_IDS.accountBank, startDate: currentMonth + '-01', nextDueDate: addMonths(nowIso, 1).slice(0, 10), status: 'active' },
  ];

  const notifications: Notification[] = [
    { id: 'seed_notification_admin_quote', userId: SEED_IDS.adminUser, title: 'New Quote Request', message: 'Ayesha Khan submitted a sherwani quote request.', type: 'info', read: false, channel: 'internal', status: 'sent', createdAt: addDays(nowIso, -1) },
    { id: 'seed_notification_client_ready', userId: SEED_IDS.clientUserB, title: 'Order Ready', message: 'Your navy formal suit is ready for final trial.', type: 'success', read: false, channel: 'internal', status: 'sent', createdAt: nowIso },
    { id: 'seed_notification_employee_task', userId: SEED_IDS.stitcherUser, title: 'Stitching Queue Updated', message: 'Wedding shalwar kameez is now assigned for stitching.', type: 'warning', read: false, channel: 'internal', status: 'sent', createdAt: addDays(nowIso, -1) },
  ];

  return {
    users,
    branches,
    employees,
    clients,
    inventory,
    vendors,
    vendorBills,
    accounts,
    orders,
    tasks,
    appointments,
    quoteRequests,
    transactions,
    financialDocuments,
    recurringTransactions,
    notifications,
  };
}

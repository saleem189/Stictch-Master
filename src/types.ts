export interface Measurements {
  neck?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  shoulder?: number;
  sleeve?: number;
  length?: number;
  inseam?: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  householdId?: string;
  measurements: Measurements;
  createdAt: string;
}

export interface Household {
  id: string;
  name: string; // e.g. "Ahmed Family"
  primaryContactName: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface MeasurementRecord {
  id: string;
  clientId: string;
  version: number;
  date: string;
  measurements: Measurements;
  recordedBy: string; // Employee ID
  notes?: string;
  garmentType?: string; // Optional: specific measurements for a specific garment type
}

export interface OrderItem {
  id: string;
  type: string; // e.g. "Shalwar Kameez", "Sherwani"
  description: string;
  price: number;
  measurements: Measurements; // Individual item measurements
  assignedTo?: string; // Employee ID
  status: OrderWorkflowStatus;
  dueDate: string;
  fabricUsage?: {
    inventoryId: string;
    rollId?: string;
    lengthUsed: number;
  }[];
  trialDate?: string;
  fittingNotes?: string[];
  isAlterationLoop?: boolean;
}

export type OrderWorkflowStatus = 
  | 'measurement' 
  | 'fabric-reservation'
  | 'pattern-making'
  | 'cutting' 
  | 'stitching' 
  | 'trial' 
  | 'fitting' 
  | 'alterations' 
  | 'finishing' 
  | 'quality-check' 
  | 'ready' 
  | 'delivered' 
  | 'archived';

export type OrderStatus = 'pending' | 'in-progress' | 'ready' | 'delivered' | 'cancelled';

export interface OrderTaskStatus {
  cutting?: Task['status'];
  stitching?: Task['status'];
  finishing?: Task['status'];
}

export interface AuditTrailEntry {
  action: string;
  actor: string;
  timestamp: string;
  details: string;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  branchId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  paidAmount: number;
  advancePayment?: number;
  assignedTo?: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  taskStatus?: OrderTaskStatus;
  auditTrail: AuditTrailEntry[];
}

export interface Task {
  id: string;
  orderId: string;
  employeeId: string;
  employeeName: string;
  type: 'cutting' | 'stitching' | 'finishing';
  status: 'pending' | 'in-progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  type: 'inbound' | 'outbound';
  entityId: string; // Client ID or Vendor ID
  referenceId: string; // Order ID or Bill ID
}

export interface FabricRoll {
  id: string;
  inventoryId: string;
  rollNumber: string;
  originalLength: number;
  usedLength: number;
  remainingLength: number;
  supplierId?: string;
  purchaseDate: string;
  color?: string;
  location?: string;
  status?: 'in-stock' | 'depleted';
  createdAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number; // Total for non-roll items or calculated sum
  unit: 'meters' | 'yards' | 'pieces' | 'units';
  minLevel: number;
  pricePerUnit: number;
  isRollTracked: boolean;
  lastUpdated: string;
}

export interface InventoryLog {
  id: string;
  inventoryId: string;
  rollId?: string;
  orderItemId?: string;
  type: 'usage' | 'restock' | 'adjustment';
  quantity: number;
  actorId: string;
  performedBy?: string;
  action?: 'usage' | 'restock' | 'adjustment';
  notes?: string;
  timestamp: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address: string;
  category: string;
  balance: number;
}

export type BillStatus = 'unpaid' | 'partial' | 'paid' | 'pending';

export interface BillItem {
  inventoryId: string;
  quantity: number;
  rate: number;
}

export interface VendorBill {
  id: string;
  vendorId: string;
  amount: number;
  paidAmount: number;
  date: string;
  status: BillStatus;
  items?: BillItem[];
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  debitAccountId: string;
  creditAccountId: string;
  reference?: string;
  type?: 'payroll' | 'sale' | 'purchase' | 'expense' | 'adjustment';
  metadata?: Record<string, unknown>;
}

export interface FinancialTransaction extends Transaction {
  status: 'pending' | 'completed' | 'cancelled';
  category: string;
  type: NonNullable<Transaction['type']>;
}

export interface FinancialDocument {
  id: string;
  type: 'quotation' | 'advance-invoice' | 'final-invoice' | 'receipt' | 'refund' | 'expense' | 'payroll';
  invoiceNumber?: string;
  clientId?: string;
  clientName?: string;
  employeeId?: string;
  employeeName?: string;
  orderId?: string;
  amount: number;
  date: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled' | 'void';
  items?: { description: string; quantity: number; rate: number; amount: number }[];
  notes?: string;
  category?: string;
  createdAt: string;
  createdBy: string;
  auditTrail: string[];
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // e.g. "2026-05"
  baseSalary: number;
  bonuses: { reason: string; amount: number }[];
  deductions: { reason: string; amount: number }[];
  netSalary: number;
  status: 'draft' | 'approved' | 'paid' | 'cancelled';
  payoutDate?: string;
  transactionId?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  salary: number;
  phone: string;
  email?: string;
  address?: string;
  joinedAt: string;
}

export type TransactionFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  frequency: TransactionFrequency;
  type: 'expense' | 'revenue';
  category: string;
  debitAccountId: string;
  creditAccountId: string;
  startDate: string;
  lastProcessed?: string;
  nextDueDate: string;
  status: 'active' | 'paused';
}

export type UserRole = 'admin' | 'employee' | 'client';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  channel: 'internal' | 'whatsapp' | 'sms' | 'email';
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
}

export interface UserPermissions {
  canEditMeasurements: boolean;
  canApprovePayroll: boolean;
  canProcessPayments: boolean;
  canAdjustInventory: boolean;
  canDeleteOrders: boolean;
  canViewFinancialReports: boolean;
  canManageEmployees: boolean;
  canManageSystemSettings: boolean;
  canManageInventory: boolean;
  canManageClients: boolean;
  canManageAccounting: boolean;
  canManageOrders: boolean;
}

export interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  clientId?: string;
  branchId?: string;
  name?: string;
  phone?: string;
  address?: string;
  permissions: UserPermissions;
  createdAt: string;
}

export interface ProfileRequest {
  id: string;
  userId: string;
  userName: string;
  requestDate: string;
  suggestedChanges: {
    name?: string;
    phone?: string;
    [key: string]: string | number | boolean | undefined;
  };
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
}

export type QuoteRequestStatus = 'submitted' | 'reviewed' | 'converted' | 'rejected';

export type MeasurementSource = 'existing' | 'book-measurement' | 'enter-later';

export interface QuoteRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  garmentType: string;
  styleNotes: string;
  preferredDueDate: string;
  budgetRange: string;
  measurementSource: MeasurementSource;
  inspirationNotes?: string;
  status: QuoteRequestStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  type: 'measurement' | 'trial' | 'fitting' | 'delivery' | 'consultation';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  startTime: string;
  endTime: string;
  assignedTo: string; // Employee ID
  orderId?: string;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: 'order' | 'measurement' | 'inventory' | 'payment' | 'user';
  entityId: string;
  beforeState: unknown;
  afterState: unknown;
  timestamp: string;
}

export interface Branch {
  id: string;
  name: string;
  location?: string;
  address: string;
  phone: string;
  email?: string;
  manager?: string;
  managerId?: string;
  isActive: boolean;
  createdAt?: string;
}

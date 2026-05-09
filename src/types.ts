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
  measurements: Measurements;
  createdAt: string;
}

export interface MeasurementRecord {
  id: string;
  clientId: string;
  date: string;
  measurements: Measurements;
}

export interface OrderItem {
  type: string;
  description: string;
  price: number;
}

export type OrderStatus = 'pending' | 'cutting' | 'stitching' | 'finished' | 'delivered';

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  assignedTo?: string;
  taskStatus: {
    cutting: 'pending' | 'in-progress' | 'completed';
    stitching: 'pending' | 'in-progress' | 'completed';
    finishing: 'pending' | 'in-progress' | 'completed';
  };
  createdAt: string;
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

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minLevel: number;
  pricePerUnit: number;
  lastUpdated: string;
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
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  salary: number;
  phone: string;
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

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  clientId?: string;
  name?: string;
  phone?: string;
  address?: string;
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

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}

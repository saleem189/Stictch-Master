import { describe, expect, it } from 'vitest';
import { InventoryItem, Order, Transaction } from '../types';
import {
  buildDashboardMetrics,
  getActiveOrderStatuses,
  getDashboardTransactionStartDate,
} from './dashboardMetrics';

const baseOrder: Order = {
  id: 'order-1',
  clientId: 'client-1',
  clientName: 'Client One',
  branchId: 'branch-1',
  status: 'pending',
  totalAmount: 1000,
  paidAmount: 250,
  dueDate: '2026-06-10',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  auditTrail: [],
  items: [
    { id: 'item-1', type: 'Suit', description: 'Classic', price: 1000, measurements: {}, status: 'cutting', dueDate: '2026-06-10' },
  ],
};

describe('dashboard metrics', () => {
  it('uses only active order statuses for dashboard workload queries', () => {
    expect(getActiveOrderStatuses()).toEqual(['pending', 'in-progress', 'ready']);
  });

  it('builds a bounded transaction start date for dashboard charts', () => {
    expect(getDashboardTransactionStartDate(new Date('2026-05-30T00:00:00.000Z'))).toBe('2025-12-01');
  });

  it('calculates stats and chart data from bounded dashboard inputs', () => {
    const activeOrders: Order[] = [
      baseOrder,
      {
        ...baseOrder,
        id: 'order-2',
        status: 'ready',
        totalAmount: 2000,
        paidAmount: 2000,
        items: [
          { id: 'item-2', type: 'Dress', description: 'Formal', price: 2000, measurements: {}, status: 'ready', dueDate: '2026-06-12' },
        ],
      },
    ];
    const inventory: InventoryItem[] = [
      { id: 'fabric-1', name: 'Wool', category: 'Fabric', quantity: 2, unit: 'meters', minLevel: 5, pricePerUnit: 1000, isRollTracked: false, lastUpdated: '2026-05-01' },
      { id: 'fabric-2', name: 'Silk', category: 'Fabric', quantity: 8, unit: 'meters', minLevel: 5, pricePerUnit: 1500, isRollTracked: false, lastUpdated: '2026-05-01' },
    ];
    const transactions: Transaction[] = [
      { id: 'sale-1', date: '2026-05-15', description: 'Sale', amount: 5000, debitAccountId: 'cash', creditAccountId: 'sales', type: 'sale' },
      { id: 'payroll-1', date: '2026-05-20', description: 'Payroll', amount: 3000, debitAccountId: 'payroll', creditAccountId: 'cash', type: 'payroll' },
      { id: 'old-sale', date: '2026-04-15', description: 'Sale', amount: 2000, debitAccountId: 'cash', creditAccountId: 'sales', type: 'sale' },
    ];

    const metrics = buildDashboardMetrics({
      activeOrders,
      clientCount: 12,
      inventory,
      transactions,
      now: new Date('2026-05-30T00:00:00.000Z'),
    });

    expect(metrics.stats).toMatchObject({
      activeOrders: 2,
      totalClients: 12,
      lowStock: 1,
      monthlyRevenue: 5000,
      monthlyPayroll: 3000,
      receivables: 750,
    });
    expect(metrics.chartData).toEqual([
      { name: 'cutting', count: 1, color: '#cbd5e1' },
      { name: 'ready', count: 1, color: '#4f46e5' },
    ]);
    expect(metrics.revenueData).toEqual([
      { name: 'Apr', revenue: 2000 },
      { name: 'May', revenue: 5000 },
    ]);
  });
});

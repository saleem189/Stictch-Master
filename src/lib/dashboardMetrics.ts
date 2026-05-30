import { InventoryItem, Order, OrderStatus, Transaction } from '../types';

export interface DashboardStats {
  activeOrders: number;
  totalClients: number;
  lowStock: number;
  monthlyRevenue: number;
  monthlyPayroll: number;
  deliveredThisMonth: number;
  receivables: number;
}

export interface DashboardMetricsInput {
  activeOrders: Order[];
  clientCount: number;
  inventory: InventoryItem[];
  transactions: Transaction[];
  now?: Date;
}

export function getActiveOrderStatuses(): OrderStatus[] {
  return ['pending', 'in-progress', 'ready'];
}

export function getDashboardTransactionStartDate(now = new Date()): string {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  return start.toISOString().slice(0, 10);
}

export function buildDashboardMetrics({
  activeOrders,
  clientCount,
  inventory,
  transactions,
  now = new Date(),
}: DashboardMetricsInput): {
  stats: DashboardStats;
  chartData: { name: string; count: number; color: string }[];
  revenueData: { name: string; revenue: number }[];
} {
  const currentMonth = now.toISOString().slice(0, 7);
  const lowItems = inventory.filter(item => item.quantity <= item.minLevel);
  let monthlyRevenue = 0;
  let monthlyPayroll = 0;
  let receivables = 0;
  const monthlyRevenueByKey: Record<string, number> = {};

  transactions.forEach(transaction => {
    if (!transaction.date) return;

    const transactionDate = String(transaction.date);
    const transactionMonth = transactionDate.slice(0, 7);

    if (transactionMonth === currentMonth) {
      if (transaction.type === 'sale') monthlyRevenue += transaction.amount;
      if (transaction.type === 'payroll') monthlyPayroll += transaction.amount;
    }

    if (transaction.type === 'sale') {
      monthlyRevenueByKey[transactionMonth] = (monthlyRevenueByKey[transactionMonth] || 0) + transaction.amount;
    }
  });

  activeOrders.forEach(order => {
    receivables += Math.max(0, order.totalAmount - (order.paidAmount || 0));
  });

  const revenueData = Object.entries(monthlyRevenueByKey)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([monthKey, revenue]) => ({
      name: formatMonthName(monthKey),
      revenue,
    }));

  const itemStages: Record<string, number> = {};
  activeOrders.forEach(order => {
    (order.items || []).forEach(item => {
      const status = item.status || 'pending';
      itemStages[status] = (itemStages[status] || 0) + 1;
    });
  });

  const chartData = Object.entries(itemStages)
    .map(([name, count]) => ({
      name: name.replace('-', ' '),
      count,
      color: statusColors[name] || '#94a3b8',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    stats: {
      activeOrders: activeOrders.length,
      totalClients: clientCount,
      lowStock: lowItems.length,
      monthlyRevenue,
      monthlyPayroll,
      deliveredThisMonth: 0,
      receivables,
    },
    chartData,
    revenueData,
  };
}

const statusColors: Record<string, string> = {
  measurement: '#f1f5f9',
  'fabric-reservation': '#f1f5f9',
  'pattern-making': '#e2e8f0',
  cutting: '#cbd5e1',
  stitching: '#94a3b8',
  trial: '#64748b',
  ready: '#4f46e5',
  delivered: '#10b981',
};

function formatMonthName(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
}

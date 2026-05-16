import { Order, OrderItem, OrderStatus } from '../types';

export function calculateOrderTotal(items: Pick<OrderItem, 'price'>[]): number {
  return items.reduce((sum, item) => sum + normalizeMoney(item.price), 0);
}

export function calculateRemainingBalance(order: Pick<Order, 'totalAmount' | 'paidAmount'>): number {
  return Math.max(0, normalizeMoney(order.totalAmount) - normalizeMoney(order.paidAmount));
}

export function getStatusAfterPayment(order: Pick<Order, 'status' | 'totalAmount' | 'paidAmount'>, paymentAmount: number): OrderStatus {
  const nextPaidAmount = normalizeMoney(order.paidAmount) + normalizeMoney(paymentAmount);
  return nextPaidAmount >= normalizeMoney(order.totalAmount) ? 'delivered' : order.status;
}

function normalizeMoney(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

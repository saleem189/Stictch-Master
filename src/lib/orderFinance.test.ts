import { describe, expect, it } from 'vitest';
import { calculateOrderTotal, calculateRemainingBalance, getStatusAfterPayment } from './orderFinance';

describe('order finance rules', () => {
  it('calculates order totals from item prices', () => {
    expect(calculateOrderTotal([{ price: 1200 }, { price: 3500 }, { price: 0 }])).toBe(4700);
  });

  it('ignores invalid or negative item prices when calculating totals', () => {
    expect(calculateOrderTotal([{ price: 1200 }, { price: -500 }, { price: Number.NaN }])).toBe(1200);
  });

  it('never returns a negative remaining balance', () => {
    expect(calculateRemainingBalance({ totalAmount: 5000, paidAmount: 7000 })).toBe(0);
  });

  it('marks an order delivered only when the new payment settles the full balance', () => {
    expect(getStatusAfterPayment({ status: 'in-progress', totalAmount: 10000, paidAmount: 2000 }, 7999)).toBe('in-progress');
    expect(getStatusAfterPayment({ status: 'in-progress', totalAmount: 10000, paidAmount: 2000 }, 8000)).toBe('delivered');
  });
});

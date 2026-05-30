import { describe, expect, it } from 'vitest';
import {
  buildRecurringLedgerEntry,
  calculateNextDueDate,
  getRecurringTransactionRunId,
} from './recurringTransactions';
import { RecurringTransaction } from '../types';

const recurring: RecurringTransaction = {
  id: 'rent/main studio',
  description: 'Studio rent',
  amount: 75000,
  frequency: 'monthly',
  type: 'expense',
  category: 'Rent',
  debitAccountId: 'expense_rent',
  creditAccountId: 'asset_bank',
  startDate: '2026-05-01',
  nextDueDate: '2026-05-30',
  status: 'active',
};

describe('recurring transaction automation helpers', () => {
  it('builds deterministic run ids from recurring id and due date', () => {
    expect(getRecurringTransactionRunId('rent/main studio', '2026-05-30')).toBe(
      'recurring_rent_main_studio_2026_05_30'
    );
  });

  it('preserves the scheduled due date in the generated ledger metadata', () => {
    expect(buildRecurringLedgerEntry(recurring, '2026-06-02')).toMatchObject({
      date: '2026-06-02',
      reference: recurring.id,
      type: 'expense',
      metadata: {
        recurringTransactionId: recurring.id,
        recurringDueDate: '2026-05-30',
        idempotencyKey: 'recurring_rent_main_studio_2026_05_30',
      },
    });
  });

  it('calculates the next due date from the scheduled date, not the processing date', () => {
    expect(calculateNextDueDate(new Date('2026-05-30'), 'monthly').toISOString().slice(0, 10)).toBe('2026-06-30');
  });
});

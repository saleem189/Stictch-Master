import { LedgerEntryInput } from './ledger';
import { RecurringTransaction, TransactionFrequency } from '../types';

export function getRecurringTransactionRunId(recurringTransactionId: string, dueDate: string): string {
  const stableId = `${recurringTransactionId}_${dueDate}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return `recurring_${stableId}`;
}

export function buildRecurringLedgerEntry(rec: RecurringTransaction, processingDate: string): LedgerEntryInput {
  const idempotencyKey = getRecurringTransactionRunId(rec.id, rec.nextDueDate);

  return {
    date: processingDate,
    description: `Auto-generated: ${rec.description}`,
    amount: rec.amount,
    debitAccountId: rec.debitAccountId,
    creditAccountId: rec.creditAccountId,
    reference: rec.id,
    type: rec.type === 'revenue' ? 'sale' : 'expense',
    metadata: {
      recurringTransactionId: rec.id,
      recurringDueDate: rec.nextDueDate,
      idempotencyKey,
      category: rec.category,
    },
  };
}

export function calculateNextDueDate(current: Date, frequency: TransactionFrequency): Date {
  const next = new Date(current);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

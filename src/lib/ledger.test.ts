import { describe, expect, it } from 'vitest';
import { Account } from '../types';
import {
  ACCOUNT_IDS,
  getAccountByIdOrName,
  getCreditBalanceDelta,
  getDebitBalanceDelta,
} from './ledger';

const accounts: Account[] = [
  { id: ACCOUNT_IDS.cash, code: '1001', name: 'Petty Cash', type: 'asset', balance: 1000 },
  { id: ACCOUNT_IDS.receivable, code: '1100', name: 'Accounts Receivable', type: 'asset', balance: 0 },
  { id: ACCOUNT_IDS.sales, code: '4001', name: 'Sales Revenue', type: 'revenue', balance: 0 },
  { id: ACCOUNT_IDS.payroll, code: '5001', name: 'Payroll Expense', type: 'expense', balance: 0 },
  { id: ACCOUNT_IDS.vendorPayable, code: '2001', name: 'Vendor Payables', type: 'liability', balance: 0 },
];

describe('ledger', () => {
  it('resolves accounts by preferred id before name fallback', () => {
    expect(getAccountByIdOrName(accounts, [ACCOUNT_IDS.cash], ['cash'])?.id).toBe(ACCOUNT_IDS.cash);
  });

  it('resolves accounts by case-insensitive name fallback', () => {
    expect(getAccountByIdOrName(accounts, ['missing'], ['sales'])?.id).toBe(ACCOUNT_IDS.sales);
  });

  it('applies debit balance deltas by account type', () => {
    expect(getDebitBalanceDelta('asset', 250)).toBe(250);
    expect(getDebitBalanceDelta('expense', 250)).toBe(250);
    expect(getDebitBalanceDelta('liability', 250)).toBe(-250);
    expect(getDebitBalanceDelta('equity', 250)).toBe(-250);
    expect(getDebitBalanceDelta('revenue', 250)).toBe(-250);
  });

  it('applies credit balance deltas by account type', () => {
    expect(getCreditBalanceDelta('asset', 250)).toBe(-250);
    expect(getCreditBalanceDelta('expense', 250)).toBe(-250);
    expect(getCreditBalanceDelta('liability', 250)).toBe(250);
    expect(getCreditBalanceDelta('equity', 250)).toBe(250);
    expect(getCreditBalanceDelta('revenue', 250)).toBe(250);
  });
});

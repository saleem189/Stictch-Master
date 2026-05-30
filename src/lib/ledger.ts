import { collection, doc, increment, writeBatch, Firestore, WriteBatch } from 'firebase/firestore';
import { Account, AccountType, Transaction } from '../types';

export const ACCOUNT_IDS = {
  cash: 'seed_account_cash',
  bank: 'seed_account_bank',
  receivable: 'seed_account_receivable',
  sales: 'seed_account_sales',
  payroll: 'seed_account_payroll',
  inventory: 'seed_account_inventory',
  vendorPayable: 'seed_account_vendor_payable',
} as const;

export type AccountId = (typeof ACCOUNT_IDS)[keyof typeof ACCOUNT_IDS];

export interface LedgerEntryInput {
  date: string;
  description: string;
  amount: number;
  debitAccountId: string;
  creditAccountId: string;
  reference?: string;
  type?: Transaction['type'];
  metadata?: Record<string, unknown>;
}

export function getAccountByIdOrName(accounts: Account[], preferredIds: string[], nameIncludes: string[]): Account | undefined {
  const byId = accounts.find(account => preferredIds.includes(account.id));
  if (byId) return byId;

  return accounts.find(account => {
    const name = account.name.toLowerCase();
    return nameIncludes.some(candidate => name.includes(candidate.toLowerCase()));
  });
}

export function getRequiredAccountByIdOrName(accounts: Account[], preferredIds: string[], nameIncludes: string[], label: string): Account {
  const account = getAccountByIdOrName(accounts, preferredIds, nameIncludes);
  if (!account) {
    throw new Error(`Missing ledger account: ${label}`);
  }
  return account;
}

export function getDebitBalanceDelta(type: AccountType, amount: number): number {
  const normalizedAmount = normalizeAmount(amount);
  return type === 'asset' || type === 'expense' ? normalizedAmount : -normalizedAmount;
}

export function getCreditBalanceDelta(type: AccountType, amount: number): number {
  const normalizedAmount = normalizeAmount(amount);
  return type === 'asset' || type === 'expense' ? -normalizedAmount : normalizedAmount;
}

export function appendLedgerEntryToBatch(db: Firestore, batch: WriteBatch, accounts: Account[], input: LedgerEntryInput) {
  const amount = normalizeAmount(input.amount);
  if (amount <= 0) {
    throw new Error('Ledger amount must be greater than zero.');
  }

  const debitAccount = accounts.find(account => account.id === input.debitAccountId);
  const creditAccount = accounts.find(account => account.id === input.creditAccountId);

  if (!debitAccount) throw new Error(`Debit account not found: ${input.debitAccountId}`);
  if (!creditAccount) throw new Error(`Credit account not found: ${input.creditAccountId}`);

  const transactionRef = doc(collection(db, 'transactions'));
  batch.set(transactionRef, {
    date: input.date,
    description: input.description,
    amount,
    debitAccountId: debitAccount.id,
    creditAccountId: creditAccount.id,
    reference: input.reference || '',
    type: input.type || 'adjustment',
    metadata: input.metadata || {},
    createdAt: new Date().toISOString(),
  });

  batch.update(doc(db, 'accounts', debitAccount.id), {
    balance: increment(getDebitBalanceDelta(debitAccount.type, amount)),
  });
  batch.update(doc(db, 'accounts', creditAccount.id), {
    balance: increment(getCreditBalanceDelta(creditAccount.type, amount)),
  });

  return transactionRef;
}

export async function commitLedgerEntry(db: Firestore, accounts: Account[], input: LedgerEntryInput) {
  const batch = writeBatch(db);
  const transactionRef = appendLedgerEntryToBatch(db, batch, accounts, input);
  await batch.commit();
  return transactionRef.id;
}

function normalizeAmount(amount: number): number {
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

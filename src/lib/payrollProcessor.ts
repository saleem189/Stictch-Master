import { doc, increment, runTransaction, Firestore } from 'firebase/firestore';
import { Account, PayrollRecord } from '../types';
import { getCreditBalanceDelta, getDebitBalanceDelta } from './ledger';
import { getPayrollRecordId } from './payroll';

export type PayrollPayout = Pick<PayrollRecord, 'employeeId' | 'month' | 'netSalary'> &
  Partial<Pick<PayrollRecord, 'employeeName' | 'baseSalary' | 'bonuses' | 'deductions' | 'createdAt'>>;

/** Atomically records one payroll payout, its ledger entry, account balances, and audit event. */
export async function processPayrollPayout({
  db,
  payout,
  debitAccount,
  creditAccount,
  actorId,
  actorName,
  now = new Date(),
}: {
  db: Firestore;
  payout: PayrollPayout;
  debitAccount: Account;
  creditAccount: Account;
  actorId: string;
  actorName?: string;
  now?: Date;
}): Promise<boolean> {
  if (!Number.isFinite(payout.netSalary) || payout.netSalary <= 0) {
    throw new Error('Payroll payout must be greater than zero.');
  }
  if (debitAccount.id === creditAccount.id) {
    throw new Error('Payroll debit and credit accounts must be different.');
  }

  const payrollId = getPayrollRecordId(payout.employeeId, payout.month);
  const payrollRef = doc(db, 'payrollRecords', payrollId);
  const transactionRef = doc(db, 'transactions', `payroll_txn_${payrollId}`);
  const auditRef = doc(db, 'auditLogs', `payroll_audit_${payrollId}`);
  const debitRef = doc(db, 'accounts', debitAccount.id);
  const creditRef = doc(db, 'accounts', creditAccount.id);
  const date = now.toISOString().slice(0, 10);
  const timestamp = now.toISOString();

  return runTransaction(db, async transaction => {
    const [payrollSnapshot, transactionSnapshot, debitSnapshot, creditSnapshot] = await Promise.all([
      transaction.get(payrollRef),
      transaction.get(transactionRef),
      transaction.get(debitRef),
      transaction.get(creditRef),
    ]);

    if (payrollSnapshot.exists() && payrollSnapshot.data().status === 'paid') return false;
    if (transactionSnapshot.exists()) {
      throw new Error(`Payroll ledger entry already exists without a paid payroll record: ${payrollId}`);
    }
    if (!debitSnapshot.exists() || !creditSnapshot.exists()) {
      throw new Error('Payroll ledger accounts are missing.');
    }

    transaction.set(transactionRef, {
      date,
      description: `Payroll Payout: ${payout.employeeName || payout.employeeId} (${payout.month})`,
      amount: payout.netSalary,
      debitAccountId: debitAccount.id,
      creditAccountId: creditAccount.id,
      reference: payrollId,
      type: 'payroll',
      metadata: { idempotencyKey: payrollId },
      createdAt: timestamp,
    });
    transaction.update(debitRef, {
      balance: increment(getDebitBalanceDelta(debitAccount.type, payout.netSalary)),
    });
    transaction.update(creditRef, {
      balance: increment(getCreditBalanceDelta(creditAccount.type, payout.netSalary)),
    });
    transaction.set(payrollRef, {
      ...payout,
      status: 'paid',
      payoutDate: date,
      approvedBy: actorId,
      approvedAt: timestamp,
      transactionId: transactionRef.id,
      createdAt: payout.createdAt || timestamp,
    });
    transaction.set(auditRef, {
      actorId,
      actorName: actorName || '',
      action: 'PAYROLL_PROCESSED',
      entityType: 'payroll',
      entityId: payrollId,
      afterState: payout,
      timestamp,
    });

    return true;
  });
}

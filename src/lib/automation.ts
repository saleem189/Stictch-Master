import { collection, doc, getDocs, increment, query, runTransaction, where } from 'firebase/firestore';
import { db } from './firebase';
import { Account, RecurringTransaction } from '../types';
import { getCreditBalanceDelta, getDebitBalanceDelta } from './ledger';
import { buildRecurringLedgerEntry, calculateNextDueDate } from './recurringTransactions';

export async function processRecurringTransactions() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  try {
    const q = query(
      collection(db, 'recurringTransactions'), 
      where('status', '==', 'active'),
      where('nextDueDate', '<=', todayStr)
    );

    const snap = await getDocs(q);
    if (snap.empty) return { processed: 0 };

    const accountSnap = await getDocs(collection(db, 'accounts'));
    const accounts = accountSnap.docs.map(d => ({ id: d.id, ...d.data() } as Account));
    let processedCount = 0;
    let skippedCount = 0;

    for (const d of snap.docs) {
      const rec = { id: d.id, ...d.data() } as RecurringTransaction;

      const wasProcessed = await runTransaction(db, async (transaction) => {
        const recurringRef = doc(db, 'recurringTransactions', rec.id);
        const recurringSnap = await transaction.get(recurringRef);
        if (!recurringSnap.exists()) return false;

        const current = { id: recurringSnap.id, ...recurringSnap.data() } as RecurringTransaction;
        if (current.status !== 'active' || current.nextDueDate > todayStr) return false;

        const ledgerEntry = buildRecurringLedgerEntry(current, todayStr);
        const transactionId = String(ledgerEntry.metadata?.idempotencyKey);
        const transactionRef = doc(db, 'transactions', transactionId);
        const transactionSnap = await transaction.get(transactionRef);
        if (transactionSnap.exists()) return false;

        const debitAccount = accounts.find(account => account.id === ledgerEntry.debitAccountId);
        const creditAccount = accounts.find(account => account.id === ledgerEntry.creditAccountId);
        if (!debitAccount) throw new Error(`Debit account not found: ${ledgerEntry.debitAccountId}`);
        if (!creditAccount) throw new Error(`Credit account not found: ${ledgerEntry.creditAccountId}`);

        transaction.set(transactionRef, {
          ...ledgerEntry,
          createdAt: new Date().toISOString(),
        });
        transaction.update(doc(db, 'accounts', debitAccount.id), {
          balance: increment(getDebitBalanceDelta(debitAccount.type, ledgerEntry.amount)),
        });
        transaction.update(doc(db, 'accounts', creditAccount.id), {
          balance: increment(getCreditBalanceDelta(creditAccount.type, ledgerEntry.amount)),
        });

        const nextDate = calculateNextDueDate(new Date(current.nextDueDate), current.frequency);
        transaction.update(recurringRef, {
          lastProcessed: todayStr,
          nextDueDate: nextDate.toISOString().split('T')[0]
        });

        return true;
      });

      if (wasProcessed) {
        processedCount++;
      } else {
        skippedCount++;
      }
    }

    return { processed: processedCount, skipped: skippedCount };
  } catch (error) {
    console.error('Automation error:', error);
    return { error };
  }
}

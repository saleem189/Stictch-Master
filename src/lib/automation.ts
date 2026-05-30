import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Account, RecurringTransaction, TransactionFrequency } from '../types';
import { appendLedgerEntryToBatch } from './ledger';

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
    const batch = writeBatch(db);
    let processedCount = 0;

    for (const d of snap.docs) {
      const rec = { id: d.id, ...d.data() } as RecurringTransaction;
      
      appendLedgerEntryToBatch(db, batch, accounts, {
        date: todayStr,
        description: `Auto-generated: ${rec.description}`,
        amount: rec.amount,
        debitAccountId: rec.debitAccountId,
        creditAccountId: rec.creditAccountId,
        reference: rec.id,
        type: rec.type === 'revenue' ? 'sale' : 'expense',
        metadata: { recurringTransactionId: rec.id, category: rec.category }
      });

      const nextDate = calculateNextDueDate(new Date(rec.nextDueDate), rec.frequency);
      
      batch.update(doc(db, 'recurringTransactions', rec.id), {
        lastProcessed: todayStr,
        nextDueDate: nextDate.toISOString().split('T')[0]
      });

      processedCount++;
    }

    await batch.commit();
    return { processed: processedCount };
  } catch (error) {
    console.error('Automation error:', error);
    return { error };
  }
}

function calculateNextDueDate(current: Date, frequency: TransactionFrequency): Date {
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

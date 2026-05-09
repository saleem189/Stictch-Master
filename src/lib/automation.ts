import { collection, getDocs, query, where, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';
import { RecurringTransaction, TransactionFrequency } from '../types';

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

    let processedCount = 0;

    for (const d of snap.docs) {
      const rec = { id: d.id, ...d.data() } as RecurringTransaction;
      
      // 1. Create Transaction (Journal Entry)
      const txnData = {
        date: todayStr,
        description: `Auto-generated: ${rec.description}`,
        amount: rec.amount,
        debitAccountId: rec.debitAccountId,
        creditAccountId: rec.creditAccountId,
        reference: rec.id
      };
      await addDoc(collection(db, 'transactions'), txnData);

      // 2. Update Account Balances
      await updateDoc(doc(db, 'accounts', rec.debitAccountId), {
        balance: increment(rec.amount)
      });
      await updateDoc(doc(db, 'accounts', rec.creditAccountId), {
        balance: increment(-rec.amount)
      });

      // 3. Calculate next due date
      const nextDate = calculateNextDueDate(new Date(rec.nextDueDate), rec.frequency);
      
      await updateDoc(doc(db, 'recurringTransactions', rec.id), {
        lastProcessed: todayStr,
        nextDueDate: nextDate.toISOString().split('T')[0]
      });

      processedCount++;
    }

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

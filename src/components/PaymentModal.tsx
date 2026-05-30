import React, { useState } from 'react';
import { collection, doc, getDocs, increment, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Account, Order } from '../types';
import { X, DollarSign, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { calculateRemainingBalance, getStatusAfterPayment } from '../lib/orderFinance';
import { ACCOUNT_IDS, appendLedgerEntryToBatch, getRequiredAccountByIdOrName } from '../lib/ledger';
import { buildPublicOrderTracking } from '../lib/publicOrderTracking';

interface Props {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ order, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState(calculateRemainingBalance(order));
  const [method, setMethod] = useState('Cash');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    
    setSubmitting(true);
    try {
      const accountsSnap = await getDocs(collection(db, 'accounts'));
      const accounts = accountsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Account));
      const cashAcc = getRequiredAccountByIdOrName(accounts, [ACCOUNT_IDS.cash, ACCOUNT_IDS.bank], ['cash', 'bank'], 'Cash or Bank');
      const receivableAcc = getRequiredAccountByIdOrName(accounts, [ACCOUNT_IDS.receivable], ['receivable'], 'Accounts Receivable');
      const batch = writeBatch(db);
      const nextStatus = getStatusAfterPayment(order, amount);

      batch.update(doc(db, 'orders', order.id), {
        paidAmount: increment(amount),
        status: nextStatus
      });
      batch.set(doc(db, 'publicOrderTracking', order.id), buildPublicOrderTracking({
        ...order,
        paidAmount: order.paidAmount + amount,
        status: nextStatus,
      }));

      batch.set(doc(collection(db, 'payments')), {
        date: new Date().toISOString(),
        amount: amount,
        method: method,
        type: 'inbound',
        entityId: order.clientId,
        referenceId: order.id,
        createdAt: new Date().toISOString()
      });

      const receiptRef = doc(collection(db, 'financialDocuments'));
      batch.set(receiptRef, {
        type: 'receipt',
        clientId: order.clientId,
        clientName: order.clientName,
        orderId: order.id,
        amount,
        date: new Date().toISOString().split('T')[0],
        status: 'paid',
        notes: `Payment for Order #${order.id.slice(0, 8)} via ${method}`,
        createdAt: new Date().toISOString(),
        createdBy: 'System',
        auditTrail: ['Receipt generated from payment modal']
      });

      appendLedgerEntryToBatch(db, batch, accounts, {
        date: new Date().toISOString(),
        description: `Payment Received: Order #${order.id.slice(0, 8)} - ${order.clientName}`,
        amount: amount,
        debitAccountId: cashAcc.id,
        creditAccountId: receivableAcc.id,
        reference: receiptRef.id,
        type: 'sale'
      });

      await batch.commit();
      onSuccess();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'payments');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign size={20} />
            <h2 className="text-lg font-bold">Record Client Payment</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
             <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order Balance</p>
                <p className="text-xl font-bold text-slate-900 font-mono">Rs. {calculateRemainingBalance(order).toLocaleString()}</p>
             </div>
             <CreditCard className="text-slate-300" size={32} />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payment Amount (Rs.)</label>
              <input 
                type="number"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payment Method</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={method}
                onChange={e => setMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="JazzCash / EasyPaisa">JazzCash / EasyPaisa</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
             <button 
               type="submit" 
               disabled={submitting}
               className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
             >
               {submitting ? 'Processing...' : 'Save Payment'}
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

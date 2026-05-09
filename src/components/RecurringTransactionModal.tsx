import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Account, RecurringTransaction, TransactionFrequency } from '../types';
import { X, Save, RefreshCw, Calendar, DollarSign, Tag } from 'lucide-react';
import { motion } from 'motion/react';

interface RecurringTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: RecurringTransaction;
}

export default function RecurringTransactionModal({ isOpen, onClose, onSuccess, transaction }: RecurringTransactionModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState({
    description: transaction?.description || '',
    amount: transaction?.amount || 0,
    frequency: transaction?.frequency || 'monthly',
    type: transaction?.type || 'expense',
    category: transaction?.category || 'Utility',
    debitAccountId: transaction?.debitAccountId || '',
    creditAccountId: transaction?.creditAccountId || '',
    startDate: transaction?.startDate || new Date().toISOString().split('T')[0],
    status: transaction?.status || 'active',
    nextDueDate: transaction?.nextDueDate || new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen) fetchAccounts();
  }, [isOpen]);

  async function fetchAccounts() {
    try {
      const snap = await getDocs(collection(db, 'accounts'));
      setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Account)));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'accounts');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (transaction?.id) {
        await updateDoc(doc(db, 'recurringTransactions', transaction.id), formData);
      } else {
        await addDoc(collection(db, 'recurringTransactions'), formData);
      }
      onSuccess();
      onClose();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'recurring_transactions');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-xl">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="font-black text-lg tracking-tight">{transaction ? 'Edit Automation' : 'New Recurring Entry'}</h2>
              <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">Financial Automation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
              <input 
                type="text" 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                placeholder="e.g. Monthly Shop Rent"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><DollarSign size={10} /> Amount</label>
                <input 
                  type="number" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Frequency</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={formData.frequency}
                  onChange={e => setFormData({...formData, frequency: e.target.value as TransactionFrequency})}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Debit Account</label>
                <select 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={formData.debitAccountId}
                  onChange={e => setFormData({...formData, debitAccountId: e.target.value})}
                >
                  <option value="">Select Account</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Credit Account</label>
                <select 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={formData.creditAccountId}
                  onChange={e => setFormData({...formData, creditAccountId: e.target.value})}
                >
                  <option value="">Select Account</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={10} /> Next Due Date</label>
                <input 
                  type="date" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={formData.nextDueDate}
                  onChange={e => setFormData({...formData, nextDueDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Tag size={10} /> Category</label>
                <select 
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                   value={formData.category}
                   onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Utility">Utility</option>
                  <option value="Rent">Rent</option>
                  <option value="Salary">Salary</option>
                  <option value="Material">Material</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group">
            <Save size={20} className="group-hover:scale-110 transition-transform" />
            {transaction ? 'Save Changes' : 'Activate Automation'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

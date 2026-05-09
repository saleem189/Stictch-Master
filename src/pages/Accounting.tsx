import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Account, Transaction, RecurringTransaction } from '../types';
import { ArrowUpRight, ArrowDownLeft, Plus, Calculator, DollarSign, RefreshCw, Trash2, Calendar } from 'lucide-react';
import RecurringTransactionModal from '../components/RecurringTransactionModal';
import { toast } from 'react-hot-toast';

import { useTranslation } from 'react-i18next';

export default function Accounting() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<RecurringTransaction | undefined>();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const accSnap = await getDocs(collection(db, 'accounts'));
      const txnSnap = await getDocs(query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(50)));
      const recSnap = await getDocs(collection(db, 'recurringTransactions'));
      
      setAccounts(accSnap.docs.map(d => ({ id: d.id, ...d.data() } as Account)));
      setTransactions(txnSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
      setRecurring(recSnap.docs.map(d => ({ id: d.id, ...d.data() } as RecurringTransaction)));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'accounting');
    }
  }

  const handleDeleteRecurring = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;
    try {
      await deleteDoc(doc(db, 'recurringTransactions', id));
      toast.success('Automation deleted');
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'recurringTransactions');
    }
  };

  const assets = accounts.filter(a => a.type === 'asset').reduce((acc, curr) => acc + curr.balance, 0);
  const liabilities = accounts.filter(a => a.type === 'liability').reduce((acc, curr) => acc + curr.balance, 0);
  const equity = accounts.filter(a => a.type === 'equity').reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight italic uppercase">{t('Reports')}</h1>
          <p className="text-sm text-slate-500 font-medium">Double-entry accounting and financial reports.</p>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <Plus size={20} />
          {t('Add New')}
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] sm:text-xs mb-3 uppercase font-black tracking-widest relative z-10">
            <ArrowUpRight size={16} className="text-green-500" />
            Total Assets
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 relative z-10 font-mono">Rs. {assets.toLocaleString()}</p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 -mr-4 -mt-4 rounded-full" />
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] sm:text-xs mb-3 uppercase font-black tracking-widest relative z-10">
            <ArrowDownLeft size={16} className="text-red-500" />
            Total Liabilities
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 relative z-10 font-mono">Rs. {liabilities.toLocaleString()}</p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 -mr-4 -mt-4 rounded-full" />
        </div>
        <div className="bg-slate-950 p-6 rounded-3xl shadow-xl shadow-slate-200 relative overflow-hidden group">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] sm:text-xs mb-3 uppercase font-black tracking-widest relative z-10">
            <Calculator size={16} className="text-indigo-400" />
            Owners Equity
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white relative z-10 font-mono">Rs. {equity.toLocaleString()}</p>
          <div className="absolute inset-0 bg-indigo-600/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 xl:col-span-4 space-y-6">
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm flex items-center gap-2">
                <RefreshCw size={18} className="text-indigo-600" />
                Ledger Automations
              </h2>
              <button 
                onClick={() => { setSelectedTxn(undefined); setIsModalOpen(true); }}
                className="p-1.5 hover:bg-slate-50 rounded-xl text-indigo-600 transition-colors border border-transparent hover:border-indigo-100"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="space-y-4">
               {recurring.map(rec => (
                 <div key={rec.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group relative overflow-hidden transition-all hover:bg-white hover:shadow-md hover:border-indigo-100">
                    <div className="flex justify-between items-start relative z-10">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">{rec.description}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest flex items-center gap-1.5 font-mono">
                          {rec.frequency} <span className="opacity-30">•</span> Rs. {rec.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 lg:opacity-0 group-hover:opacity-100 transition-all shrink-0">
                         <button onClick={() => { setSelectedTxn(rec); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Plus size={14} /></button>
                         <button onClick={() => handleDeleteRecurring(rec.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100 relative z-10">
                       <Calendar size={12} className="text-slate-400" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Date: {rec.nextDueDate}</span>
                    </div>
                    <div className="absolute top-0 right-0 w-1 bg-indigo-600 h-full opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
               ))}
               {recurring.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <RefreshCw size={32} className="opacity-10 mb-2" />
                    <p className="text-[10px] uppercase font-black tracking-widest text-center">No active automations</p>
                 </div>
               )}
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="font-black text-slate-900 mb-6 uppercase tracking-tight text-sm flex items-center gap-2">
              <DollarSign size={18} className="text-green-600" />
              Chart of Accounts
            </h2>
            <div className="space-y-4">
              {accounts.map(acc => (
                <div key={acc.id} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 group cursor-default">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{acc.name}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">{acc.type} <span className="opacity-30">•</span> {acc.code}</p>
                  </div>
                  <p className="text-xs font-black text-slate-900 font-mono shrink-0">Rs. {acc.balance.toLocaleString()}</p>
                </div>
              ))}
              {accounts.length === 0 && <p className="text-xs text-slate-400 text-center py-4 italic">No accounts set up.</p>}
            </div>
          </section>
        </div>

        <div className="lg:col-span-12 xl:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-fit">
          <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">Recent Journal Entries</h2>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Latest 50 Operations</div>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50/50 font-black">
                  <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs">Post Date</th>
                  <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs">Operation Detail</th>
                  <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs text-right">Debit</th>
                  <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs text-right text-indigo-600">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 text-xs font-black text-slate-900">{new Date(txn.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                       <p className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{txn.description}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Entry Ref: {txn.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-slate-900 text-right font-mono">
                       Rs. {txn.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-indigo-600 text-right font-mono">
                       Rs. {txn.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <RecurringTransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        transaction={selectedTxn}
      />
    </div>
  );
}

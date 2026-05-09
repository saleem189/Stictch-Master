import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Account, Transaction, RecurringTransaction, FinancialDocument } from '../types';
import { ArrowUpRight, ArrowDownLeft, Plus, Calculator, DollarSign, RefreshCw, Trash2, Calendar, FileText, Search, Download } from 'lucide-react';
import RecurringTransactionModal from '../components/RecurringTransactionModal';
import FinancialDocumentModal from '../components/FinancialDocumentModal';
import { toast } from 'react-hot-toast';

import { useTranslation } from 'react-i18next';

export default function Accounting() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [finDocs, setFinDocs] = useState<FinancialDocument[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<RecurringTransaction | undefined>();
  const [activeTab, setActiveTab] = useState<'ledger' | 'documents' | 'automations'>('ledger');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const accSnap = await getDocs(collection(db, 'accounts'));
      const txnSnap = await getDocs(query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(100)));
      const recSnap = await getDocs(collection(db, 'recurringTransactions'));
      const docSnap = await getDocs(query(collection(db, 'financialDocuments'), orderBy('date', 'desc'), limit(100)));
      
      setAccounts(accSnap.docs.map(d => ({ id: d.id, ...d.data() } as Account)));
      setTransactions(txnSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
      setRecurring(recSnap.docs.map(d => ({ id: d.id, ...d.data() } as RecurringTransaction)));
      setFinDocs(docSnap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialDocument)));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'accounting');
    }
  }

  const filteredDocs = finDocs.filter(d => {
    const matchesType = filterType === 'all' || d.type === filterType;
    const matchesSearch = searchTerm === '' || 
      (d.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleExport = () => {
    const dataToExport = filteredDocs.map(d => ({
      ID: d.id,
      Date: d.date,
      Type: d.type,
      Client: d.clientName || 'N/A',
      Employee: d.employeeName || 'N/A',
      Amount: d.amount,
      Status: d.status,
      Notes: d.notes
    }));
    import('../lib/exportUtils').then(m => m.exportToCSV(dataToExport, `financial_docs_${new Date().toISOString().split('T')[0]}`));
  };

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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight italic uppercase">{t('Financial Intelligence')}</h1>
          <p className="text-sm text-slate-500 font-medium">Enterprise resources, ledger auditing, and documents.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => { setActiveTab('documents'); setIsDocModalOpen(true); }}
             className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95 text-xs uppercase"
           >
             <FileText size={18} />
             {t('Create Document')}
           </button>
           <button 
             onClick={() => { setSelectedTxn(undefined); setIsModalOpen(true); }}
             className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 text-xs uppercase"
           >
             <Plus size={18} />
             {t('Add Entry')}
           </button>
        </div>
      </header>

      <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200">
         {[
           { id: 'ledger', label: 'General Ledger', icon: Calculator },
           { id: 'documents', label: 'Financial Documents', icon: FileText },
           { id: 'automations', label: 'Ledger Automations', icon: RefreshCw }
         ].map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as 'ledger' | 'documents' | 'automations')}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
               activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
             }`}
           >
             <tab.icon size={14} />
             {tab.label}
           </button>
         ))}
      </div>

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
        {activeTab === 'ledger' && (
          <>
            <div className="lg:col-span-12 xl:col-span-4 space-y-6">
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
                </div>
              </section>
            </div>
            <div className="lg:col-span-12 xl:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-fit">
              {/* Journal Table stays same structure */}
              <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">Recent Journal Entries</h2>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Latest 50 Operations</div>
              </div>
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50/50 font-black">
                      <th className="px-6 py-5">Post Date</th>
                      <th className="px-6 py-5">Operation Detail</th>
                      <th className="px-6 py-5 text-right">Debit</th>
                      <th className="px-6 py-5 text-right text-indigo-600">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map(txn => (
                      <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4 text-xs font-black text-slate-900">{new Date(txn.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                           <p className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{txn.description}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ref: {txn.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-slate-900 text-right font-mono">Rs. {txn.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-xs font-black text-indigo-600 text-right font-mono">Rs. {txn.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'documents' && (
          <div className="lg:col-span-12 space-y-6">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto min-w-0">
                  <button 
                    onClick={() => setFilterType('all')}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    All Entries
                  </button>
                  {['quotation', 'advance-invoice', 'receipt', 'final-invoice', 'expense', 'payroll'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {type.replace('-', ' ')}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-3">
                   <div className="relative">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Search entities, refs..."
                        className="bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-2 text-[10px] uppercase font-black tracking-widest focus:ring-2 focus:ring-indigo-600 outline-none w-48 sm:w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                   </div>
                   <button 
                     onClick={handleExport}
                     className="p-3 bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-colors border border-slate-200"
                   >
                      <Download size={18} />
                   </button>
                </div>
             </div>

             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50/50 font-black border-b border-slate-100">
                       <th className="px-6 py-5">Issue Date</th>
                       <th className="px-6 py-5">Intelligence ID</th>
                       <th className="px-6 py-5">Document Type</th>
                       <th className="px-6 py-5">Subject Entity</th>
                       <th className="px-6 py-5 text-right">Settlement</th>
                       <th className="px-6 py-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredDocs.map(doc => (
                       <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 text-xs font-bold text-slate-600 font-mono italic">{new Date(doc.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                             <p className="text-[10px] font-black text-slate-400 font-mono tracking-widest">DOC-{doc.id.slice(0, 6).toUpperCase()}</p>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                               doc.type.includes('invoice') ? 'bg-green-50 text-green-600 border-green-100' :
                               doc.type === 'quotation' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                               doc.type === 'receipt' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                               'bg-slate-50 text-slate-500 border-slate-100'
                             }`}>{doc.type.replace('-', ' ')}</span>
                          </td>
                          <td className="px-6 py-4">
                             <p className="text-xs font-black text-slate-900 uppercase italic tracking-tight">{doc.clientName || doc.employeeName || 'Internal'}</p>
                             {doc.orderId && <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Ref: Order #{doc.orderId.slice(0, 8)}</p>}
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-black font-mono text-slate-900">Rs. {doc.amount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  doc.status === 'paid' ? 'bg-green-500' :
                                  doc.status === 'issued' ? 'bg-indigo-500' :
                                  'bg-slate-300'
                                }`} />
                                <span className={`text-[9px] font-black uppercase tracking-widest ${
                                  doc.status === 'paid' ? 'text-green-600' :
                                  doc.status === 'issued' ? 'text-indigo-600' :
                                  'text-slate-400'
                                }`}>{doc.status}</span>
                             </div>
                          </td>
                       </tr>
                     ))}
                     {filteredDocs.length === 0 && (
                       <tr>
                          <td colSpan={6} className="px-6 py-24 text-center">
                             <div className="flex flex-col items-center gap-3 text-slate-300">
                                <FileText size={48} strokeWidth={1} className="opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No Documents Found in this Matrix</p>
                             </div>
                          </td>
                       </tr>
                     )}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'automations' && (
           <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recurring.map(rec => (
                <div key={rec.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 relative group overflow-hidden">
                   <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                         <RefreshCw size={24} />
                      </div>
                      <button onClick={() => handleDeleteRecurring(rec.id)} className="p-2 text-slate-300 hover:text-red-500 rounded-xl transition-colors">
                         <Trash2 size={18} />
                      </button>
                   </div>
                   <div>
                      <h4 className="text-lg font-black italic uppercase tracking-tight text-slate-900">{rec.description}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{rec.frequency} automation</p>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
                      <span className="text-xl font-black text-indigo-600 font-mono">Rs. {rec.amount.toLocaleString()}</span>
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                      <Calendar size={12} />
                      Next Run: {rec.nextDueDate}
                   </div>
                   <div className="absolute top-0 right-0 w-1 bg-indigo-600 h-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              <div 
                onClick={() => { setSelectedTxn(undefined); setIsModalOpen(true); }}
                className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-8 gap-4 cursor-pointer hover:bg-slate-100 transition-all group"
              >
                 <div className="p-4 bg-white rounded-full group-hover:scale-110 transition-transform">
                    <Plus size={32} className="text-slate-300" />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Automation</p>
              </div>
           </div>
        )}
      </div>

      <RecurringTransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        transaction={selectedTxn}
      />
      <FinancialDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}

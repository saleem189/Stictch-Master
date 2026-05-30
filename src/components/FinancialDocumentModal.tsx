import React, { useState, useEffect } from 'react';
import { collection, doc, getDocs, query, orderBy, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Account, Client, Employee, FinancialDocument, Order } from '../types';
import { X, DollarSign, Plus, Trash2, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { useUser } from '../contexts/UserContext';
import BrandLogo from './BrandLogo';
import { ACCOUNT_IDS, appendLedgerEntryToBatch, getRequiredAccountByIdOrName } from '../lib/ledger';
import { calculateInvoiceTotal, formatCurrency, getDefaultDocumentStatus, getInvoiceNumber } from '../lib/invoices';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FinancialDocumentModal({ isOpen, onClose, onSuccess }: Props) {
  const { profile } = useUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: 'quotation' as FinancialDocument['type'],
    clientId: '',
    employeeId: '',
    orderId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: '', 
    notes: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }]
  });

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  async function fetchData() {
    const [cSnap, eSnap, oSnap, aSnap] = await Promise.all([
      getDocs(query(collection(db, 'clients'), orderBy('name'))),
      getDocs(query(collection(db, 'employees'), orderBy('name'))),
      getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'accounts')))
    ]);
    setClients(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
    setEmployees(eSnap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
    setOrders(oSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    setAccounts(aSnap.docs.map(d => ({ id: d.id, ...d.data() } as Account)));
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const newAmount = calculateInvoiceTotal(newItems);
    setFormData({ ...formData, items: newItems, amount: newAmount });
  };

  type LineItem = NonNullable<FinancialDocument['items']>[number];

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    const newAmount = calculateInvoiceTotal(newItems);
    setFormData({ ...formData, items: newItems, amount: newAmount });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const client = clients.find(c => c.id === formData.clientId);
      const employee = employees.find(e => e.id === formData.employeeId);
      const order = orders.find(o => o.id === formData.orderId);
      const documentRef = doc(collection(db, 'financialDocuments'));
      const batch = writeBatch(db);

      batch.set(documentRef, {
        ...formData,
        invoiceNumber: getInvoiceNumber(formData.type, formData.date, documentRef.id),
        clientName: client?.name || 'N/A',
        employeeName: employee?.name || 'N/A',
        orderId: order?.id || '',
        status: getDefaultDocumentStatus(formData.type),
        createdAt: new Date().toISOString(),
        createdBy: profile?.name || profile?.email || 'System',
        auditTrail: []
      });

      if (formData.type === 'receipt' || formData.type === 'final-invoice') {
         const cashAcc = getRequiredAccountByIdOrName(accounts, [ACCOUNT_IDS.cash, ACCOUNT_IDS.bank], ['cash', 'bank'], 'Cash or Bank');
         const receivableAcc = getRequiredAccountByIdOrName(accounts, [ACCOUNT_IDS.receivable], ['receivable'], 'Accounts Receivable');
         const salesAcc = getRequiredAccountByIdOrName(accounts, [ACCOUNT_IDS.sales], ['sales', 'revenue'], 'Sales Revenue');
         appendLedgerEntryToBatch(db, batch, accounts, {
           date: formData.date,
           description: `${formData.type === 'receipt' ? 'Receipt' : 'Invoice'}: ${client?.name || order?.clientName || 'Client'} (${documentRef.id.slice(0, 8)})`,
           amount: formData.amount,
           debitAccountId: formData.type === 'receipt' ? cashAcc.id : receivableAcc.id,
           creditAccountId: formData.type === 'receipt' ? receivableAcc.id : salesAcc.id,
           reference: documentRef.id,
           type: 'sale'
         });
      }

      await batch.commit();
      onSuccess();
      onClose();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'financialDocuments');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        <header className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl">
                 <FileText size={20} />
              </div>
              <h2 className="text-xl font-black italic tracking-tight uppercase">Financial Hub</h2>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
              <X size={24} />
           </button>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-0 overflow-hidden lg:grid-cols-[1fr_0.9fr]">
          <div className="max-h-[calc(92vh-5.75rem)] space-y-6 overflow-y-auto p-8">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Type</label>
                 <select 
                   required
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold appearance-none"
                   value={formData.type}
                   onChange={e => setFormData({...formData, type: e.target.value as FinancialDocument['type']})}
                 >
                    <option value="quotation">Quotation</option>
                    <option value="advance-invoice">Advance Invoice</option>
                    <option value="receipt">Receipt</option>
                    <option value="final-invoice">Final Invoice</option>
                    <option value="refund">Refund Record</option>
                    <option value="expense">Expense Voucher</option>
                    <option value="payroll">Payroll Receipt</option>
                 </select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                 <input 
                   required
                   type="date"
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold"
                   value={formData.date}
                   onChange={e => setFormData({...formData, date: e.target.value})}
                 />
              </div>
           </div>

           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Associated Order (Optional)</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold appearance-none"
                value={formData.orderId}
                onChange={e => setFormData({...formData, orderId: e.target.value})}
              >
                 <option value="">No Order Linked</option>
                 {orders.map(o => <option key={o.id} value={o.id}>Order #{o.id.slice(0,8)} - {o.clientName}</option>)}
              </select>
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest uppercase">Line Items</label>
                 <button type="button" onClick={addItem} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 hover:underline">
                    <Plus size={12} /> Add Item
                 </button>
              </div>
              <div className="space-y-3">
                 {formData.items.map((item, index) => (
                   <div key={index} className="flex gap-2 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex-1 space-y-1">
                         <input 
                           placeholder="Item description"
                           className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold"
                           value={item.description}
                           onChange={e => updateItem(index, 'description', e.target.value)}
                         />
                         <div className="flex gap-2">
                            <input 
                              type="number"
                              placeholder="Qty"
                              className="w-16 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-black"
                              value={item.quantity}
                              onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                            <input 
                              type="number"
                              placeholder="Rate"
                              className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-black"
                              value={item.rate}
                              onChange={e => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            />
                            <div className="flex-1 bg-slate-200/50 rounded-lg px-3 py-1.5 text-xs font-black text-slate-600 flex items-center justify-end">
                               Rs. {item.amount.toLocaleString()}
                            </div>
                         </div>
                      </div>
                      <button type="button" onClick={() => removeItem(index)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                   </div>
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount (Rs.)</label>
                 <div className="relative">
                    <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      required
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-5 py-3 font-black font-mono shadow-inner"
                      value={formData.amount || ''}
                      onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    />
                 </div>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category/Ref</label>
                 <input 
                   placeholder="e.g. Sales, Rent, Bonus"
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold"
                   value={formData.category}
                   onChange={e => setFormData({...formData, category: e.target.value})}
                 />
              </div>
           </div>

           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes / Itemization</label>
              <textarea 
                rows={3}
                placeholder="Detailed breakdown or internal notes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold resize-none transition-all focus:ring-2 focus:ring-indigo-600"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
           </div>

           <button 
             disabled={loading}
             className="w-full bg-indigo-600 text-white font-black uppercase tracking-widest py-5 rounded-[2rem] shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all active:scale-[0.98] disabled:opacity-50"
           >
              {loading ? 'Processing Ledger...' : 'Commit Document'}
           </button>
          </div>
          <InvoicePreview
            type={formData.type}
            date={formData.date}
            id="draft"
            clientName={clients.find(c => c.id === formData.clientId)?.name || orders.find(o => o.id === formData.orderId)?.clientName || 'Client Name'}
            orderId={formData.orderId}
            items={formData.items}
            amount={formData.amount}
            notes={formData.notes}
          />
        </form>
      </motion.div>
    </div>
  );
}

function InvoicePreview({
  type,
  date,
  id,
  clientName,
  orderId,
  items,
  amount,
  notes,
}: {
  type: FinancialDocument['type'];
  date: string;
  id: string;
  clientName: string;
  orderId: string;
  items: NonNullable<FinancialDocument['items']>;
  amount: number;
  notes: string;
}) {
  const total = amount || calculateInvoiceTotal(items);

  return (
    <aside className="hidden border-l border-slate-200 bg-slate-100/70 p-6 lg:block">
      <div className="mx-auto min-h-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/80">
        <div className="flex items-start justify-between gap-6 border-b border-slate-100 pb-8">
          <BrandLogo markClassName="h-12 w-12 rounded-2xl" textClassName="text-xl" />
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Document</p>
            <h3 className="mt-1 text-2xl font-black uppercase italic tracking-tight text-slate-900">
              {type.replace('-', ' ')}
            </h3>
            <p className="mt-2 font-mono text-[10px] font-black uppercase tracking-widest text-indigo-600">
              {getInvoiceNumber(type, date, id)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 border-b border-slate-100 py-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bill To</p>
            <p className="mt-2 text-lg font-black text-slate-900">{clientName}</p>
            {orderId && <p className="mt-1 font-mono text-[10px] font-bold uppercase text-slate-400">Order #{orderId.slice(0, 8)}</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Issue Date</p>
            <p className="mt-2 text-sm font-black text-slate-900">{date || new Date().toISOString().slice(0, 10)}</p>
            <span className="mt-3 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-600">
              {getDefaultDocumentStatus(type)}
            </span>
          </div>
        </div>

        <div className="py-8">
          <div className="grid grid-cols-[1fr_56px_88px_96px] gap-3 border-b border-slate-200 pb-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Amount</span>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <div key={`${item.description}-${index}`} className="grid grid-cols-[1fr_56px_88px_96px] gap-3 py-4 text-xs">
                <span className="font-bold text-slate-700">{item.description || 'Line item'}</span>
                <span className="text-right font-mono font-bold text-slate-500">{item.quantity}</span>
                <span className="text-right font-mono font-bold text-slate-500">{formatCurrency(item.rate)}</span>
                <span className="text-right font-mono font-black text-slate-900">{formatCurrency(item.quantity * item.rate)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ml-auto max-w-xs space-y-3 border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtotal</span>
            <span className="font-mono text-sm font-black text-slate-900">{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-950 px-5 py-4 text-white">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
            <span className="font-mono text-xl font-black">{formatCurrency(total)}</span>
          </div>
        </div>

        {notes && (
          <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</p>
            <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{notes}</p>
          </div>
        )}
      </div>
    </aside>
  );
}

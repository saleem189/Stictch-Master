import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Client, Employee, FinancialDocument, Order } from '../types';
import { X, DollarSign, Plus, Trash2, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FinancialDocumentModal({ isOpen, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const { profile } = useUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
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
    const [cSnap, eSnap, oSnap] = await Promise.all([
      getDocs(query(collection(db, 'clients'), orderBy('name'))),
      getDocs(query(collection(db, 'employees'), orderBy('name'))),
      getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')))
    ]);
    setClients(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
    setEmployees(eSnap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
    setOrders(oSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const newAmount = newItems.reduce((sum, item) => sum + item.amount, 0);
    setFormData({ ...formData, items: newItems, amount: newAmount });
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    (newItems[index] as any)[field] = value;
    newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    const newAmount = newItems.reduce((sum, item) => sum + item.amount, 0);
    setFormData({ ...formData, items: newItems, amount: newAmount });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const client = clients.find(c => c.id === formData.clientId);
      const employee = employees.find(e => e.id === formData.employeeId);
      const order = orders.find(o => o.id === formData.orderId);

      const docRef = await addDoc(collection(db, 'financialDocuments'), {
        ...formData,
        clientName: client?.name || 'N/A',
        employeeName: employee?.name || 'N/A',
        orderId: order?.id || '',
        status: formData.type === 'receipt' ? 'paid' : 'issued',
        createdAt: new Date().toISOString(),
        createdBy: profile?.name || profile?.email || 'System',
        auditTrail: []
      });

      // If it's a receipt or paid invoice, update ledger
      if (formData.type === 'receipt' || formData.type === 'final-invoice') {
         // Create Transaction logic...
      }

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
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
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

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Type</label>
                 <select 
                   required
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold appearance-none"
                   value={formData.type}
                   onChange={e => setFormData({...formData, type: e.target.value as any})}
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
        </form>
      </motion.div>
    </div>
  );
}

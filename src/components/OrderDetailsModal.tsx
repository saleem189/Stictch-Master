import React, { useState } from 'react';
import { collection, addDoc, getDocs, doc, increment, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, OrderItem, OrderWorkflowStatus, Account } from '../types';
import { X, Save, Clock, User, CheckCircle2, Scissors, Edit3, Truck, Archive, Info, Ruler, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { toast } from 'react-hot-toast';

interface Props {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

const statusWorkflow: OrderWorkflowStatus[] = [
  'measurement',
  'fabric-reservation',
  'pattern-making',
  'cutting',
  'stitching',
  'trial',
  'fitting',
  'alterations',
  'finishing',
  'quality-check',
  'ready',
  'delivered',
  'archived'
];

export default function OrderDetailsModal({ order, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const { profile } = useUser();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<OrderItem[]>(order.items);
  const [globalStatus, setGlobalStatus] = useState(order.status);
  const [activeTab, setActiveTab] = useState<'workflow' | 'financials' | 'audit'>('workflow');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const handlePayment = async () => {
    if (paymentAmount <= 0) return;
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      const newPaidAmount = (order.paidAmount || 0) + paymentAmount;
      
      const auditEntry = {
        action: 'payment_received',
        actor: profile?.name || profile?.email || 'System',
        timestamp: new Date().toISOString(),
        details: `Received payment of Rs. ${paymentAmount.toLocaleString()}. Total paid: Rs. ${newPaidAmount.toLocaleString()}.`
      };

      // 1. Update Order
      await updateDoc(orderRef, {
        paidAmount: newPaidAmount,
        auditTrail: [...(order.auditTrail || []), auditEntry]
      });

      // 2. Create Financial Document (Receipt)
      const docRef = await addDoc(collection(db, 'financialDocuments'), {
        type: 'receipt',
        clientId: order.clientId,
        clientName: order.clientName,
        orderId: order.id,
        amount: paymentAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'paid',
        notes: `Payment for Order #${order.id.slice(0, 8)}`,
        createdAt: new Date().toISOString(),
        createdBy: profile?.name || profile?.email || 'System',
        auditTrail: []
      });

      // 3. Create Journal Entry
      const accountsSnap = await getDocs(collection(db, 'accounts'));
      const accounts = accountsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Account));
      const assetAcc = accounts.find(a => a.type === 'asset' && a.name.toLowerCase().includes('cash'));
      const revenueAcc = accounts.find(a => a.type === 'revenue' || a.name.toLowerCase().includes('sales'));

      if (assetAcc && revenueAcc) {
         await addDoc(collection(db, 'transactions'), {
           date: new Date().toISOString().split('T')[0],
           description: `Order Payment: ${order.clientName} (Order #${order.id.slice(0, 8)})`,
           amount: paymentAmount,
           debitAccountId: assetAcc.id,
           creditAccountId: revenueAcc.id,
           reference: docRef.id,
           type: 'sale'
         });
         await updateDoc(doc(db, 'accounts', assetAcc.id), { balance: increment(paymentAmount) });
         await updateDoc(doc(db, 'accounts', revenueAcc.id), { balance: increment(paymentAmount) });
      }

      setPaymentAmount(0);
      onSuccess();
      toast.success('Payment recorded and ledger updated.');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'payments');
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = (itemId: string, newStatus: OrderWorkflowStatus) => {
    setItems(items.map(item => item.id === itemId ? { ...item, status: newStatus } : item));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      const auditEntry = {
        action: 'update_workflow',
        actor: profile?.name || profile?.email || 'System',
        timestamp: new Date().toISOString(),
        details: 'Updated order workflow and item statuses'
      };

      await updateDoc(orderRef, {
        items: items,
        status: globalStatus,
        updatedAt: new Date().toISOString(),
        auditTrail: [...(order.auditTrail || []), auditEntry]
      });
      onSuccess();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: OrderWorkflowStatus) => {
    switch(status) {
      case 'measurement': return <Ruler size={14} />;
      case 'cutting': return <Scissors size={14} />;
      case 'stitching': return <Edit3 size={14} />;
      case 'delivered': return <Truck size={14} />;
      case 'archived': return <Archive size={14} />;
      case 'ready': return <CheckCircle2 size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="bg-white w-full max-w-2xl h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <header className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">{t('Intelligence Hub')}</span>
               <span className="w-1 h-1 bg-slate-700 rounded-full" />
               <span className="text-[10px] font-bold text-slate-400 uppercase">Order Details</span>
            </div>
            <h2 className="text-xl font-black italic tracking-tight uppercase flex items-center gap-3">
              #{order.id.slice(0, 8)} 
              <span className="text-xs font-normal text-slate-500 lowercase not-italic opacity-50 px-2 py-0.5 border border-slate-800 rounded-full">{order.clientName}</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
             {['workflow', 'financials', 'audit'].map((t: string) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t as 'workflow' | 'financials' | 'audit')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'
                  }`}
                >
                  {t}
                </button>
             ))}
          </div>

          {activeTab === 'workflow' ? (
            <>
              {/* Global Order Status */}
              <section className="space-y-4">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Info size={12} /> {t('Global Order Status')}
                 </h3>
             <div className="flex flex-wrap gap-2">
                {['pending', 'in-progress', 'ready', 'delivered', 'cancelled', 'archived'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setGlobalStatus(s as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      globalStatus === s 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 ring-2 ring-indigo-600 ring-offset-2' 
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
             </div>
          </section>

          {/* Items Workflow */}
          <section className="space-y-6">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Scissors size={12} /> {t('Item-Level Production Pipeline')}
             </h3>
             <div className="space-y-8">
               {items.map((item, idx) => (
                 <div key={item.id || idx} className="bg-slate-50 rounded-[2rem] border border-slate-100 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                             <Scissors size={20} />
                          </div>
                          <div>
                             <h4 className="font-black text-slate-900 leading-tight uppercase italic">{item.type}</h4>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.description || 'No description'}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Current Stage</p>
                          <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                            {item.status}
                          </span>
                       </div>
                    </div>

                    <div className="relative pt-6">
                       <div className="absolute top-[2.1rem] left-0 right-0 h-1 bg-slate-100 rounded-full" />
                       <div className="relative flex justify-between overflow-x-auto pb-4 scrollbar-hide gap-12">
                          {statusWorkflow.map((step) => {
                             const isCurrent = item.status === step;
                             const currentIndex = statusWorkflow.indexOf(item.status as OrderWorkflowStatus);
                             const stepIndex = statusWorkflow.indexOf(step);
                             const isPast = stepIndex < currentIndex;

                             return (
                               <button 
                                 key={step}
                                 onClick={() => updateItemStatus(item.id, step)}
                                 className="flex flex-col items-center gap-3 group/step relative z-10 min-w-[60px]"
                               >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                    isCurrent ? 'bg-indigo-600 text-white scale-125 shadow-xl shadow-indigo-200 ring-4 ring-white' :
                                    isPast ? 'bg-green-500 text-white' :
                                    'bg-white text-slate-300 border-2 border-slate-100'
                                  }`}>
                                     {isPast ? <CheckCircle2 size={14} /> : getStatusIcon(step)}
                                  </div>
                                  <span className={`text-[8px] font-black uppercase tracking-tighter text-center w-full transition-colors ${
                                    isCurrent ? 'text-indigo-600' : 'text-slate-400 group-hover/step:text-slate-600'
                                  }`}>
                                    {step.replace('-', ' ')}
                                  </span>
                               </button>
                             );
                          })}
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </section>
          </>
          ) : activeTab === 'financials' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-center items-center text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Value</p>
                     <p className="text-2xl font-black text-slate-900 font-mono">Rs. {order.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-center items-center text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Balance Due</p>
                     <p className={`text-2xl font-black font-mono ${order.totalAmount - order.paidAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        Rs. {(order.totalAmount - order.paidAmount).toLocaleString()}
                     </p>
                  </div>
               </div>

               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                  <div>
                     <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <DollarSign size={14} className="text-indigo-600" /> 
                        Collect Payment
                     </h4>
                     <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight italic">Financial ledger will be updated automatically</p>
                  </div>
                  
                  <div className="flex gap-4">
                     <div className="flex-1 relative">
                        <DollarSign size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="number"
                          placeholder="Amount in Rs."
                          className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] pl-14 pr-6 py-4 font-black font-mono focus:ring-2 focus:ring-indigo-600 outline-none"
                          value={paymentAmount || ''}
                          onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                        />
                     </div>
                     <button 
                       disabled={loading || paymentAmount <= 0}
                       onClick={handlePayment}
                       className="px-8 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                     >
                        Confirm Receipt
                     </button>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Breakdown</h4>
                  <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100">
                     <table className="w-full text-left">
                        <tbody className="divide-y divide-slate-100">
                           {items.map((item, idx) => (
                             <tr key={idx}>
                                <td className="px-6 py-4 text-xs font-black text-slate-900 italic uppercase tracking-tight">{item.type}</td>
                                <td className="px-6 py-4 text-xs font-mono font-black text-right">Rs. {item.price.toLocaleString()}</td>
                             </tr>
                           ))}
                           <tr className="bg-white">
                              <td className="px-6 py-4 text-xs font-black text-slate-900 uppercase">Grand Total</td>
                              <td className="px-6 py-4 text-xs font-mono font-black text-right text-indigo-600">Rs. {order.totalAmount.toLocaleString()}</td>
                           </tr>
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          ) : (
            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Clock size={12} /> {t('Personnel Activity Log')}
               </h3>
               <div className="space-y-3">
                  {order.auditTrail?.slice().reverse().map((entry: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-all group">
                       <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-300 shrink-0 group-hover:scale-110 transition-transform">
                          <User size={16} />
                       </div>
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-tight">{entry.actor}</span>
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(entry.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">{entry.details}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          )}
        </main>

        <footer className="p-8 border-t border-slate-100 shrink-0 bg-slate-50/50">
           <button 
             disabled={loading}
             onClick={handleSave}
             className="w-full bg-slate-900 text-white font-black uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 group"
           >
             <Save size={20} className="group-hover:rotate-12 transition-transform" />
             {loading ? t('Processing...') : t('Save Workflow Changes')}
           </button>
        </footer>
      </motion.div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Filter, MoreVertical, Printer, DollarSign, Bell, MessageCircle } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import NewOrderForm from '../components/NewOrderForm';
import PaymentModal from '../components/PaymentModal';
import { addDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order } from '../types';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import OrderDetailsModal from '../components/OrderDetailsModal';

export default function Orders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'orders');
    } finally {
      setLoading(false);
    }
  }

  const sendWhatsApp = (order: Order) => {
    const phone = order.clientPhone?.replace(/\D/g, '');
    const message = `Hello ${order.clientName}! This is Tailoring Empire. Your order #${order.id.slice(0, 8)} status is currently: ${order.status.toUpperCase()}. Total amount: Rs. ${order.totalAmount}. Thank you for choosing us!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const printInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Invoice #${order.id.slice(0, 8)}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -0.025em; }
            .invoice-info { text-align: right; }
            .section { margin-top: 40px; }
            .title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f8fafc; padding: 12px; font-size: 10px; font-weight: 900; border-bottom: 1px solid #e2e8f0; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .totals { margin-top: 40px; text-align: right; }
            .total-row { display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 8px; }
            .grand-total { font-size: 20px; font-weight: 900; color: #4f46e5; margin-top: 10px; }
            .footer { margin-top: 60px; font-size: 10px; text-align: center; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Tailoring Empire</div>
            <div class="invoice-info">
              <div style="font-weight: 900;">INVOICE #${order.id.slice(0, 8)}</div>
              <div style="color: #64748b; font-size: 12px;">Date: ${new Date(order.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          <div class="section" style="display: grid; grid-template-cols: 1fr 1fr; gap: 40px;">
            <div>
              <div class="title">Billed To</div>
              <div style="font-weight: 900;">${order.clientName}</div>
              <div style="color: #64748b;">${order.clientPhone || ''}</div>
            </div>
            <div style="text-align: right;">
              <div class="title">Due Date</div>
              <div style="font-weight: 900;">${order.dueDate}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>ITEMS</th>
                <th>DESCRIPTION</th>
                <th style="text-align: right;">PRICE</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td style="font-weight: 700;">${item.type}</td>
                  <td style="color: #64748b;">${item.description}</td>
                  <td style="text-align: right; font-weight: 700;">Rs. ${item.price.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <div class="title">Subtotal</div>
              <div style="font-weight: 700;">Rs. ${order.totalAmount.toLocaleString()}</div>
            </div>
            <div class="total-row">
              <div class="title">Amount Paid</div>
              <div style="font-weight: 700;">Rs. ${order.paidAmount.toLocaleString()}</div>
            </div>
            <div class="total-row grand-total">
              <div class="title" style="margin-top: 8px;">Remaining Balance</div>
              <div>Rs. ${(order.totalAmount - order.paidAmount).toLocaleString()}</div>
            </div>
          </div>

          <div class="footer">
            Thank you for your business. This is a computer generated invoice.
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const sendReminder = async (order: Order) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: order.clientId,
        title: 'Payment Reminder',
        message: `Your tailoring order #${order.id.slice(0, 8)} for ${order.clientName} requires a pending payment of Rs. ${(order.totalAmount - order.paidAmount).toLocaleString()}.`,
        type: 'warning',
        read: false,
        createdAt: new Date().toISOString()
      });
      toast.success(`Reminder sent to ${order.clientName}`, {
        icon: '📤',
        style: { borderRadius: '16px', background: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'notifications');
    }
  };

  return (
    <div className="p-4 sm:p-8 pb-32 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight italic uppercase">{t('Orders')}</h1>
          <p className="text-sm text-slate-500 font-medium">Manage production pipeline and billing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">
             <Filter size={16} /> {t('Filter')}
           </button>
           <button 
             onClick={() => setIsNewOrderOpen(true)}
             className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
           >
             <Plus size={18} /> {t('Add New')}
           </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs">Status & ID</th>
                <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs">Client</th>
                <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs text-center">Production Progress</th>
                <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs text-right">Accounting</th>
                <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs text-right">Due Date</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <span className={`w-2.5 h-2.5 rounded-full ring-4 ring-slate-50 ${
                         order.status === 'delivered' ? 'bg-green-500' :
                         order.status === 'stitching' ? 'bg-indigo-500' :
                         'bg-slate-300'
                       }`} />
                       <div>
                         <div className="font-mono text-[10px] text-slate-400">#{order.id.slice(0, 8)}</div>
                         <div className="text-[10px] uppercase font-black text-slate-900 mt-0.5 tracking-tighter">{order.status}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-900">{order.clientName}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">{order.items.length} items</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                       {order.items.map((item, idx) => (
                         <div key={item.id || idx} className="flex flex-col gap-1 items-center">
                            <div className={`h-1 rounded-full w-8 ${
                              item.status === 'delivered' ? 'bg-green-500' :
                              item.status === 'measurement' ? 'bg-slate-200' :
                              'bg-indigo-500'
                            }`} title={`${item.type}: ${item.status}`} />
                            <span className="text-[8px] font-black text-slate-400 uppercase truncate w-8 text-center">{item.type}</span>
                         </div>
                       ))}
                       {!order.items && <span className="text-slate-300 italic">No items</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-slate-900 font-black font-mono">Rs. {order.totalAmount.toLocaleString()}</div>
                    <div className={`text-[9px] font-black uppercase mt-0.5 ${order.paidAmount >= order.totalAmount ? 'text-green-600' : 'text-slate-400 tracking-tighter'}`}>
                      {order.paidAmount >= order.totalAmount ? 'Fully Settled' : `Bal: Rs. ${(order.totalAmount - order.paidAmount).toLocaleString()}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-xs font-black text-slate-900">{order.dueDate}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Deadline</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => sendWhatsApp(order)}
                         className="p-2 hover:bg-green-50 rounded-xl text-green-600 transition-all active:scale-90" 
                         title="WhatsApp Client"
                       >
                         <MessageCircle size={16} />
                       </button>
                       {order.paidAmount < order.totalAmount && (
                         <>
                           <button 
                             onClick={() => sendReminder(order)}
                             className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all active:scale-90" 
                             title="Send Reminder"
                           >
                             <Bell size={16} />
                           </button>
                           <button 
                             onClick={() => setSelectedOrderForPayment(order)}
                             className="p-2 hover:bg-green-50 rounded-xl text-green-600 transition-all active:scale-90" 
                             title="Record Payment"
                           >
                             <DollarSign size={16} />
                           </button>
                         </>
                       )}
                       <button 
                         onClick={() => printInvoice(order)}
                         className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all active:scale-90" 
                         title="Print Invoice"
                       >
                         <Printer size={16} />
                       </button>
                       <button 
                         onClick={() => setSelectedOrderDetails(order)}
                         className="p-2 hover:bg-indigo-50 rounded-xl text-indigo-600 transition-all active:scale-90" 
                         title="View Details"
                       >
                         <MoreVertical size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
               <ShoppingBag size={48} strokeWidth={1.5} className="mb-4 opacity-20" />
               <p className="font-bold text-sm uppercase tracking-widest">No active orders found</p>
               <button onClick={() => setIsNewOrderOpen(true)} className="mt-4 text-indigo-600 font-bold text-xs uppercase tracking-widest hover:underline">Create your first order</button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isNewOrderOpen && (
          <NewOrderForm 
            onClose={() => setIsNewOrderOpen(false)} 
            onSuccess={() => { setIsNewOrderOpen(false); fetchOrders(); }} 
          />
        )}
        {selectedOrderForPayment && (
          <PaymentModal 
            order={selectedOrderForPayment}
            onClose={() => setSelectedOrderForPayment(null)}
            onSuccess={() => { setSelectedOrderForPayment(null); fetchOrders(); }}
          />
        )}
        {selectedOrderDetails && (
          <OrderDetailsModal 
            order={selectedOrderDetails}
            onClose={() => setSelectedOrderDetails(null)}
            onSuccess={() => { setSelectedOrderDetails(null); fetchOrders(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

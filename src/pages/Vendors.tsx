import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, increment, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Vendor, VendorBill, Payment } from '../types';
import { Truck, Receipt, Plus, Wallet, ArrowRightLeft, X, Save, Edit2, ChevronDown, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import VendorModal from '../components/VendorModal';
import VendorBillModal from '../components/VendorBillModal';
import { InventoryItem } from '../types';

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | undefined>();
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Payment Form State
  const [paymentData, setPaymentData] = useState({
    vendorId: '',
    amount: 0,
    method: 'Cash',
    billId: '' 
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const vSnap = await getDocs(collection(db, 'vendors'));
      const bSnap = await getDocs(collection(db, 'vendorBills'));
      const pSnap = await getDocs(query(collection(db, 'payments'), orderBy('date', 'desc')));
      const iSnap = await getDocs(collection(db, 'inventory'));
      
      setVendors(vSnap.docs.map(d => ({ id: d.id, ...d.data() } as Vendor)));
      setBills(bSnap.docs.map(d => ({ id: d.id, ...d.data() } as VendorBill)));
      setPayments(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)).filter(p => p.type === 'outbound'));
      setInventory(iSnap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem)));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'vendors');
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData.vendorId || paymentData.amount <= 0) return;

    try {
      // 1. Create Payment Record
      const newPayment: Omit<Payment, 'id'> = {
        date: new Date().toISOString(),
        amount: paymentData.amount,
        method: paymentData.method,
        type: 'outbound',
        entityId: paymentData.vendorId,
        referenceId: paymentData.billId || 'general_payment'
      };
      await addDoc(collection(db, 'payments'), newPayment);

      // 2. Update Vendor Balance
      await updateDoc(doc(db, 'vendors', paymentData.vendorId), {
        balance: increment(-paymentData.amount)
      });

      // 3. Update Bill status if applicable
      if (paymentData.billId) {
        const bill = bills.find(b => b.id === paymentData.billId);
        if (bill) {
          const newPaidAmount = (bill.paidAmount || 0) + paymentData.amount;
          const newStatus = newPaidAmount >= bill.amount ? 'paid' : 'partial';
          await updateDoc(doc(db, 'vendorBills', paymentData.billId), {
            paidAmount: newPaidAmount,
            status: newStatus
          });
        }
      }

      // 4. Create Transaction Entry
      await addDoc(collection(db, 'transactions'), {
        date: new Date().toISOString(),
        description: `Vendor Payment: ${vendors.find(v => v.id === paymentData.vendorId)?.name}${paymentData.billId ? ` (Bill Ref: ${paymentData.billId.slice(-6)})` : ''}`,
        amount: paymentData.amount,
        debitAccountId: 'accounts_payable',
        creditAccountId: 'cash_at_bank',
        reference: paymentData.vendorId
      });

      setIsPaymentModalOpen(false);
      setPaymentData({ vendorId: '', amount: 0, method: 'Cash', billId: '' });
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'payments');
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Suppliers & Procurement</h1>
          <p className="text-sm text-slate-500 font-medium">Manage fabric vendors and outstanding payables.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button 
            onClick={() => { setSelectedVendor(undefined); setIsVendorModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Plus size={16} /> Add Vendor
          </button>
          <button 
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-100 hover:bg-slate-800 transition-all active:scale-95"
          >
            <Wallet size={16} /> Record Payment
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        {['All', 'Fabric Supplier', 'Notions Supplier', 'Service Provider', 'Machinery', 'Packaging', 'Other'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              selectedCategory === cat 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {vendors.filter(v => selectedCategory === 'All' || v.category === selectedCategory).map(vendor => (
          <div key={vendor.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:shadow-md hover:border-indigo-100 transition-all relative overflow-hidden">
             <div className="absolute top-4 right-4 lg:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  onClick={() => { setSelectedVendor(vendor); setIsVendorModalOpen(true); }}
                  className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                >
                  <Edit2 size={14} />
                </button>
             </div>
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm truncate">{vendor.name}</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{vendor.category}</p>
                </div>
              </div>
            <div className="flex justify-between items-end relative z-10">
              <div>
                <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1.5">Outstanding</p>
                <p className={`text-xl font-black font-mono leading-none ${vendor.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  Rs. {vendor.balance.toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setViewingVendor(vendor)}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline transition-all active:scale-95"
              >
                Details
              </button>
            </div>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-fit">
          <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm flex items-center gap-2">
               <Receipt size={18} className="text-slate-400" />
               Procurement History
            </h2>
            <button 
              onClick={() => setIsBillModalOpen(true)}
              className="text-[10px] text-indigo-600 font-black uppercase tracking-widest hover:underline px-4 py-2 bg-indigo-50 rounded-xl"
            >
              + New Bill
            </button>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-100">
                  <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs">Post Date</th>
                  <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs">Vendor</th>
                  <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs text-right">Bill Amount</th>
                  <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs text-right">Settled</th>
                  <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {bills.map(bill => (
                   <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-xs font-black text-slate-400">{bill.date}</td>
                      <td className="px-6 py-4 font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {vendors.find(v => v.id === bill.vendorId)?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-black text-slate-900 text-xs">Rs. {bill.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-mono font-black text-green-600 text-[10px]">Rs. {(bill.paidAmount || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-[9px] uppercase font-black px-3 py-1.5 rounded-full border ${
                          bill.status === 'paid' ? 'bg-green-50 text-green-700 border-green-100' : 
                          bill.status === 'partial' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                   </tr>
                 ))}
                 {bills.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-6 py-24 text-center ">
                       <div className="flex flex-col items-center justify-center text-slate-300">
                         <Receipt size={40} strokeWidth={1} className="mb-3 opacity-20" />
                         <p className="text-[10px] font-black uppercase tracking-widest">No procurement records</p>
                       </div>
                     </td>
                   </tr>
                 )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-fit">
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm flex items-center gap-2">
               <ArrowRightLeft size={18} className="text-slate-400" />
               Payment Ledger
            </h2>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-100">
                  <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs">Activity Date</th>
                  <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs">Recipient</th>
                  <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs text-right">Method</th>
                  <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs text-right text-green-600">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {payments.map(payment => (
                   <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-xs font-black text-slate-400">{new Date(payment.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {vendors.find(v => v.id === payment.entityId)?.name || 'Generic Vendor'}
                      </td>
                      <td className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">{payment.method}</td>
                      <td className="px-6 py-4 text-right font-mono font-black text-green-600 text-xs shadow-sm">
                        Rs. {payment.amount.toLocaleString()}
                      </td>
                   </tr>
                 ))}
                 {payments.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-300">
                          <ArrowRightLeft size={40} strokeWidth={1} className="mb-3 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest">No outbound payments</p>
                        </div>
                     </td>
                   </tr>
                 )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
                 <div className="relative z-10">
                    <h2 className="font-black italic tracking-tight text-xl">Record Disbursement</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Outgoing Payment Entry</p>
                 </div>
                 <button onClick={() => setIsPaymentModalOpen(false)} className="relative z-10 p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl -mr-16 -mt-16" />
              </div>
              <form onSubmit={handleRecordPayment} className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Payee Vendor</label>
                    <select 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                      value={paymentData.vendorId}
                      onChange={e => setPaymentData({...paymentData, vendorId: e.target.value, billId: ''})}
                    >
                      <option value="">Choose a vendor...</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                 </div>

                 {paymentData.vendorId && (
                   <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign to Bill (Optional)</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                        value={paymentData.billId}
                        onChange={e => {
                          const billId = e.target.value;
                          const selectedBill = bills.find(b => b.id === billId);
                          setPaymentData({
                            ...paymentData, 
                            billId,
                            amount: billId && selectedBill ? selectedBill.amount - (selectedBill.paidAmount || 0) : paymentData.amount
                          });
                        }}
                      >
                        <option value="">General Payment (No Bill)</option>
                        {bills.filter(b => b.vendorId === paymentData.vendorId && b.status !== 'paid').map(b => (
                          <option key={b.id} value={b.id}>Bill Date: {b.date} (Rem: Rs. {b.amount - (b.paidAmount || 0)})</option>
                        ))}
                      </select>
                   </div>
                 )}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Settlement Amount</label>
                    <div className="relative">
                       <input 
                         type="number" 
                         required 
                         placeholder="0.00"
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-600 font-mono font-black text-lg transition-all"
                         value={paymentData.amount || ''}
                         onChange={e => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})}
                       />
                       <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">PKR</span>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Channel</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                      value={paymentData.method}
                      onChange={e => setPaymentData({...paymentData, method: e.target.value})}
                    >
                      <option value="Cash">Cash Liquidity</option>
                      <option value="Bank Transfer">Bank Transfer (Digital)</option>
                      <option value="Cheque">Physical Cheque</option>
                    </select>
                 </div>
                 <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]">
                    <Save size={18} /> record & synchronize
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <VendorModal 
        isOpen={isVendorModalOpen} 
        onClose={() => setIsVendorModalOpen(false)} 
        onSuccess={fetchData} 
        vendor={selectedVendor}
      />

      <VendorBillModal 
        isOpen={isBillModalOpen} 
        onClose={() => setIsBillModalOpen(false)} 
        onSuccess={fetchData}
      />

      <AnimatePresence>
        {viewingVendor && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
             <motion.div 
               initial={{ x: '100%' }}
               animate={{ x: 0 }}
               exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col pt-10"
             >
                <div className="px-8 pb-8 flex items-center justify-between border-b border-slate-50">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                         <Truck size={24} />
                      </div>
                      <div>
                         <h2 className="text-2xl font-black text-slate-900">{viewingVendor.name}</h2>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{viewingVendor.category}</p>
                      </div>
                   </div>
                   <button onClick={() => setViewingVendor(null)} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                      <X size={24} className="text-slate-400" />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-12">
                    <div className="grid grid-cols-3 gap-6 py-2 border-b border-slate-50 pb-6 mb-10">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Contact Person</p>
                        <p className="text-xs font-bold text-slate-900">{viewingVendor.contactPerson || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                        <p className="text-xs font-bold text-slate-900 font-mono">{viewingVendor.phone}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                        <p className="text-xs font-bold text-slate-900 truncate">{viewingVendor.email || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Unpaid Exposure</p>
                         <p className="text-2xl font-black text-red-500 text-center font-mono leading-none">Rs. {viewingVendor.balance.toLocaleString()}</p>
                      </div>
                      <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                         <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2 text-center">Total Settled</p>
                         <p className="text-2xl font-black text-green-600 text-center font-mono leading-none">
                            Rs. {payments.filter(p => p.entityId === viewingVendor.id).reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                         </p>
                      </div>
                   </div>

                   <section className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-l-4 border-indigo-600 pl-3 italic">Itemized Bills</h3>
                         <button 
                            onClick={() => { setIsBillModalOpen(true); }}
                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                          >
                            New Entry
                          </button>
                      </div>
                      <div className="space-y-4">
                         {bills.filter(b => b.vendorId === viewingVendor.id).map(bill => (
                            <div key={bill.id} className="space-y-2">
                               <div 
                                  onClick={() => setExpandedBillId(expandedBillId === bill.id ? null : bill.id)}
                                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-colors cursor-pointer"
                               >
                                  <div className="flex items-center gap-4">
                                     <div className={`w-2 h-2 rounded-full ${bill.status === 'paid' ? 'bg-green-500' : bill.status === 'partial' ? 'bg-indigo-500' : 'bg-red-500 animate-pulse'}`} />
                                     <div>
                                        <p className="font-black text-slate-900 text-sm">Ref: {bill.id.slice(-6)}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{bill.date}</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-6">
                                     <div className="text-right">
                                        <p className="font-mono font-black text-slate-900 text-sm">Rs. {bill.amount.toLocaleString()}</p>
                                        <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">Settled: Rs. {(bill.paidAmount || 0).toLocaleString()}</p>
                                     </div>
                                     <div className={`p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:text-slate-600 transition-all ${expandedBillId === bill.id ? 'rotate-180' : ''}`}>
                                        <ChevronDown size={14} />
                                     </div>
                                  </div>
                               </div>
                               
                               <AnimatePresence>
                                  {expandedBillId === bill.id && bill.items && bill.items.length > 0 && (
                                     <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden bg-slate-50/50 rounded-2xl border border-slate-50"
                                     >
                                        <div className="p-4 space-y-3">
                                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-2">Bill Manifest</p>
                                           <div className="space-y-2">
                                              {bill.items.map((item, idx) => {
                                                 const inventoryItem = inventory.find(i => i.id === item.inventoryId);
                                                 return (
                                                    <div key={idx} className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-100/50 shadow-sm">
                                                       <div className="flex items-center gap-3">
                                                          <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                                             <Package size={12} />
                                                          </div>
                                                          <div>
                                                             <p className="text-xs font-black text-slate-700">{inventoryItem?.name || 'Unknown Item'}</p>
                                                             <p className="text-[9px] font-bold text-slate-400 uppercase">Rate: Rs. {item.rate}</p>
                                                          </div>
                                                       </div>
                                                       <div className="text-right">
                                                          <p className="text-xs font-black text-slate-900">x{item.quantity}</p>
                                                          <p className="text-[10px] font-mono font-bold text-slate-500">Rs. {(item.quantity * item.rate).toLocaleString()}</p>
                                                       </div>
                                                    </div>
                                                 );
                                              })}
                                           </div>
                                        </div>
                                     </motion.div>
                                  )}
                               </AnimatePresence>
                            </div>
                         ))}
                         {bills.filter(b => b.vendorId === viewingVendor.id).length === 0 && (
                            <p className="text-center py-12 text-slate-300 uppercase font-black text-[10px] tracking-widest italic">No bills linked</p>
                         )}
                      </div>
                   </section>

                   <section className="space-y-6 pb-12">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-l-4 border-green-600 pl-3 italic">Payment History</h3>
                      <div className="space-y-4">
                         {payments.filter(p => p.entityId === viewingVendor.id).map(payment => (
                            <div key={payment.id} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-50 transition-all hover:bg-white hover:shadow-sm">
                               <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                                  <ArrowRightLeft size={14} className="text-slate-400" />
                               </div>
                               <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                     <p className="font-black text-slate-900 text-sm">Payment Recorded</p>
                                     <p className="font-mono font-black text-green-600 text-sm">Rs. {payment.amount.toLocaleString()}</p>
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                     <p className="text-[10px] text-slate-400 font-bold">{new Date(payment.date).toLocaleDateString()}</p>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{payment.method}</p>
                                  </div>
                                  {payment.referenceId && payment.referenceId !== 'general_payment' && (
                                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-2 bg-indigo-50 w-fit px-2 py-1 rounded-md">Bill Ref: {payment.referenceId.slice(-6)}</p>
                                  )}
                               </div>
                            </div>
                         ))}
                         {payments.filter(p => p.entityId === viewingVendor.id).length === 0 && (
                            <p className="text-center py-12 text-slate-300 uppercase font-black text-[10px] tracking-widest italic">No payments processed</p>
                         )}
                      </div>
                   </section>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


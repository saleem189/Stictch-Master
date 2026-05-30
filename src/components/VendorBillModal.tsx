import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, increment, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Account, Vendor, InventoryItem } from '../types';
import { X, Save, Receipt, Search, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ACCOUNT_IDS, appendLedgerEntryToBatch, getRequiredAccountByIdOrName } from '../lib/ledger';

interface VendorBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VendorBillModal({ isOpen, onClose, onSuccess }: VendorBillModalProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: '',
    items: [{ inventoryId: '', quantity: 1, rate: 0 }],
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchContext();
    }
  }, [isOpen]);

  async function fetchContext() {
    try {
      const vSnap = await getDocs(collection(db, 'vendors'));
      const iSnap = await getDocs(collection(db, 'inventory'));
      const aSnap = await getDocs(collection(db, 'accounts'));
      setVendors(vSnap.docs.map(d => ({ id: d.id, ...d.data() } as Vendor)));
      setInventory(iSnap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem)));
      setAccounts(aSnap.docs.map(d => ({ id: d.id, ...d.data() } as Account)));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'bill_context');
    }
  }

  const addItem = () => setFormData({ ...formData, items: [...formData.items, { inventoryId: '', quantity: 1, rate: 0 }] });
  const removeItem = (index: number) => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  const updateItem = (index: number, field: keyof typeof formData.items[0], value: string | number) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index] };
    
    if (field === 'inventoryId' && typeof value === 'string') {
      item.inventoryId = value;
      const selected = inventory.find(i => i.id === value);
      if (selected) item.rate = selected.pricePerUnit;
    } else if (field === 'quantity' && typeof value === 'number') {
      item.quantity = value;
    } else if (field === 'rate' && typeof value === 'number') {
      item.rate = value;
    }
    
    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.vendorId) return;
    if (formData.items.some(item => !item.inventoryId || item.quantity <= 0)) return;

    setSubmitting(true);
    try {
      const batch = writeBatch(db);
      const inventoryAcc = getRequiredAccountByIdOrName(accounts, [ACCOUNT_IDS.inventory], ['inventory', 'fabric'], 'Fabric Inventory');
      const payableAcc = getRequiredAccountByIdOrName(accounts, [ACCOUNT_IDS.vendorPayable], ['payable'], 'Vendor Payables');

      // 1. Create bill
      const billRef = doc(collection(db, 'vendorBills'));
      const billData = {
        vendorId: formData.vendorId,
        date: new Date().toISOString().split('T')[0],
        amount: totalAmount,
        paidAmount: 0,
        status: 'pending',
        items: formData.items
      };
      batch.set(billRef, billData);

      // 2. Update Vendor Balance
      batch.update(doc(db, 'vendors', formData.vendorId), {
        balance: increment(totalAmount)
      });

      // 3. Update Inventory Stock
      for (const item of formData.items) {
        if (item.inventoryId) {
          batch.update(doc(db, 'inventory', item.inventoryId), {
            quantity: increment(item.quantity)
          });
        }
      }

      appendLedgerEntryToBatch(db, batch, accounts, {
        date: new Date().toISOString(),
        description: `Vendor Procurement: ${vendors.find(v => v.id === formData.vendorId)?.name} (Bill Ref: ${billRef.id.slice(-6)})`,
        amount: totalAmount,
        debitAccountId: inventoryAcc.id,
        creditAccountId: payableAcc.id,
        reference: billRef.id,
        type: 'purchase'
      });

      await batch.commit();
      onSuccess();
      onClose();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'vendor_bills');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-xl">
              <Receipt size={20} />
            </div>
            <div>
              <h2 className="font-black text-lg tracking-tight">Record Procurement Bill</h2>
              <p className="text-[10px] uppercase font-bold text-amber-300 tracking-widest">Inbound Logistics</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Search size={12} /> Select Vendor
              </label>
              <select 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-amber-500 font-bold tracking-tight appearance-none"
                value={formData.vendorId}
                onChange={e => setFormData({...formData, vendorId: e.target.value})}
              >
                <option value="">Choose a supplier...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name} (Bal: Rs. {v.balance})</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill Line Items</h3>
                <button type="button" onClick={addItem} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all">
                  <Plus size={14} /> Add Line
                </button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {formData.items.map((it, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100"
                    >
                      <div className="flex-1 space-y-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Item</label>
                        <select 
                          required 
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                          value={it.inventoryId}
                          onChange={e => updateItem(idx, 'inventoryId', e.target.value)}
                        >
                          <option value="">Select Item</option>
                          {inventory.map(inv => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} ({inv.quantity} {inv.unit} in stock)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-20 space-y-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Qty</label>
                        <input 
                          type="number" 
                          required 
                          min="1"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                          value={it.quantity}
                          onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="w-28 space-y-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Rate (Rs.)</label>
                        <input 
                          type="number" 
                          required 
                          min="0"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                          value={it.rate}
                          onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value))}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeItem(idx)}
                        className="p-2.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </form>

        <div className="p-8 bg-slate-50 border-t border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Liability</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight font-mono">Rs. {totalAmount.toLocaleString()}</p>
            </div>
            <div className="flex gap-4">
               <button type="button" onClick={onClose} className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-50">Cancel</button>
               <button 
                onClick={handleSubmit} 
                disabled={submitting || !formData.vendorId || formData.items.length === 0}
                className="px-8 py-4 bg-amber-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-lg shadow-amber-100 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
               >
                 <Save size={16} /> 
                 {submitting ? 'Finalizing...' : 'Finalize Bill'}
               </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

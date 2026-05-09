import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Vendor } from '../types';
import { X, Save, Truck, Phone, Mail, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vendor?: Vendor;
}

export default function VendorModal({ isOpen, onClose, onSuccess, vendor }: VendorModalProps) {
  const [formData, setFormData] = useState({
    name: vendor?.name || '',
    contactPerson: vendor?.contactPerson || '',
    phone: vendor?.phone || '',
    email: vendor?.email || '',
    address: vendor?.address || '',
    category: vendor?.category || 'Fabric',
    balance: vendor?.balance || 0
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (vendor?.id) {
        await updateDoc(doc(db, 'vendors', vendor.id), formData);
      } else {
        await addDoc(collection(db, 'vendors'), formData);
      }
      onSuccess();
      onClose();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'vendors');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-xl">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="font-black text-lg tracking-tight">{vendor ? 'Edit Partner' : 'Onboard Supplier'}</h2>
              <p className="text-[10px] uppercase font-bold text-blue-300 tracking-widest">Procurement Network</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Company Name</label>
              <input 
                type="text" 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold tracking-tight"
                placeholder="e.g. Italian Wool Co."
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supplier Category</label>
              <select 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold tracking-tight"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="Fabric Supplier">Fabric Supplier</option>
                <option value="Notions Supplier">Notions Supplier</option>
                <option value="Service Provider">Service Provider</option>
                <option value="Machinery">Machinery</option>
                <option value="Packaging">Packaging</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact Person</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.contactPerson}
                  onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Phone size={10} /> Phone</label>
                <input 
                  type="tel" 
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Mail size={10} /> Email (Optional)</label>
              <input 
                type="email" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={10} /> Address</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Starting Balance (Debit/Credit)</label>
              <input 
                type="number" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                value={formData.balance}
                onChange={e => setFormData({...formData, balance: parseFloat(e.target.value)})}
              />
              <p className="text-[9px] text-slate-400 font-medium">Positive values indicate outstanding payable to vendor.</p>
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 group">
            <Save size={20} className="group-hover:scale-110 transition-transform" />
            {vendor ? 'Update Credentials' : 'Certify Supplier'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

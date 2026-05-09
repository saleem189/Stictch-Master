import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { InventoryItem } from '../types';
import { X, Save, Package, Ruler, Tag, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item?: InventoryItem;
}

export default function InventoryModal({ isOpen, onClose, onSuccess, item }: InventoryModalProps) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || '',
    quantity: item?.quantity || 0,
    unit: item?.unit || 'Meters',
    minLevel: item?.minLevel || 5,
    pricePerUnit: item?.pricePerUnit || 0
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (item?.id) {
        await updateDoc(doc(db, 'inventory', item.id), formData);
      } else {
        await addDoc(collection(db, 'inventory'), formData);
      }
      onSuccess();
      onClose();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'inventory');
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
            <div className="p-2 bg-indigo-500 rounded-xl">
              <Package size={20} />
            </div>
            <div>
              <h2 className="font-black text-lg tracking-tight">{item ? 'Edit Stock' : 'Add New Supply'}</h2>
              <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">Inventory Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Tag size={12} /> Item Name
              </label>
              <input 
                type="text" 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                placeholder="e.g. Navy Blue Wool"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-medium appearance-none"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Select Category</option>
                <option value="Fabric">Fabric</option>
                <option value="Thread">Thread</option>
                <option value="Buttons">Buttons</option>
                <option value="Zip">Zip</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Ruler size={12} /> Unit
              </label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
              >
                <option value="Meters">Meters</option>
                <option value="Yards">Yards</option>
                <option value="Pieces">Pieces</option>
                <option value="Spools">Spools</option>
                <option value="Sets">Sets</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Initial Quantity</label>
              <input 
                type="number" 
                required 
                min="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 text-orange-600">
                <AlertCircle size={12} /> Min Level
              </label>
              <input 
                type="number" 
                required 
                min="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                value={formData.minLevel}
                onChange={e => setFormData({...formData, minLevel: parseFloat(e.target.value)})}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price Per Unit (Purchase)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rs.</span>
                <input 
                  type="number" 
                  required 
                  min="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  value={formData.pricePerUnit}
                  onChange={e => setFormData({...formData, pricePerUnit: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-4 group">
            <Save size={20} className="group-hover:scale-110 transition-transform" />
            {item ? 'Commit Changes' : 'Register Supplies'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

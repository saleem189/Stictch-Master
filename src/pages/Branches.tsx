import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Branch } from '../types';
import { MapPin, Plus, X, Phone, User, Settings, Building2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';

export default function Branches() {
  const { t } = useTranslation();
  const { isAdmin } = useUser();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    isActive: true
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  async function fetchBranches() {
    try {
      const snap = await getDocs(query(collection(db, 'branches'), orderBy('name')));
      setBranches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Branch)));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'branches');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await updateDoc(doc(db, 'branches', editingBranch.id), formData);
      } else {
        await addDoc(collection(db, 'branches'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      setIsAdding(false);
      setEditingBranch(null);
      setFormData({ name: '', address: '', phone: '', email: '', manager: '', isActive: true });
      fetchBranches();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'branches');
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email || '',
      manager: branch.manager || '',
      isActive: branch.isActive
    });
    setIsAdding(true);
  };

  return (
    <div className="p-4 sm:p-8 pb-32 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight italic uppercase">{t('Branches')}</h1>
          <p className="text-sm text-slate-500 font-medium">Manage multiple shop locations and points of sale.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { setEditingBranch(null); setIsAdding(true); }}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={20} />
            {t('Register New Branch')}
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(branch => (
          <div key={branch.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Building2 size={80} />
             </div>
             
             <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                      <MapPin size={24} />
                   </div>
                   <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${branch.isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                      {branch.isActive ? 'Active' : 'Maintenance'}
                   </span>
                </div>

                <h3 className="text-xl font-black italic tracking-tight uppercase text-slate-900 mb-2">{branch.name}</h3>
                
                <div className="space-y-4 flex-1">
                   <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">{branch.address}</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <Phone size={16} className="text-slate-400" />
                      <p className="text-sm font-bold text-slate-900">{branch.phone}</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <User size={16} className="text-slate-400" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{branch.manager || 'No Manager Assigned'}</p>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <Globe size={14} className="text-slate-300" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {branch.id.slice(0, 8)}</span>
                   </div>
                   {isAdmin && (
                     <button 
                       onClick={() => handleEdit(branch)}
                       className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                     >
                        <Settings size={18} />
                     </button>
                   )}
                </div>
             </div>
          </div>
        ))}

        {branches.length === 0 && (
          <div className="col-span-full py-24 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[3rem]">
             <Building2 size={64} className="mx-auto text-slate-200 mb-4" />
             <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Expansion Required: No branches found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <h2 className="text-xl font-black italic tracking-tight uppercase tracking-widest">{editingBranch ? 'Update Location' : 'Register Location'}</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
                 <div className="space-y-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Branch Name</label>
                       <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
                       <textarea rows={2} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                          <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Email</label>
                          <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Manager</label>
                       <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold" value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                       <label htmlFor="isActive" className="text-sm font-bold text-slate-700">Open for Business</label>
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-indigo-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-slate-900 shadow-xl shadow-indigo-100 transition-all">
                    {editingBranch ? 'Persist Changes' : 'Confirm Registration'}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

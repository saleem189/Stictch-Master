import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Employee } from '../types';
import { X, Save, UserCircle, Phone, DollarSign, MapPin, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: Employee;
}

export default function EmployeeModal({ isOpen, onClose, onSuccess, employee }: EmployeeModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    role: employee?.role || 'Master Tailor',
    salary: employee?.salary || 0,
    phone: employee?.phone || '',
    address: employee?.address || '',
    email: employee?.email || '',
    joinedAt: employee?.joinedAt || new Date().toISOString().split('T')[0]
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (employee?.id) {
        await updateDoc(doc(db, 'employees', employee.id), formData);
      } else {
        await addDoc(collection(db, 'employees'), formData);
      }
      onSuccess();
      onClose();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'employees');
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
            <div className="p-2 bg-indigo-600 rounded-xl">
              <UserCircle size={20} />
            </div>
            <div>
              <h2 className="font-black text-lg tracking-tight uppercase italic">{employee ? t('Update Profile') : 'New Staff Enrollment'}</h2>
              <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">Personnel Records</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('Name')}</label>
              <input 
                type="text" 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-600 font-bold tracking-tight"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Briefcase size={10} /> Role</label>
                <select 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="Master Tailor">Master Tailor</option>
                  <option value="Associate Tailor">Associate Tailor</option>
                  <option value="Cutting Specialist">Cutting Specialist</option>
                  <option value="Finishing Artist">Finishing Artist</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><DollarSign size={10} /> Monthly Salary</label>
                <input 
                  type="number" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 font-mono font-bold"
                  value={formData.salary}
                  onChange={e => setFormData({...formData, salary: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Phone size={10} /> {t('Phone')}</label>
              <input 
                type="tel" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">Email (Login Identity)</label>
              <input 
                type="email" 
                placeholder="Linked account email..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><MapPin size={10} /> {t('Address')}</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 min-h-[80px]"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group">
            <Save size={20} className="group-hover:scale-110 transition-transform" />
            {employee ? t('Save') : 'Enroll Staff'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

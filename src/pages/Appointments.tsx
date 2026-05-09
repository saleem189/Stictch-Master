import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Appointment, Client, Employee } from '../types';
import { Calendar, Plus, Clock, User, Scissors, CheckCircle2, XCircle, AlertCircle, Filter, ChevronLeft, ChevronRight, Info, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';

export default function Appointments() {
  const { t } = useTranslation();
  const { profile } = useUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Form State
  const [formData, setFormData] = useState({
    clientId: '',
    type: 'measurement' as Appointment['type'],
    startTime: '',
    endTime: '',
    assignedTo: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const aSnap = await getDocs(query(collection(db, 'appointments'), orderBy('startTime')));
      const cSnap = await getDocs(query(collection(db, 'clients'), orderBy('name')));
      const eSnap = await getDocs(query(collection(db, 'employees'), orderBy('name')));

      setAppointments(aSnap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
      setClients(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
      setEmployees(eSnap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'appointments');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const client = clients.find(c => c.id === formData.clientId);
      const employee = employees.find(e => e.id === formData.assignedTo);

      await addDoc(collection(db, 'appointments'), {
        ...formData,
        clientName: client?.name,
        assignedToName: employee?.name,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      });

      setIsAdding(false);
      setFormData({ clientId: '', type: 'measurement', startTime: '', endTime: '', assignedTo: '', notes: '' });
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'appointments');
    }
  };

  const updateStatus = async (id: string, status: Appointment['status']) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status });
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'appointments');
    }
  };

  const filteredAppointments = appointments.filter(a => a.startTime.startsWith(selectedDate));

  const getStatusColor = (status: Appointment['status']) => {
    switch(status) {
      case 'scheduled': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'no-show': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight italic uppercase">{t('Appointments')}</h1>
          <p className="text-sm text-slate-500 font-medium">Schedule trials, fittings, and visits.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          {t('Schedule Visit')}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Side / Date Picker */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">{t('Calendar')}</h2>
                 <div className="flex gap-2">
                    <button className="p-1 hover:bg-slate-50 rounded-lg"><ChevronLeft size={16} /></button>
                    <button className="p-1 hover:bg-slate-50 rounded-lg"><ChevronRight size={16} /></button>
                 </div>
              </div>
              <input 
                type="date" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-900 shadow-inner"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <div className="mt-8 space-y-4">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Quick Stats')}</div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-indigo-50 p-4 rounded-xl text-center border border-indigo-100">
                       <p className="text-xs font-black text-indigo-600 mb-1">{filteredAppointments.length}</p>
                       <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter">Today</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                       <p className="text-xs font-black text-green-600 mb-1">{appointments.filter(a => a.status === 'scheduled').length}</p>
                       <p className="text-[8px] font-bold text-green-400 uppercase tracking-tighter">Total Pending</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Schedule List */}
        <div className="lg:col-span-8 space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Upcoming Visits')} - {new Date(selectedDate).toDateString()}</h3>
              <div className="flex items-center gap-2">
                 <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Filter size={16} /></button>
              </div>
           </div>

           <div className="space-y-4">
              {filteredAppointments.map(appt => (
                <div key={appt.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group flex flex-col sm:flex-row gap-6">
                   <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl w-24 h-24 shrink-0 border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                      <Clock size={20} className="text-slate-400 group-hover:text-indigo-600 mb-2" />
                      <span className="font-black text-slate-900 leading-tight">{new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Arrival</span>
                   </div>

                   <div className="flex-1 space-y-4 min-w-0">
                      <div className="flex items-start justify-between">
                         <div>
                            <h4 className="text-lg font-black text-slate-900 leading-tight uppercase italic">{appt.clientName}</h4>
                            <div className="flex flex-wrap gap-3 mt-1.5">
                               <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-2.5 py-1 rounded-full">
                                  <Scissors size={10} /> {appt.type}
                               </span>
                               <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-2.5 py-1 rounded-full">
                                  <User size={10} /> {appt.assignedToName || 'Unassigned'}
                               </span>
                            </div>
                         </div>
                         <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${getStatusColor(appt.status)}`}>
                            {appt.status}
                         </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                         <div className="flex items-center gap-1.5">
                            <Info size={14} className="text-slate-400" />
                            <span className="font-medium italic truncate">{appt.notes || 'No specific requests mentioned'}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex sm:flex-col justify-end gap-2 lg:opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <button 
                        onClick={() => updateStatus(appt.id, 'completed')}
                        className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                        title="Mark Complete"
                      >
                         <CheckCircle2 size={18} />
                      </button>
                      <button 
                        onClick={() => updateStatus(appt.id, 'cancelled')}
                        className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        title="Cancel Appointment"
                      >
                         <XCircle size={18} />
                      </button>
                      <button 
                        onClick={() => updateStatus(appt.id, 'no-show')}
                        className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                        title="Record No-Show"
                      >
                         <AlertCircle size={18} />
                      </button>
                   </div>
                </div>
              ))}

              {filteredAppointments.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 text-slate-400">
                   <Calendar size={48} className="opacity-10 mb-4" />
                   <p className="font-black text-xs uppercase tracking-widest">No visits scheduled for this date</p>
                </div>
              )}
           </div>
        </div>
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
                <h2 className="text-xl font-black italic tracking-tight uppercase tracking-widest">{t('Schedule Visit')}</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                 <div className="space-y-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Client')}</label>
                       <select 
                         required
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                         value={formData.clientId}
                         onChange={e => setFormData({...formData, clientId: e.target.value})}
                       >
                          <option value="">{t('Select Client')}</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Type')}</label>
                          <select 
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value as any})}
                          >
                             <option value="measurement">Measurement</option>
                             <option value="trial">Trial</option>
                             <option value="fitting">Fitting</option>
                             <option value="delivery">Delivery</option>
                             <option value="consultation">Consultation</option>
                          </select>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Assigned To')}</label>
                          <select 
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                            value={formData.assignedTo}
                            onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                          >
                             <option value="">{t('Choose Representative')}</option>
                             {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Start Time')}</label>
                          <input 
                            required
                            type="datetime-local"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                            value={formData.startTime}
                            onChange={e => setFormData({...formData, startTime: e.target.value})}
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('End Time')}</label>
                          <input 
                            required
                            type="datetime-local"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                            value={formData.endTime}
                            onChange={e => setFormData({...formData, endTime: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Notes')}</label>
                       <textarea 
                         rows={3}
                         placeholder="Any specific requests or preparation required..."
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold resize-none"
                         value={formData.notes}
                         onChange={e => setFormData({...formData, notes: e.target.value})}
                       />
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-indigo-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-900 shadow-xl shadow-indigo-100 transition-all group">
                    <Save size={20} className="group-hover:rotate-12 transition-transform" />
                    {t('Confirm Appointment')}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

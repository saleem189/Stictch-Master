import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Client, MeasurementRecord } from '../types';
import { Plus, Search, User, Phone, Ruler, Save, Edit2, X, History, Clock, ChevronRight, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

export default function Clients() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Client | null>(null);
  const [history, setHistory] = useState<MeasurementRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    phone: '',
    address: '',
    measurements: {}
  });

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'clients');
    }
  }

  async function fetchHistory(clientId: string) {
    try {
      const q = query(
        collection(db, 'measurements'),
        where('clientId', '==', clientId),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as MeasurementRecord)));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'measurements');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      let clientId = '';
      if (editingClient) {
        clientId = editingClient.id;
        await updateDoc(doc(db, 'clients', clientId), {
          ...formData,
          createdAt: editingClient.createdAt // preserve
        });
      } else {
        const docRef = await addDoc(collection(db, 'clients'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        clientId = docRef.id;
      }

      // Record measurement history
      await addDoc(collection(db, 'measurements'), {
        clientId: clientId,
        date: new Date().toISOString(),
        measurements: formData.measurements
      });

      setIsAdding(false);
      setEditingClient(null);
      setFormData({ name: '', phone: '', address: '', measurements: {} });
      fetchClients();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'clients');
    }
  }

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{t('Clients')}</h1>
          <p className="text-sm text-slate-500 font-medium">Manage measurements and customer records.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          {t('Add New')}
        </button>
      </header>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder={`${t('Search')}...`} 
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredClients.map(client => (
          <motion.div 
            layout
            key={client.id}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User size={24} className="text-slate-400" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 leading-tight">{client.name}</h3>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                    <Phone size={10} />
                    {client.phone}
                  </div>
                  {client.address && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                      <MapPin size={10} />
                      <span className="truncate max-w-[150px]">{client.address}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setViewingHistory(client); fetchHistory(client.id); }}
                  className="p-2 hover:bg-indigo-50 rounded-xl text-slate-300 hover:text-indigo-600 transition-all active:scale-90"
                  title="View History"
                >
                  <History size={16} />
                </button>
                <button 
                  onClick={() => { setEditingClient(client); setFormData(client); setIsAdding(true); }}
                  className="p-2 hover:bg-indigo-50 rounded-xl text-slate-300 hover:text-indigo-600 transition-all active:scale-90"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                <span className="font-serif italic normal-case tracking-normal text-xs">Current Measurements (in)</span>
                <Ruler size={14} className="opacity-50" />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {Object.entries(client.measurements).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center bg-slate-50/50 px-3 py-1.5 rounded-lg border border-slate-100/50">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter truncate">{key}</span>
                    <span className="font-mono text-xs font-black text-slate-900">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {viewingHistory && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col"
            >
              <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic">Measurement Log</p>
                  <h2 className="text-2xl font-black italic tracking-tight">{viewingHistory.name}</h2>
                </div>
                <button onClick={() => setViewingHistory(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide">
                {history.length > 0 ? (
                  <div className="space-y-10">
                    {history.map((record, idx) => (
                      <div key={record.id} className="relative pl-8 border-l-2 border-slate-100">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full" />
                        <div className="mb-4">
                          <p className="text-xs font-black text-slate-900 bg-slate-50 w-fit px-3 py-1 rounded-full border border-slate-200">
                            {new Date(record.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {Object.entries(record.measurements).map(([key, val]) => (
                            <div key={key} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{key}</p>
                              <p className="font-mono font-black text-slate-900 text-xs">{val}"</p>
                            </div>
                          ))}
                        </div>
                        {idx < history.length - 1 && (
                          <div className="mt-8 flex justify-center">
                            <ChevronRight size={16} className="text-slate-100 rotate-90" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300">
                    <Clock size={48} className="mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest text-center">No historical data available</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal / Side Panel for Add/Edit */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/20 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <h2 className="text-xl font-black italic tracking-tight">{editingClient ? 'Edit Record' : 'New Client'}</h2>
                <button onClick={() => { setIsAdding(false); setEditingClient(null); }} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Basic Information')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('Name')}</label>
                      <input 
                        required 
                        placeholder="e.g. John Doe"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('Phone')}</label>
                      <input 
                        required 
                        placeholder="+92 XXX XXXXXXX"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('Address')}</label>
                      <input 
                        placeholder="Street, City, Country"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Measurements <span className="text-[8px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 lowercase">inches</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {['neck', 'chest', 'waist', 'hip', 'shoulder', 'sleeve', 'length', 'inseam'].map(field => (
                      <div key={field} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{field}</label>
                        <input 
                          type="number" 
                          step="0.1"
                          placeholder="0.0"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-mono text-sm font-bold"
                          value={(formData.measurements as Record<string, number>)?.[field] || ''}
                          onChange={e => setFormData({
                            ...formData, 
                            measurements: { ...formData.measurements, [field]: parseFloat(e.target.value) }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <div className="pt-8">
                  <button type="submit" className="w-full bg-indigo-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all">
                    <Save size={20} />
                    {editingClient ? t('Save') : t('Save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

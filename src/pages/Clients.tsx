import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Client, MeasurementRecord, Household } from '../types';
import { Plus, Search, User, Phone, Ruler, Save, Edit2, X, History, Clock, ChevronRight, MapPin, MessageCircle, Home, StickyNote, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { validateForm, validators } from '../lib/validation';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { toast } from 'react-hot-toast';

export default function Clients() {
  const { t } = useTranslation();
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState<'clients' | 'households'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingHousehold, setIsAddingHousehold] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Client | null>(null);
  const [history, setHistory] = useState<MeasurementRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [viewingTab, setViewingTab] = useState<'timeline' | 'measurements' | 'gallery'>('timeline');

  // Form State
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    phone: '',
    address: '',
    householdId: '',
    measurements: {}
  });

  const [householdFormData, setHouseholdFormData] = useState<Partial<Household>>({
    name: '',
    primaryContactName: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchClients();
    fetchHouseholds();
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

  async function fetchHouseholds() {
    try {
      const q = query(collection(db, 'households'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setHouseholds(snap.docs.map(d => ({ id: d.id, ...d.data() } as Household)));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'households');
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
    
    // Validate
    const { isValid, errors } = validateForm(formData, {
      name: validators.required('Customer name is required'),
      phone: validators.phone('Invalid phone format'),
      address: validators.required('Address is required')
    });
    
    if (!isValid) {
      setFormErrors(errors);
      toast.error('Please correct the validation errors');
      return;
    }
    
    setFormErrors({});
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
      const currentVersion = history.length > 0 ? (history[0].version || 0) : 0;
      await addDoc(collection(db, 'measurements'), {
        clientId: clientId,
        version: currentVersion + 1,
        date: new Date().toISOString(),
        measurements: formData.measurements,
        recordedBy: profile?.name || profile?.email || 'Unknown',
        notes: (formData as any).notes || ''
      });

      setIsAdding(false);
      setEditingClient(null);
      setFormData({ name: '', phone: '', address: '', measurements: {} });
      fetchClients();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'clients');
    }
  }

  async function handleHouseholdSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingHousehold) {
        await updateDoc(doc(db, 'households', editingHousehold.id), {
          ...householdFormData
        });
      } else {
        await addDoc(collection(db, 'households'), {
          ...householdFormData,
          createdAt: new Date().toISOString()
        });
      }
      setIsAddingHousehold(false);
      setEditingHousehold(null);
      setHouseholdFormData({ name: '', primaryContactName: '', phone: '', address: '' });
      fetchHouseholds();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'households');
    }
  }

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="p-4 sm:p-8 pb-32 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight italic uppercase">{t('Clients')}</h1>
          <p className="text-sm text-slate-500 font-medium">Manage measurements and customer records.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              if (activeTab === 'clients') setIsAdding(true);
              else setIsAddingHousehold(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={20} />
            {activeTab === 'clients' ? t('Add Client') : t('Add Household')}
          </button>
        </div>
      </header>

      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('clients')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'clients' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <User size={14} />
          {t('Individual Clients')}
        </button>
        <button 
          onClick={() => setActiveTab('households')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'households' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Home size={14} />
          {t('Households')}
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder={`${t('Search')} ${activeTab}...`} 
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {activeTab === 'clients' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredClients.map(client => {
            const household = households.find(h => h.id === client.householdId);
            return (
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
                        {client.phone || (household?.phone)}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const p = client.phone || household?.phone;
                            if (p) window.open(`https://wa.me/${p.replace(/\D/g, '')}`, '_blank');
                          }}
                          className="ml-2 p-1 hover:bg-green-50 text-slate-300 hover:text-green-600 rounded-md transition-all"
                        >
                          <MessageCircle size={10} />
                        </button>
                      </div>
                      {(client.address || household?.address) && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                          <MapPin size={10} />
                          <span className="truncate max-w-[150px]">{client.address || household?.address}</span>
                        </div>
                      )}
                      {household && (
                        <div className="flex items-center gap-1.5 text-indigo-500 text-[8px] font-black uppercase tracking-widest mt-1 bg-indigo-50 w-fit px-2 py-0.5 rounded-full">
                          <Home size={8} />
                          {household.name}
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
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {households.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase())).map(household => {
            const members = clients.filter(c => c.householdId === household.id);
            return (
              <motion.div 
                layout
                key={household.id}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Home size={28} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg leading-tight uppercase italic">{household.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                        <User size={10} /> {household.primaryContactName}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setEditingHousehold(household); setHouseholdFormData(household); setIsAddingHousehold(true); }}
                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-600 transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Phone size={14} />
                    </div>
                    <span className="text-sm font-bold">{household.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <MapPin size={14} />
                    </div>
                    <span className="text-sm font-bold truncate">{household.address}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Members')}</span>
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{members.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {members.map(member => (
                      <div key={member.id} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 group/member">
                        <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center text-slate-400 text-[10px]">
                          <User size={10} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{member.name}</span>
                      </div>
                    ))}
                    {members.length === 0 && (
                      <p className="text-[10px] italic text-slate-400">No members linked</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

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

              <div className="flex bg-slate-900 border-b border-indigo-900/50 p-2">
                 {['timeline', 'measurements', 'gallery'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setViewingTab(tab as any)}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        viewingTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab}
                    </button>
                 ))}
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide">
                {viewingTab === 'timeline' ? (
                   <div className="space-y-6">
                      {/* Timeline logic ... */}
                   </div>
                ) : viewingTab === 'measurements' ? (
                  <div className="space-y-10">
                    {history.map((record, idx) => (
                      <div key={record.id} className="relative pl-8 border-l-2 border-slate-100">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full" />
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <p className="text-xs font-black text-slate-900 bg-slate-50 w-fit px-3 py-1 rounded-full border border-slate-200">
                              {new Date(record.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </p>
                            <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">v{record.version}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                             <UserCheck size={12} />
                             <span className="text-[10px] font-bold">{record.recordedBy}</span>
                          </div>
                        </div>
                        {record.notes && (
                          <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <div className="flex items-start gap-2">
                              <StickyNote size={12} className="text-slate-400 mt-0.5" />
                              <p className="text-[10px] text-slate-600 font-medium italic">{record.notes}</p>
                            </div>
                          </div>
                        )}
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
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('Household')}</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                        value={formData.householdId || ''}
                        onChange={e => {
                          const hId = e.target.value;
                          const h = households.find(h => h.id === hId);
                          setFormData({
                            ...formData, 
                            householdId: hId,
                            address: h ? h.address : formData.address,
                            phone: h && !formData.phone ? h.phone : formData.phone
                          });
                        }}
                      >
                        <option value="">{t('No Household (Individual)')}</option>
                        {households.map(h => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('Name')}</label>
                      <input 
                        required 
                        placeholder="e.g. John Doe"
                        className={`w-full bg-slate-50 border ${formErrors.name ? 'border-red-500' : 'border-slate-200'} rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold`}
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                      {formErrors.name && <p className="text-[9px] text-red-500 font-bold ml-2">{formErrors.name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('Phone')}</label>
                      <input 
                        required 
                        placeholder="+92 XXX XXXXXXX"
                        className={`w-full bg-slate-50 border ${formErrors.phone ? 'border-red-500' : 'border-slate-200'} rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold`}
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                      {formErrors.phone && <p className="text-[9px] text-red-500 font-bold ml-2">{formErrors.phone}</p>}
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
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('Notes')}</label>
                      <textarea 
                        rows={2}
                        placeholder="Additional notes about measurements..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold resize-none"
                        value={(formData as any).notes || ''}
                        onChange={e => setFormData({...formData, notes: e.target.value} as any)}
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

      <AnimatePresence>
        {isAddingHousehold && (
          <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/20 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg h-full rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                <h2 className="text-2xl font-black italic tracking-tight uppercase">{editingHousehold ? 'Edit Household' : 'New Household'}</h2>
                <button onClick={() => { setIsAddingHousehold(false); setEditingHousehold(null); }} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleHouseholdSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Household Name')}</label>
                    <input 
                      required 
                      placeholder="e.g. The Ahmed Family"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-black uppercase italic"
                      value={householdFormData.name}
                      onChange={e => setHouseholdFormData({...householdFormData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Primary Contact Name')}</label>
                    <input 
                      required 
                      placeholder="e.g. Bilal Ahmed"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                      value={householdFormData.primaryContactName}
                      onChange={e => setHouseholdFormData({...householdFormData, primaryContactName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Phone')}</label>
                    <input 
                      required 
                      placeholder="+92 XXX XXXXXXX"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                      value={householdFormData.phone}
                      onChange={e => setHouseholdFormData({...householdFormData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Shared Address')}</label>
                    <textarea 
                      required 
                      rows={3}
                      placeholder="Full Address..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold resize-none"
                      value={householdFormData.address}
                      onChange={e => setHouseholdFormData({...householdFormData, address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-8">
                  <button type="submit" className="w-full bg-indigo-600 text-white font-black uppercase tracking-widest py-5 rounded-[2rem] flex items-center justify-center gap-2 hover:bg-slate-900 shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all group">
                    <Save size={20} className="group-hover:rotate-12 transition-transform" />
                    {editingHousehold ? t('Update Household') : t('Create Household')}
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

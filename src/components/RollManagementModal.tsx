import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { InventoryItem, FabricRoll, InventoryLog } from '../types';
import { X, Plus, Ruler, History, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem;
  onSuccess: () => void;
}

export default function RollManagementModal({ isOpen, onClose, item, onSuccess }: Props) {
  const { profile } = useUser();
  const [rolls, setRolls] = useState<FabricRoll[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingRoll, setIsAddingRoll] = useState(false);
  const [isConsuming, setIsConsuming] = useState<FabricRoll | null>(null);

  const [rollFormData, setRollFormData] = useState({
    rollNumber: '',
    originalLength: 0,
    color: '',
    location: ''
  });

  const [consumptionAmount, setConsumptionAmount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchRolls();
      fetchLogs();
    }
  }, [isOpen, item.id]);

  async function fetchRolls() {
    const q = query(collection(db, 'fabricRolls'), where('inventoryId', '==', item.id));
    const snap = await getDocs(q);
    setRolls(snap.docs.map(d => ({ id: d.id, ...d.data() } as FabricRoll)));
  }

  async function fetchLogs() {
    const q = query(collection(db, 'inventoryLogs'), where('inventoryId', '==', item.id));
    const snap = await getDocs(q);
    setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryLog)).sort((a,b) => b.timestamp.localeCompare(a.timestamp)));
  }

  const handleAddRoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      const rollRef = doc(collection(db, 'fabricRolls'));
      batch.set(rollRef, {
        ...rollFormData,
        inventoryId: item.id,
        remainingLength: rollFormData.originalLength,
        status: 'in-stock',
        createdAt: new Date().toISOString()
      });

      const invRef = doc(db, 'inventory', item.id);
      batch.update(invRef, {
        quantity: item.quantity + rollFormData.originalLength
      });

      await batch.commit();
      setIsAddingRoll(false);
      setRollFormData({ rollNumber: '', originalLength: 0, color: '', location: '' });
      fetchRolls();
      onSuccess();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'fabricRolls');
    } finally {
      setLoading(false);
    }
  };

  const handleConsume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConsuming || consumptionAmount <= 0) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const rollRef = doc(db, 'fabricRolls', isConsuming.id);
      const invRef = doc(db, 'inventory', item.id);
      const logRef = doc(collection(db, 'inventoryLogs'));

      const newRemaining = isConsuming.remainingLength - consumptionAmount;
      batch.update(rollRef, { 
        remainingLength: newRemaining,
        status: newRemaining <= 0 ? 'depleted' : 'in-stock'
      });
      batch.update(invRef, { quantity: item.quantity - consumptionAmount });
      batch.set(logRef, {
        inventoryId: item.id,
        rollId: isConsuming.id,
        action: 'usage',
        quantity: consumptionAmount,
        performedBy: profile?.name || profile?.email || 'System',
        timestamp: new Date().toISOString(),
        notes: `Consumed from roll ${isConsuming.rollNumber}`
      });

      await batch.commit();
      setIsConsuming(null);
      setConsumptionAmount(0);
      fetchRolls();
      fetchLogs();
      onSuccess();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'inventoryLogs');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="bg-white w-full max-w-2xl h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <header className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
           <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic">Roll Tracking</p>
              <h2 className="text-xl font-black italic tracking-tight uppercase">{item.name}</h2>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
              <X size={24} />
           </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
           {/* Summary Stats */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Available</p>
                 <p className="text-2xl font-black text-indigo-900 font-mono">{item.quantity} <span className="text-xs italic">{item.unit}</span></p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Rolls</p>
                 <p className="text-2xl font-black text-slate-900 font-mono">{rolls.filter(r => r.status !== 'depleted').length}</p>
              </div>
           </div>

           {/* Roll List */}
           <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Ruler size={12} /> Active Fabric Rolls
                 </h3>
                 <button 
                   onClick={() => setIsAddingRoll(true)}
                   className="text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 hover:underlinetransition-all"
                 >
                    <Plus size={12} /> Add Roll
                 </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {rolls.map(roll => (
                   <div key={roll.id} className={`p-4 rounded-2xl border transition-all ${roll.status === 'depleted' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll #{roll.rollNumber}</p>
                            <h4 className="font-black text-slate-900 italic uppercase">{roll.color || 'No Color'}</h4>
                         </div>
                         <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${roll.status === 'depleted' ? 'bg-slate-200 text-slate-400' : 'bg-green-100 text-green-700'}`}>
                            {roll.status}
                         </span>
                      </div>
                      
                      <div className="space-y-3">
                         <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Available:</span>
                            <span className="font-black font-mono text-slate-900">{roll.remainingLength} / {roll.originalLength} {item.unit}</span>
                         </div>
                         <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(roll.remainingLength / roll.originalLength) * 100}%` }} />
                         </div>
                         {roll.status !== 'depleted' && (
                           <button 
                             onClick={() => setIsConsuming(roll)}
                             className="w-full mt-2 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                           >
                             Consume Fabric
                           </button>
                         )}
                      </div>
                   </div>
                 ))}
                 {rolls.length === 0 && (
                   <p className="col-span-2 text-center text-xs italic text-slate-400 py-8">No rolls registered for this item</p>
                 )}
              </div>
           </section>

           {/* Consumption Logs */}
           <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                 <History size={12} /> Recent Movement
              </h3>
              <div className="space-y-3">
                 {logs.slice(0, 5).map(log => (
                   <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400">
                            <History size={14} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-900 uppercase leading-none mb-1">{log.notes}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{log.performedBy} • {new Date(log.timestamp).toLocaleDateString()}</p>
                         </div>
                      </div>
                      <span className="font-mono text-xs font-black text-red-600">-{log.quantity}</span>
                   </div>
                 ))}
              </div>
           </section>
        </main>

        {/* Add Roll Modal */}
        <AnimatePresence>
          {isAddingRoll && (
            <div className="absolute inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center">
               <motion.form 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 onSubmit={handleAddRoll}
                 className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl space-y-6"
               >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-black italic uppercase tracking-tight">Register New Roll</h3>
                    <button type="button" onClick={() => setIsAddingRoll(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  </div>
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Tag size={10} /> Roll Number</label>
                        <input required placeholder="ROLL-001" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold" value={rollFormData.rollNumber} onChange={e => setRollFormData({...rollFormData, rollNumber: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Ruler size={10} /> Length ({item.unit})</label>
                        <input required type="number" placeholder="50.0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold" value={rollFormData.originalLength || ''} onChange={e => setRollFormData({...rollFormData, originalLength: parseFloat(e.target.value)})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">Color/Spec</label>
                        <input placeholder="Navy / 120s" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold" value={rollFormData.color} onChange={e => setRollFormData({...rollFormData, color: e.target.value})} />
                     </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                     {loading ? 'Registering...' : 'Confirm Roll'}
                  </button>
               </motion.form>
            </div>
          )}
        </AnimatePresence>

        {/* Consume Modal */}
        <AnimatePresence>
          {isConsuming && (
            <div className="absolute inset-0 z-[60] bg-indigo-900/60 backdrop-blur-sm p-4 flex items-center justify-center text-white">
               <motion.form 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 20 }}
                 onSubmit={handleConsume}
                 className="w-full max-w-sm space-y-8 text-center"
               >
                  <div className="space-y-2">
                     <AlertTriangle size={48} className="mx-auto text-amber-400 mb-4" />
                     <h3 className="text-2xl font-black italic uppercase">Consume Fabric</h3>
                     <p className="text-sm font-medium text-indigo-200">How many {item.unit} are you taking from Roll #{isConsuming.rollNumber}?</p>
                  </div>
                  <div className="relative">
                     <input 
                       autoFocus
                       required
                       type="number"
                       step="0.1"
                       max={isConsuming.remainingLength}
                       className="w-full bg-transparent border-b-4 border-white text-6xl font-black font-mono text-center outline-none p-4 placeholder:text-white/20"
                       placeholder="0.0"
                       value={consumptionAmount || ''}
                       onChange={e => setConsumptionAmount(parseFloat(e.target.value))}
                     />
                     <span className="absolute bottom-4 left-1/2 translate-x-[120px] text-xl font-bold uppercase tracking-widest opacity-50">{item.unit}</span>
                  </div>
                  <div className="flex gap-4">
                     <button type="button" onClick={() => setIsConsuming(null)} className="flex-1 py-4 font-black uppercase tracking-widest border-2 border-white/20 rounded-2xl hover:bg-white/10 transition-all">Cancel</button>
                     <button type="submit" disabled={loading} className="flex-1 py-4 font-black uppercase tracking-widest bg-white text-indigo-900 rounded-2xl hover:bg-indigo-50 shadow-2xl transition-all">
                        {loading ? 'Logging...' : 'Log Usage'}
                     </button>
                  </div>
               </motion.form>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

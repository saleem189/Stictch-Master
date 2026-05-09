import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { InventoryItem } from '../types';
import { Package, Plus, AlertCircle, Search, Edit2 } from 'lucide-react';
import InventoryModal from '../components/InventoryModal';

import { useTranslation } from 'react-i18next';

export default function Inventory() {
  const { t } = useTranslation();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>();

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      const q = query(collection(db, 'inventory'), orderBy('quantity', 'asc'));
      const snap = await getDocs(q);
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem)));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'inventory');
    }
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight italic uppercase">{t('Inventory')}</h1>
          <p className="text-sm text-slate-500 font-medium">Monitor fabrics, threads, and supplies.</p>
        </div>
        <button 
          onClick={() => { setSelectedItem(undefined); setIsModalOpen(true); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          {t('Add New')}
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-4 shadow-sm hover:shadow-md transition-all group">
          <div className="p-3 bg-slate-900 rounded-2xl text-white group-hover:scale-110 transition-transform">
            <Package size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total SKU</p>
            <p className="text-xl font-black text-slate-900">{items.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-4 shadow-sm hover:shadow-md transition-all group">
          <div className="p-3 bg-red-500 rounded-2xl text-white group-hover:scale-110 transition-transform shadow-lg shadow-red-100">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Stock</p>
            <p className="text-xl font-black text-red-600">{items.filter(i => i.quantity <= i.minLevel).length}</p>
          </div>
        </div>
        <div className="sm:col-span-2 relative group lg:h-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search items or categories..." 
            className="w-full h-full bg-white border border-slate-200 rounded-3xl py-4 lg:py-0 pl-16 pr-6 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs">Item Identity</th>
                <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs">Category</th>
                <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs text-right">Quantity</th>
                <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs text-right">Unit Price</th>
                <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs">Status</th>
                <th className="px-6 py-5 font-serif italic normal-case tracking-normal text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-900">{item.name}</div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">Ref: {item.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-black text-slate-500 uppercase bg-slate-100 px-2.5 py-1 rounded-full">{item.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-right font-black text-slate-900">{item.quantity} <span className="text-[10px] text-slate-400 font-sans italic">{item.unit}</span></td>
                  <td className="px-6 py-4 text-xs font-black text-slate-500 text-right font-mono">Rs. {item.pricePerUnit}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] uppercase font-black px-3 py-1.5 rounded-full border ${
                      item.quantity === 0 ? 'bg-red-50 text-red-700 border-red-100 shadow-sm shadow-red-50' :
                      item.quantity <= item.minLevel ? 'bg-amber-50 text-amber-700 border-amber-100 shadow-sm shadow-amber-50' :
                      'bg-green-50 text-green-700 border-green-100 shadow-sm shadow-green-50'
                    }`}>
                      {item.quantity === 0 ? 'Out of Stock' : item.quantity <= item.minLevel ? 'Reorder Needed' : 'Nominal Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}
                      className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90 opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Package size={48} strokeWidth={1} className="mb-4 opacity-20" />
                      <p className="font-black text-xs uppercase tracking-widest">Vault is empty</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InventoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchInventory} 
        item={selectedItem}
      />
    </div>
  );
}

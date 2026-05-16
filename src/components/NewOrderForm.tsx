import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { Client, Employee, OrderItem, Order, Branch, OrderWorkflowStatus } from '../types';
import { X, Plus, Trash2, Save, User, UserCheck, Calendar, Scissors, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useUser } from '../contexts/UserContext';
import { calculateOrderTotal } from '../lib/orderFinance';
import { createNotification } from '../lib/notifications';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewOrderForm({ onClose, onSuccess }: Props) {
  const { profile } = useUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    dueDate: '',
    assignedTo: '',
    branchId: profile?.branchId || '',
    advancePayment: 0,
    items: [{ id: Math.random().toString(36).substr(2, 9), type: 'Shirt', description: '', price: 0, status: 'measurement' }] as OrderItem[]
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const cSnap = await getDocs(query(collection(db, 'clients'), orderBy('name')));
        const eSnap = await getDocs(query(collection(db, 'employees'), orderBy('name')));
        const bSnap = await getDocs(query(collection(db, 'branches')));

        setClients(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
        setEmployees(eSnap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
        setBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() } as Branch)));
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, []);

  const addItem = () => {
    setFormData({ 
      ...formData, 
      items: [...formData.items, { id: Math.random().toString(36).substr(2, 9), type: 'Suit', description: '', price: 0, status: 'measurement' }] 
    });
  };

  const removeItem = (index: number) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value } as OrderItem;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedClient = clients.find(c => c.id === formData.clientId);
      const totalAmount = calculateOrderTotal(formData.items);

      const orderData: Omit<Order, 'id'> = {
        clientId: formData.clientId,
        clientName: selectedClient?.name || 'Unknown',
        clientPhone: selectedClient?.phone || '',
        items: formData.items.map(item => ({
          ...item,
          measurements: item.measurements || selectedClient?.measurements || {},
          status: item.status || 'measurement' as OrderWorkflowStatus,
          dueDate: item.dueDate || formData.dueDate
        })),
        status: 'pending',
        totalAmount,
        paidAmount: 0,
        advancePayment: formData.advancePayment,
        dueDate: formData.dueDate,
        assignedTo: formData.assignedTo,
        branchId: formData.branchId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        auditTrail: [{
          action: 'create',
          actor: profile?.name || profile?.email || 'System',
          timestamp: new Date().toISOString(),
          details: 'Order created'
        }]
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      const orderId = docRef.id;

      // Create initial tasks for the employee if one is assigned
      if (formData.assignedTo) {
        const employee = employees.find(e => e.id === formData.assignedTo);
        const taskTypes: ('cutting' | 'stitching' | 'finishing')[] = ['cutting', 'stitching', 'finishing'];
        
        for (const type of taskTypes) {
          await addDoc(collection(db, 'tasks'), {
            orderId: orderId,
            employeeId: formData.assignedTo,
            employeeName: employee?.name || 'Unknown',
            type: type,
            status: 'pending',
            createdAt: new Date().toISOString()
          });
        }
      }

      // Automated Ledger Entry (simplified)
      await addDoc(collection(db, 'transactions'), {
        date: new Date().toISOString(),
        description: `Revenue: New Order #${orderId.slice(0, 8)} for ${orderData.clientName}`,
        amount: totalAmount,
        debitAccountId: 'accounts_receivable', // assume ID
        creditAccountId: 'sales_revenue', // assume ID
        reference: orderId
      });

      // System Notification for Admin
      // In a real multi-user app, you'd find admins via query. 
      // For this prototype, we'll notify the current user too if they are the admin.
      await createNotification(db, {
        userId: auth.currentUser?.uid,
        title: 'New Order Received',
        message: `Order #${orderId.slice(0, 8)} for ${orderData.clientName} has been created.`,
        type: 'success',
      });

      onSuccess();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'orders');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <Scissors size={20} />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Create New Work Order</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <User size={12} />
                Client Selection
              </label>
              <select 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.clientId}
                onChange={e => setFormData({...formData, clientId: e.target.value})}
              >
                <option value="">Select a client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={12} />
                Branch
              </label>
              <select 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.branchId}
                onChange={e => setFormData({...formData, branchId: e.target.value})}
              >
                <option value="">Select branch...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} />
                Global Due Date
              </label>
              <input 
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.dueDate}
                onChange={e => setFormData({...formData, dueDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <UserCheck size={12} />
                Primary Assignee
              </label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.assignedTo}
                onChange={e => setFormData({...formData, assignedTo: e.target.value})}
              >
                <option value="">Choose employee...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} - {e.role}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Advance Payment (Rs.)</label>
            <input 
              type="number"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.advancePayment || ''}
              onChange={e => setFormData({...formData, advancePayment: parseFloat(e.target.value)})}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order Items</label>
               <button type="button" onClick={addItem} className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
                 <Plus size={12} /> Add Item
               </button>
            </div>
            
            <div className="space-y-3">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex gap-3 group animate-in fade-in slide-in-from-top-2">
                  <div className="w-1/3">
                    <input 
                      placeholder="Type (e.g. Suit)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      value={item.type}
                      onChange={e => updateItem(idx, 'type', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      placeholder="Description"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <input 
                      type="number"
                      placeholder="Price"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 font-mono"
                      value={item.price || ''}
                      onChange={e => updateItem(idx, 'price', parseFloat(e.target.value))}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeItem(idx)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-slate-500">
               <span className="text-[10px] font-bold uppercase tracking-widest block">Total Amount</span>
               <span className="text-xl font-bold text-slate-900 font-mono">Rs. {calculateOrderTotal(formData.items).toLocaleString()}</span>
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 transition-all">
              <Save size={18} />
              Confirm Order
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

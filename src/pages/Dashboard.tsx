import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, InventoryItem } from '../types';
import { 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  CheckCircle2, 
  ArrowUpRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import NewOrderForm from '../components/NewOrderForm';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { processRecurringTransactions } from '../lib/automation';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const QuickAction = ({ icon: Icon, label, color, onClick }: { icon: React.ElementType, label: string, color: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all group active:scale-95"
  >
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:-translate-y-1`}>
      <Icon size={24} />
    </div>
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-900">{label}</span>
  </button>
);

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ title, value, trend, trendLabel, icon: Icon, color }: StatCardProps) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 ${color} opacity-5 rounded-full transition-transform group-hover:scale-125`} />
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 ${color} bg-opacity-10 rounded-lg text-current`}>
        <Icon size={20} className={color.replace('bg-', 'text-')} />
      </div>
      {trendLabel && (
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${trend! > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
          <TrendingUp size={12} className={trend! < 0 ? 'rotate-180' : ''} />
          {trendLabel}
        </div>
      )}
    </div>
    <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">{title}</div>
    <div className="text-3xl font-black text-slate-900 leading-tight">{value}</div>
  </div>
);

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalClients: 0,
    lowStock: 0,
    monthlyRevenue: 0,
    deliveredThisMonth: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [chartData, setChartData] = useState<{ name: string; count: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Run financial automation check
        const automationResult = await processRecurringTransactions();
        if (automationResult.processed && automationResult.processed > 0) {
          toast.success(`Processed ${automationResult.processed} scheduled transactions`, {
            icon: '🤖',
            style: { borderRadius: '16px', background: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
          });
        }

        const ordersSnap = await getDocs(collection(db, 'orders'));
        const clientsSnap = await getDocs(collection(db, 'clients'));
        const inventorySnap = await getDocs(collection(db, 'inventory'));
        
        const orders = ordersSnap.docs.map(d => d.data());
        const active = orders.filter(d => d.status !== 'delivered').length;
        const lowItems = inventorySnap.docs
          .map(d => ({ id: d.id, ...d.data() } as InventoryItem))
          .filter(d => d.quantity <= d.minLevel);
        
        let revenue = 0;
        let delivered = 0;
        orders.forEach(o => {
          revenue += o.paidAmount || 0;
          if (o.status === 'delivered') delivered++;
        });

        setStats({
          activeOrders: active,
          totalClients: clientsSnap.size,
          lowStock: lowItems.length,
          monthlyRevenue: revenue,
          deliveredThisMonth: delivered
        });

        // Chart Data for Workflow
        const counts = {
          pending: orders.filter(o => o.status === 'pending').length,
          cutting: orders.filter(o => o.status === 'cutting').length,
          stitching: orders.filter(o => o.status === 'stitching').length,
          finished: orders.filter(o => o.status === 'finished').length,
        };

        setChartData([
          { name: 'Pending', count: counts.pending, color: '#f1f5f9' },
          { name: 'Cutting', count: counts.cutting, color: '#e0e7ff' },
          { name: 'Stitching', count: counts.stitching, color: '#c7d2fe' },
          { name: 'Finished', count: counts.finished, color: '#4f46e5' },
        ]);

        const recentQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
        const recentSnap = await getDocs(recentQuery);
        setRecentOrders(recentSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'dashboard_data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
       <div className="text-center space-y-4">
         <motion.div 
           animate={{ rotate: 360 }} 
           transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
           className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"
         />
         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aggregating Shop Intelligence...</p>
       </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{t('Intelligence Dashboard')}</h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium">
            {t('Intelligence Dashboard Subtitle', { count: stats.activeOrders })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           <div className="flex -space-x-2 hidden sm:flex">
              {[1,2,3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                +{stats.totalClients}
              </div>
           </div>
           <button onClick={() => setIsNewOrderOpen(true)} className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
             <Zap size={18} />
             {t('Live Order Entry')}
           </button>
        </div>
      </div>

      {/* Quick Actions Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <QuickAction icon={ShoppingBag} label={t('Catalog')} color="bg-indigo-600" onClick={() => navigate('/admin/inventory')} />
        <QuickAction icon={Users} label={t('Clients')} color="bg-slate-900" onClick={() => navigate('/admin/clients')} />
        <QuickAction icon={TrendingUp} label={t('Reports')} color="bg-blue-600" onClick={() => navigate('/admin/accounting')} />
        <QuickAction icon={AlertTriangle} label={t('Stock')} color="bg-amber-500" onClick={() => navigate('/admin/inventory')} />
        <QuickAction icon={Sparkles} label={t('Design Trends')} color="bg-purple-600" onClick={() => navigate('/admin/inventory')} />
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title={t('Revenue (MTD)')} value={`Rs. ${stats.monthlyRevenue.toLocaleString()}`} trend={15} trendLabel="+15% vs LY" icon={TrendingUp} color="bg-indigo-600" />
        <StatCard title={t('Active Load')} value={`${stats.activeOrders} Workflows`} trend={-5} trendLabel="Efficient flow" icon={ShoppingBag} color="bg-blue-600" />
        <StatCard title={t('Total Clients')} value={stats.totalClients} trendLabel="Growing base" icon={Users} color="bg-purple-600" />
        <StatCard title={t('Production')} value={stats.deliveredThisMonth} trendLabel="Completed orders" icon={CheckCircle2} color="bg-green-600" />
      </div>

      <div className="grid grid-cols-12 gap-6 sm:gap-8">
        {/* Workflow Distribution Chart */}
        <div className="col-span-12 lg:col-span-12 xl:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-8 flex flex-col min-h-[400px]">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900">{t('Workflow Distribution')}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Order Pipeline Stages</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-600"></span><span className="text-[10px] font-bold text-slate-500 uppercase">Current</span></div>
                 <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100"></span><span className="text-[10px] font-bold text-slate-500 uppercase">Completed</span></div>
              </div>
           </div>
           <div className="flex-1 min-h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontStyle: 'italic', fill: '#94a3b8', fontFamily: 'Georgia, serif' }} 
                    dy={10}
                  />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                 <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                 />
                 <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Dynamic Alerts Side Column */}
        <div className="col-span-12 lg:col-span-12 xl:col-span-4 space-y-6">
           <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
             <div className="relative z-10 space-y-6">
               <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Critical Alerts</h3>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               </div>
               
               <div className="space-y-4">
                 {stats.lowStock > 0 ? (
                   <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all cursor-pointer">
                     <div className="w-10 h-10 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                       <AlertTriangle size={20} />
                     </div>
                     <div className="min-w-0">
                       <p className="text-sm font-bold truncate">Inventory Crisis</p>
                       <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{stats.lowStock} fabric items below critical reserve levels.</p>
                     </div>
                   </div>
                 ) : (
                   <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                     <div className="w-10 h-10 bg-green-500/20 text-green-500 rounded-xl flex items-center justify-center shrink-0">
                       <CheckCircle2 size={20} />
                     </div>
                     <div className="min-w-0">
                       <p className="text-sm font-bold truncate">Supply Chain Healthy</p>
                       <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">All critical inventory items are above reorder thresholds.</p>
                     </div>
                   </div>
                 )}

                 <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all cursor-pointer">
                    <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                      <Clock size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">Upcoming Deliveries</p>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">8 orders reaching due date within 48 hours.</p>
                    </div>
                 </div>
               </div>
               
               <button className="w-full py-4 bg-indigo-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-2">
                 Resolve All Issues <ArrowUpRight size={16} />
               </button>
             </div>
             {/* Decorative Background Element */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
           </div>

           <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Recent Activity</h3>
                <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
              </div>
              <div className="space-y-6">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex gap-4 items-start relative group">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                       <ShoppingBag size={18} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors cursor-pointer">{order.clientName}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Order Stage: {order.status}</p>
                    </div>
                    <div className="text-right shrink-0">
                       <p className="text-xs font-black text-slate-900">Rs. {order.totalAmount.toLocaleString()}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {isNewOrderOpen && (
          <NewOrderForm 
            onClose={() => setIsNewOrderOpen(false)} 
            onSuccess={() => { setIsNewOrderOpen(false); window.location.reload(); }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}


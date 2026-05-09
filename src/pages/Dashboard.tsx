import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, InventoryItem, Transaction } from '../types';
import { 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  CheckCircle2, 
  ArrowUpRight,
  Sparkles,
  Zap,
  Download,
  Database,
  DollarSign
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import NewOrderForm from '../components/NewOrderForm';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { processRecurringTransactions } from '../lib/automation';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { exportToCSV } from '../lib/exportUtils';
import { seedDatabase } from '../lib/seeder';

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
    monthlyPayroll: 0,
    deliveredThisMonth: 0,
    receivables: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [chartData, setChartData] = useState<{ name: string; count: number; color: string }[]>([]);
  const [revenueData, setRevenueData] = useState<{ name: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        // Run financial automation check
        const automationResult = await processRecurringTransactions();
        if (automationResult.processed && automationResult.processed > 0) {
          toast.success(`Processed ${automationResult.processed} scheduled transactions`, {
            icon: '🤖',
            style: { borderRadius: '16px', background: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
          });
        }

        const [ordersSnap, clientsSnap, inventorySnap, txnSnap] = await Promise.all([
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'clients')),
          getDocs(collection(db, 'inventory')),
          getDocs(query(collection(db, 'transactions'), orderBy('date', 'desc')))
        ]);
        
        const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        const transactions = txnSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
        const active = orders.filter(d => d.status !== 'delivered' && d.status !== 'cancelled').length;
        const lowItems = inventorySnap.docs
          .map(d => ({ id: d.id, ...d.data() } as InventoryItem))
          .filter(d => d.quantity <= d.minLevel);
        
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7);
        
        let revenue = 0;
        let payroll = 0;
        let totalReceivables = 0;
        const monthlyRev: Record<string, number> = {};

        transactions.forEach(txn => {
           if (!txn.date) return;
           
           const txnDateStr = String(txn.date);
           const txnMonth = txnDateStr.slice(0, 7);
           
           if (txnMonth === currentMonth) {
              if (txn.type === 'sale') revenue += txn.amount;
              if (txn.type === 'payroll') payroll += txn.amount;
           }
           
           try {
             const dateObj = new Date(txnDateStr);
             if (!isNaN(dateObj.getTime())) {
               const monthName = dateObj.toLocaleString('en-US', { month: 'short' });
               if (txn.type === 'sale') {
                  monthlyRev[monthName] = (monthlyRev[monthName] || 0) + txn.amount;
               }
             }
           } catch {
             console.warn('Invalid transaction date:', txn.date);
           }
        });

        orders.forEach(o => {
          if (o.status !== 'delivered' && o.status !== 'cancelled') {
             totalReceivables += (o.totalAmount - (o.paidAmount || 0));
          }
        });

        const revEntries = Object.entries(monthlyRev).map(([name, r]) => ({ name, revenue: r }));
        const sortedRevEntries = revEntries.slice(-6).sort((a, b) => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return months.indexOf(a.name) - months.indexOf(b.name);
        });
        setRevenueData(sortedRevEntries);

        setStats({
          activeOrders: active,
          totalClients: clientsSnap.size,
          lowStock: lowItems.length,
          monthlyRevenue: revenue,
          monthlyPayroll: payroll,
          deliveredThisMonth: orders.filter(o => o.status === 'delivered').length,
          receivables: totalReceivables
        });

        // Advanced Analytics: Workflow Distribution (Item-based)
        const itemStages: Record<string, number> = {};

        orders.forEach(o => {
          (o.items || []).forEach(item => {
            const s = item.status || 'pending';
            itemStages[s] = (itemStages[s] || 0) + 1;
          });
        });

        const statusColors: Record<string, string> = {
          'measurement': '#f1f5f9',
          'fabric-reservation': '#f1f5f9',
          'pattern-making': '#e2e8f0',
          'cutting': '#cbd5e1',
          'stitching': '#94a3b8',
          'trial': '#64748b',
          'ready': '#4f46e5',
          'delivered': '#10b981'
        };

        const chartEntries = Object.entries(itemStages).map(([name, count]) => ({
          name: name.replace('-', ' '),
          count,
          color: statusColors[name] || '#94a3b8'
        })).sort((a, b) => b.count - a.count).slice(0, 5);
        
        setChartData(chartEntries);

        const recentQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(10));
        const recentSnap = await getDocs(recentQuery);
        setRecentOrders(recentSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      } catch {
        console.error('Dashboard fetch error');
        setError('Failed to sync shop intelligence. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="h-full min-h-[400px] flex items-center justify-center">
       <div className="text-center space-y-4">
         <motion.div 
           animate={{ rotate: 360 }} 
           transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
           className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"
         />
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregating Shop Intelligence...</p>
       </div>
    </div>
  );

  if (error) return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="bg-red-50 border border-red-100 rounded-[2rem] p-12 text-center max-w-md space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 uppercase">System Sync Failure</h2>
        <p className="text-sm text-slate-500 font-medium leading-relaxed">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-lg"
        >
          Try Manual Sync
        </button>
      </div>
    </div>
  );

  return (
    <div id="dashboard-container" className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div id="dashboard-header" className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight italic uppercase">{t('Intelligence Dashboard')}</h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium">
            {t('Intelligence Dashboard Subtitle', { count: stats.activeOrders })}
          </p>
        </div>
        <div id="dashboard-header-actions" className="flex flex-wrap items-center gap-4">
           <button 
             id="btn-seed-data"
             onClick={async () => {
               if(confirm('This will populate the database with sample data. Continue?')) {
                 const tid = toast.loading('Seeding intelligence matrix...');
                 try {
                   await seedDatabase();
                   toast.success('Database seeded successfully!', { id: tid });
                   window.location.reload();
                 } catch {
                   toast.error('Seeding failed. Check console.', { id: tid });
                 }
               }
             }}
             className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-100 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
           >
              <Database size={18} />
              Seed Data
           </button>
           <button 
             id="btn-export-summary"
             onClick={() => {
               const data = [
                 { Metric: 'Active Orders', Value: stats.activeOrders },
                 { Metric: 'Total Clients', Value: stats.totalClients },
                 { Metric: 'Monthly Revenue', Value: stats.monthlyRevenue },
                 { Metric: 'Monthly Payroll', Value: stats.monthlyPayroll },
                 { Metric: 'Outstanding Receivables', Value: stats.receivables }
               ];
               exportToCSV(data, `operations_summary_${new Date().toISOString().split('T')[0]}`);
             }}
             className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
           >
              <Download size={18} />
              Export Summary
           </button>
           <button id="btn-live-order" onClick={() => setIsNewOrderOpen(true)} className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
             <Zap size={18} />
             {t('Live Order Entry')}
           </button>
        </div>
      </div>

      {/* Quick Actions Scroll */}
      <div id="quick-actions-bar" className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <QuickAction icon={ShoppingBag} label={t('Catalog')} color="bg-indigo-600" onClick={() => navigate('/admin/inventory')} />
        <QuickAction icon={Users} label={t('Clients')} color="bg-slate-900" onClick={() => navigate('/admin/clients')} />
        <QuickAction icon={TrendingUp} label={t('Reports')} color="bg-blue-600" onClick={() => navigate('/admin/accounting')} />
        <QuickAction icon={AlertTriangle} label={t('Stock')} color="bg-amber-500" onClick={() => navigate('/admin/inventory')} />
        <QuickAction icon={Sparkles} label={t('Design Trends')} color="bg-purple-600" onClick={() => navigate('/admin/inventory')} />
      </div>

      {/* Grid of Stats */}
      <div id="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title={t('Cash Inflow (MTD)')} value={`Rs. ${stats.monthlyRevenue.toLocaleString()}`} trend={15} trendLabel="+15% vs LY" icon={TrendingUp} color="bg-green-600" />
        <StatCard title={t('Payroll Load')} value={`Rs. ${stats.monthlyPayroll.toLocaleString()}`} trend={5} trendLabel="Salaries + Bonuses" icon={Users} color="bg-indigo-600" />
        <StatCard title={t('Accounts Receivable')} value={`Rs. ${stats.receivables.toLocaleString()}`} trendLabel="Outstanding Balances" icon={DollarSign} color="bg-amber-600" />
        <StatCard title={t('Workload')} value={`${stats.activeOrders} Orders`} trendLabel="Active Pipeline" icon={ShoppingBag} color="bg-blue-600" />
      </div>

      <div id="charts-and-alerts-grid" className="grid grid-cols-12 gap-6 sm:gap-8">
        {/* Workflow Distribution Chart */}
        <div id="workflow-chart-container" className="col-span-12 lg:col-span-12 xl:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-8 flex flex-col min-h-[400px]">
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

        {/* Revenue Trend Chart */}
        <div className="col-span-12 lg:col-span-12 xl:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-8 flex flex-col min-h-[400px]">
          <div className="mb-8">
            <h2 className="text-xl font-black text-slate-900 truncate">Revenue Inflow</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cash Performance</p>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontStyle: 'italic', fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
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
               
            <button 
              id="btn-resolve-issues"
              onClick={() => {
                if (stats.lowStock > 0) {
                  navigate('/admin/inventory');
                  toast('Redirecting to inventory to resolve stock issues.', { icon: '📦' });
                } else {
                  toast.success('No critical operational issues detected.');
                }
              }}
              className="w-full py-4 bg-indigo-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-2"
            >
              Resolve All Issues <ArrowUpRight size={16} />
            </button>
             </div>
             {/* Decorative Background Element */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
           </div>

           <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Recent Activity</h3>
                <button 
                  onClick={() => navigate('/admin/orders')}
                  className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline"
                >
                  View All
                </button>
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


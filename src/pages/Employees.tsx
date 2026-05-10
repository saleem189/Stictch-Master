import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, addDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Employee, Task, Account, UserProfile, PayrollRecord } from '../types';
import { UserCircle, Phone, Calendar, DollarSign, Plus, Scissors, CheckCircle2, Clock, AlertCircle, Zap, MapPin, Edit2, Shield, Lock, Unlock, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import EmployeeModal from '../components/EmployeeModal';
import PayrollModal from '../components/PayrollModal';

export default function Employees() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'roster' | 'tasks' | 'access' | 'history'>('roster');
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [processingPayroll, setProcessingPayroll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [eSnap, tSnap, aSnap, uSnap, pSnap] = await Promise.all([
        getDocs(collection(db, 'employees')),
        getDocs(collection(db, 'tasks')),
        getDocs(collection(db, 'accounts')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'payrollRecords'))
      ]);

      setEmployees(eSnap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
      setTasks(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      setAccounts(aSnap.docs.map(d => ({ id: d.id, ...d.data() } as Account)));
      setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
      setPayrollHistory(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as PayrollRecord)));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'employees');
    } finally {
      setLoading(false);
    }
  }

  const handleBulkPayroll = async () => {
    if (processingPayroll) return;
    if (!confirm(`Are you sure you want to process monthly payroll for ${employees.length} employees?`)) return;
    
    setProcessingPayroll(true);
    const tid = toast.loading('Calculating and distributing remuneration...');
    try {
      const expenseAcc = accounts.find(a => a.type === 'expense');
      const assetAcc = accounts.find(a => a.type === 'asset' && a.name.toLowerCase().includes('cash'));
      
      if (!expenseAcc || !assetAcc) {
        toast.error('Financial accounts (Cash/Expense) not fully configured for payroll.');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const monthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

      for (const emp of employees) {
        // Create Transaction
        await addDoc(collection(db, 'transactions'), {
          date: today,
          description: `Salary: ${emp.name} (${monthYear})`,
          amount: emp.salary,
          debitAccountId: expenseAcc.id,
          creditAccountId: assetAcc.id,
          type: 'payroll',
          reference: emp.id
        });

        // Update Account Balances
        await updateDoc(doc(db, 'accounts', expenseAcc.id), { balance: increment(emp.salary) });
        await updateDoc(doc(db, 'accounts', assetAcc.id), { balance: increment(-emp.salary) });
        
        // Create Payroll Record
        await addDoc(collection(db, 'payrollRecords'), {
          employeeId: emp.id,
          employeeName: emp.name,
          month: monthYear,
          baseSalary: emp.salary,
          bonuses: [],
          deductions: [],
          netSalary: emp.salary,
          status: 'paid',
          payoutDate: today,
          createdAt: new Date().toISOString()
        });
      }

      toast.success(`Payroll processed for ${employees.length} employees totaling Rs. ${employees.reduce((acc, e) => acc + e.salary, 0).toLocaleString()}`, { id: tid });
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'payroll');
      toast.error('Financial sync failed during payroll.', { id: tid });
    } finally {
      setProcessingPayroll(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      await updateDoc(doc(db, 'tasks', taskId), { 
        status,
        ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {}),
        ...(status === 'in-progress' ? { startedAt: new Date().toISOString() } : {})
      });

      // Update parent order taskStatus
      await updateDoc(doc(db, 'orders', task.orderId), {
        [`taskStatus.${task.type}`]: status
      });

      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'tasks');
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 pb-32 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight italic uppercase">{t('Employees')}</h1>
          <p className="text-sm text-slate-500 font-medium">Manage workloads and employee performance.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative">
             <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text"
               placeholder="Search personnel..."
               className="bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-2 text-[10px] uppercase font-black tracking-widest focus:ring-2 focus:ring-indigo-600 outline-none w-full sm:w-64"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
          <button 
            onClick={() => setIsPayrollModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-sm"
          >
            <Clock size={14} />
            {t('Manual Payroll')}
          </button>
          <button 
            onClick={handleBulkPayroll}
            disabled={processingPayroll}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 disabled:opacity-50"
          >
            <Zap size={14} />
            {processingPayroll ? 'Processing...' : 'Bulk Payroll Payout'}
          </button>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
           <button 
             onClick={() => setActiveTab('roster')}
             className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'roster' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Staff Roster
           </button>
           <button 
             onClick={() => setActiveTab('tasks')}
             className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tasks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Task board
           </button>
           <button 
             onClick={() => setActiveTab('access')}
             className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'access' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Access Control
           </button>
           <button 
             onClick={() => setActiveTab('history')}
             className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Payroll History
           </button>
        </div>
      </div>
    </header>

      {loading ? (
        <div className="flex-1 min-h-[400px] flex items-center justify-center text-slate-400 font-black uppercase tracking-widest text-[10px]">
          Synchronizing Staff Records...
        </div>
      ) : activeTab === 'roster' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map(employee => (
            <div key={employee.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group overflow-hidden relative">
              <div className="absolute top-4 right-4 lg:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  onClick={() => { setSelectedEmployee(employee); setIsModalOpen(true); }}
                  className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                >
                  <Edit2 size={14} />
                </button>
              </div>
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all group-hover:scale-110">
                    <UserCircle size={36} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 leading-tight">{employee.name}</h3>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">{employee.role}</p>
                    {employee.email && <p className="text-[9px] font-bold text-slate-400 mt-1">{employee.email}</p>}
                  </div>
                </div>
                <div className="text-right">
                   <div className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Queue</div>
                   <div className="font-black text-slate-900 text-lg leading-none">{tasks.filter(t => t.employeeId === employee.id && t.status !== 'completed').length}</div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-50 relative z-10">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                  <Phone size={14} className="text-slate-300 shrink-0" />
                  {employee.phone}
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                  <MapPin size={14} className="text-slate-300 shrink-0" />
                  {employee.address || 'No address provided'}
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                  <Calendar size={14} className="text-slate-300 shrink-0" />
                  Seniority: {employee.joinedAt}
                </div>
                <div className="flex items-center justify-between mt-6 bg-slate-50/80 px-4 py-3 rounded-2xl border border-slate-100/50">
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <DollarSign size={14} /> Compensation
                   </div>
                   <span className="font-mono font-black text-slate-900">Rs. {employee.salary.toLocaleString()}</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 -mr-8 -mt-8 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
          <button 
            onClick={() => { setSelectedEmployee(undefined); setIsModalOpen(true); }}
            className="h-full min-h-[250px] rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all p-8 group"
          >
            <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors">
              <Plus size={32} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Enlist New Staff</span>
          </button>
        </div>
      ) : activeTab === 'tasks' ? (
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
           {/* Pipeline UI stays same */}
           <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operation Pipeline</span>
              <div className="flex flex-wrap items-center justify-center gap-4">
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-slate-300" /> Pending
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200" /> In Progress
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200" /> Completed
                 </div>
              </div>
           </div>
           <div className="overflow-x-auto flex-1 scrollbar-hide">
             <table className="w-full text-left min-w-[800px]">
               <thead>
                 <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-black bg-slate-50/30 border-b border-slate-100">
                   <th className="px-6 py-5">Task Activity</th>
                   <th className="px-6 py-5">Personnel</th>
                   <th className="px-6 py-5">Order Ref</th>
                   <th className="px-6 py-5">Lifecycle Status</th>
                   <th className="px-6 py-5"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {tasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${
                               task.type === 'cutting' ? 'bg-orange-50 text-orange-600' :
                               task.type === 'stitching' ? 'bg-indigo-50 text-indigo-600' :
                               'bg-green-50 text-green-600'
                             }`}>
                               <Scissors size={14} />
                             </div>
                             <span className="font-black text-slate-900 capitalize tracking-tight">{task.type}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4 font-black text-slate-700 text-xs">{task.employeeName}</td>
                       <td className="px-6 py-4 text-slate-400 font-mono text-[10px] font-bold tracking-widest">#{task.orderId.slice(0, 8)}</td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             {task.status === 'completed' && <CheckCircle2 size={16} className="text-green-500" />}
                             {task.status === 'in-progress' && <Clock size={16} className="text-indigo-500 animate-pulse" />}
                             {task.status === 'pending' && <AlertCircle size={16} className="text-slate-300" />}
                             <span className={`text-[9px] uppercase font-black tracking-widest ${
                               task.status === 'completed' ? 'text-green-600' :
                               task.status === 'in-progress' ? 'text-indigo-600' :
                               'text-slate-400'
                             }`}>{task.status}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                             {task.status === 'pending' && (
                               <button onClick={() => updateTaskStatus(task.id, 'in-progress')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">Initiate</button>
                             )}
                             {task.status === 'in-progress' && (
                               <button onClick={() => updateTaskStatus(task.id, 'completed')} className="px-4 py-2 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-100 transition-all active:scale-95">Complete</button>
                             )}
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
             </table>
           </div>
        </div>
      ) : activeTab === 'access' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
           {users.map(user => (
             <div key={user.id} className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                {/* User Access UI */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">{user.name || user.email}</h3>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">{user.role}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {[
                    { id: 'canManageInventory', label: 'Inventory Access', icon: Lock },
                    { id: 'canManageClients', label: 'Client Database', icon: Lock },
                    { id: 'canManageAccounting', label: 'Financial Records', icon: Lock },
                    { id: 'canManageOrders', label: 'Order Management', icon: Lock },
                    { id: 'canApprovePayroll', label: 'Approve Payroll', icon: Lock },
                    { id: 'canProcessPayments', label: 'Process Payments', icon: Lock }
                  ].map((perm) => (
                    <div key={perm.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                       <div className="flex items-center gap-3">
                          <perm.icon size={14} className="text-slate-400" />
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{perm.label}</span>
                       </div>
                       <button 
                         onClick={async () => {
                           const updatedPerms = { ...(user.permissions || {}), [perm.id]: !user.permissions?.[perm.id as keyof typeof user.permissions] };
                           await updateDoc(doc(db, 'users', user.id), { permissions: updatedPerms });
                           fetchData();
                         }}
                         className={`p-2 rounded-xl transition-all ${user.permissions?.[perm.id as keyof typeof user.permissions] ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}
                       >
                          {user.permissions?.[perm.id as keyof typeof user.permissions] ? <Unlock size={14} /> : <Lock size={14} />}
                       </button>
                    </div>
                  ))}
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
           <table className="w-full text-left min-w-[800px]">
              <thead>
                 <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-black bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-5">Personnel</th>
                    <th className="px-6 py-5">Period</th>
                    <th className="px-6 py-5">Net Remuneration</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Payout Date</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {payrollHistory.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(record => (
                   <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                         <p className="text-xs font-black text-slate-900">{record.employeeName}</p>
                         <p className="text-[9px] text-slate-400 font-mono">#{record.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-widest">{record.month}</td>
                      <td className="px-6 py-4 text-xs font-black font-mono text-slate-900">Rs. {record.netSalary.toLocaleString()}</td>
                      <td className="px-6 py-4">
                         <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100">
                            {record.status}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">{record.payoutDate}</td>
                   </tr>
                 ))}
                 {payrollHistory.length === 0 && (
                   <tr>
                      <td colSpan={5} className="px-6 py-24 text-center">
                         <div className="flex flex-col items-center gap-3 text-slate-300">
                            <DollarSign size={48} strokeWidth={1} className="opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Historical Ledger Empty</p>
                         </div>
                      </td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      )}
      <EmployeeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        employee={selectedEmployee}
      />
      <PayrollModal 
        isOpen={isPayrollModalOpen}
        onClose={() => setIsPayrollModalOpen(false)}
        onSuccess={fetchData}
        employees={employees}
      />
    </div>
  );
}

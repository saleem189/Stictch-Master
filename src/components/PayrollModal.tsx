import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Employee, PayrollRecord, Account } from '../types';
import { X, Zap, ShieldCheck, AlertCircle, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useUser } from '../contexts/UserContext';
import { toast } from 'react-hot-toast';
import { ACCOUNT_IDS, appendLedgerEntryToBatch, getRequiredAccountByIdOrName } from '../lib/ledger';
import { getPayrollRecordId, isPayrollAlreadyPaid } from '../lib/payroll';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: Employee[];
}

export default function PayrollModal({ isOpen, onClose, onSuccess, employees }: Props) {
  const { profile } = useUser();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [records, setRecords] = useState<Partial<PayrollRecord>[]>([]);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (isOpen) {
      setRecords(employees.map(emp => ({
        employeeId: emp.id,
        employeeName: emp.name,
        month: selectedMonth,
        baseSalary: emp.salary,
        bonuses: [],
        deductions: [],
        netSalary: emp.salary,
        status: 'draft',
        createdAt: new Date().toISOString()
      })));
      fetchAccounts();
    }
  }, [isOpen, selectedMonth, employees]);

  async function fetchAccounts() {
    const accSnap = await getDocs(collection(db, 'accounts'));
    setAccounts(accSnap.docs.map(d => ({ id: d.id, ...d.data() } as Account)));
  }

  const updateRecord = (index: number, updates: Partial<PayrollRecord>) => {
    const newRecords = [...records];
    const updated = { ...newRecords[index], ...updates };
    
    // Recalculate net salary
    const bonusesTotal = (updated.bonuses || []).reduce((sum, b) => sum + b.amount, 0);
    const deductionsTotal = (updated.deductions || []).reduce((sum, d) => sum + d.amount, 0);
    updated.netSalary = (updated.baseSalary || 0) + bonusesTotal - deductionsTotal;
    
    newRecords[index] = updated;
    setRecords(newRecords);
  };

  const handleCommit = async () => {
    if (!profile?.permissions?.canApprovePayroll) {
       toast.error("You do not have permission to process payroll.");
       return;
    }

    setLoading(true);
    try {
      const expenseAcc = accounts.find(a => a.type === 'expense');
      const assetAcc = getRequiredAccountByIdOrName(accounts, [ACCOUNT_IDS.cash, ACCOUNT_IDS.bank], ['cash', 'bank'], 'Cash or Bank');

      if (!expenseAcc || !assetAcc) {
        toast.error('Ledger accounts not configured.');
        return;
      }

      const batch = writeBatch(db);
      let processedCount = 0;
      let skippedCount = 0;

      for (const record of records) {
        if (!record.employeeId || !record.month) continue;

        const payrollRef = doc(db, 'payrollRecords', getPayrollRecordId(record.employeeId, record.month));
        const existingPayroll = await getDoc(payrollRef);
        if (isPayrollAlreadyPaid(existingPayroll.exists() ? existingPayroll.data() as PayrollRecord : null)) {
          skippedCount += 1;
          continue;
        }

        const txnRef = appendLedgerEntryToBatch(db, batch, accounts, {
          date: new Date().toISOString().split('T')[0],
          description: `Payroll Payout: ${record.employeeName} (${record.month})`,
          amount: record.netSalary || 0,
          debitAccountId: expenseAcc.id,
          creditAccountId: assetAcc.id,
          reference: payrollRef.id,
          type: 'payroll'
        });

        batch.set(payrollRef, {
          ...record,
          status: 'paid',
          payoutDate: new Date().toISOString().split('T')[0],
          approvedBy: profile.uid,
          approvedAt: new Date().toISOString(),
          transactionId: txnRef.id
        });

        batch.set(doc(collection(db, 'auditLogs')), {
          actorId: profile.uid,
          actorName: profile.name || profile.email,
          action: 'PAYROLL_PROCESSED',
          entityType: 'payroll',
          entityId: payrollRef.id,
          afterState: record,
          timestamp: new Date().toISOString()
        });
        processedCount += 1;
      }

      if (processedCount === 0) {
        toast.success('Payroll is already processed for the selected month.');
        return;
      }

      await batch.commit();
      toast.success(`Payroll processed for ${processedCount} employees${skippedCount ? `; skipped ${skippedCount} already paid.` : ''}.`);
      onSuccess();
      onClose();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'payroll');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
      >
        <header className="px-10 py-8 bg-slate-950 text-white flex items-center justify-between">
           <div>
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-indigo-600 rounded-2xl">
                    <Zap size={24} />
                 </div>
                 <h2 className="text-2xl font-black italic uppercase tracking-tight">Intelligence Payroll</h2>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Precision disbursement for {employees.length} personnel</p>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Month</label>
                 <input 
                   type="month" 
                   value={selectedMonth}
                   onChange={e => setSelectedMonth(e.target.value)}
                   className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm font-black text-indigo-400 focus:border-indigo-500 outline-none"
                 />
              </div>
              <button onClick={onClose} className="p-3 hover:bg-slate-900 rounded-2xl transition-colors">
                 <X size={24} />
              </button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-6">
           <div className="grid grid-cols-1 gap-4">
              {records.map((record, index) => (
                <div key={record.employeeId} className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all group">
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                      <div className="lg:col-span-3">
                         <h3 className="font-black text-slate-900 text-lg">{record.employeeName}</h3>
                         <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Base: Rs. {record.baseSalary?.toLocaleString()}</p>
                      </div>

                      <div className="lg:col-span-3 space-y-2">
                         <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bonuses</label>
                            <button 
                              onClick={() => {
                                const b = [...(record.bonuses || []), { reason: 'Performance', amount: 0 }];
                                updateRecord(index, { bonuses: b });
                              }}
                              className="text-green-600 hover:scale-110 transition-transform"
                            >
                               <Plus size={14} />
                            </button>
                         </div>
                         {record.bonuses?.map((b, bi) => (
                           <div key={bi} className="flex gap-2">
                              <input 
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold" 
                                placeholder="Reason"
                                value={b.reason}
                                onChange={e => {
                                  const nb = [...record.bonuses!];
                                  nb[bi].reason = e.target.value;
                                  updateRecord(index, { bonuses: nb });
                                }}
                              />
                              <input 
                                type="number"
                                className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-black text-green-600" 
                                value={b.amount || ''}
                                onChange={e => {
                                  const nb = [...record.bonuses!];
                                  nb[bi].amount = parseFloat(e.target.value) || 0;
                                  updateRecord(index, { bonuses: nb });
                                }}
                              />
                           </div>
                         ))}
                      </div>

                      <div className="lg:col-span-3 space-y-2">
                         <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deductions</label>
                            <button 
                              onClick={() => {
                                const d = [...(record.deductions || []), { reason: 'Tax', amount: 0 }];
                                updateRecord(index, { deductions: d });
                              }}
                              className="text-red-500 hover:scale-110 transition-transform"
                            >
                               <Plus size={14} />
                            </button>
                         </div>
                         {record.deductions?.map((d, di) => (
                           <div key={di} className="flex gap-2">
                              <input 
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold" 
                                placeholder="Reason"
                                value={d.reason}
                                onChange={e => {
                                  const nd = [...record.deductions!];
                                  nd[di].reason = e.target.value;
                                  updateRecord(index, { deductions: nd });
                                }}
                              />
                              <input 
                                type="number"
                                className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-black text-red-500" 
                                value={d.amount || ''}
                                onChange={e => {
                                  const nd = [...record.deductions!];
                                  nd[di].amount = parseFloat(e.target.value) || 0;
                                  updateRecord(index, { deductions: nd });
                                }}
                              />
                           </div>
                         ))}
                      </div>

                      <div className="lg:col-span-3 flex flex-col items-end">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Payout</span>
                         <span className="text-xl font-black text-slate-950 font-mono">Rs. {record.netSalary?.toLocaleString()}</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <footer className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Liability</span>
                 <span className="text-2xl font-black text-slate-900 font-mono">Rs. {records.reduce((sum, r) => sum + (r.netSalary || 0), 0).toLocaleString()}</span>
              </div>
              {!profile?.permissions?.canApprovePayroll && (
                <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-xl">
                   <AlertCircle size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Approval Permission Required</span>
                </div>
              )}
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all font-mono"
              >
                 Abort Session
              </button>
              <button 
                disabled={loading || !profile?.permissions?.canApprovePayroll}
                onClick={handleCommit}
                className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all disabled:opacity-50 flex items-center gap-3 active:scale-[0.98]"
              >
                 <ShieldCheck size={16} />
                 {loading ? 'Processing Journal...' : 'Approve & Execute Ledger'}
              </button>
           </div>
        </footer>
      </motion.div>
    </div>
  );
}

import { describe, expect, it } from 'vitest';
import { PayrollRecord } from '../types';
import {
  getPayrollRecordId,
  getUnpaidPayrollDrafts,
  isPayrollAlreadyPaid,
} from './payroll';

describe('payroll helpers', () => {
  it('builds deterministic payroll record ids from employee and month', () => {
    expect(getPayrollRecordId('seed emp/master', '2026-05')).toBe('payroll_seed_emp_master_2026-05');
  });

  it('treats only paid payroll records as already paid', () => {
    expect(isPayrollAlreadyPaid({ status: 'paid' })).toBe(true);
    expect(isPayrollAlreadyPaid({ status: 'draft' })).toBe(false);
    expect(isPayrollAlreadyPaid(null)).toBe(false);
  });

  it('filters out drafts that already have a paid deterministic record', () => {
    const drafts = [
      { employeeId: 'emp-1', month: '2026-05', netSalary: 50000 },
      { employeeId: 'emp-2', month: '2026-05', netSalary: 65000 },
    ];
    const existingById: Record<string, Pick<PayrollRecord, 'status'>> = {
      [getPayrollRecordId('emp-1', '2026-05')]: { status: 'paid' },
      [getPayrollRecordId('emp-2', '2026-05')]: { status: 'draft' },
    };

    expect(getUnpaidPayrollDrafts(drafts, existingById)).toEqual([
      { employeeId: 'emp-2', month: '2026-05', netSalary: 65000 },
    ]);
  });
});

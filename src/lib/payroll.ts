import { PayrollRecord } from '../types';

export interface PayrollDraft {
  employeeId?: string;
  month?: string;
}

export function getPayrollRecordId(employeeId: string, month: string): string {
  return `payroll_${sanitizeIdPart(employeeId)}_${sanitizeIdPart(month)}`;
}

export function isPayrollAlreadyPaid(record?: Pick<PayrollRecord, 'status'> | null): boolean {
  return record?.status === 'paid';
}

export function getUnpaidPayrollDrafts<T extends PayrollDraft>(
  drafts: T[],
  existingById: Record<string, Pick<PayrollRecord, 'status'> | undefined>
): T[] {
  return drafts.filter(draft => {
    if (!draft.employeeId || !draft.month) return false;
    const existing = existingById[getPayrollRecordId(draft.employeeId, draft.month)];
    return !isPayrollAlreadyPaid(existing);
  });
}

function sanitizeIdPart(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown';
}

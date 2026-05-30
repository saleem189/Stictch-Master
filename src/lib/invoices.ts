import { FinancialDocument } from '../types';

export type InvoiceLineItem = NonNullable<FinancialDocument['items']>[number];

const INVOICE_PREFIX: Record<FinancialDocument['type'], string> = {
  quotation: 'QTN',
  'advance-invoice': 'ADV',
  receipt: 'RCT',
  'final-invoice': 'FIN',
  refund: 'RFD',
  expense: 'EXP',
  payroll: 'PAY',
};

export function calculateInvoiceTotal(items: InvoiceLineItem[]): number {
  return items.reduce((sum, item) => sum + normalizeMoney(item.quantity) * normalizeMoney(item.rate), 0);
}

export function getDefaultDocumentStatus(type: FinancialDocument['type']): FinancialDocument['status'] {
  return type === 'receipt' ? 'paid' : 'issued';
}

export function getInvoiceNumber(type: FinancialDocument['type'], date: string, id: string): string {
  const compactDate = date.replace(/\D/g, '').slice(0, 8) || new Date().toISOString().slice(0, 10).replace(/\D/g, '');
  return `${INVOICE_PREFIX[type]}-${compactDate}-${id.slice(0, 6).toUpperCase()}`;
}

export function formatCurrency(amount: number): string {
  return `Rs. ${normalizeMoney(amount).toLocaleString()}`;
}

function normalizeMoney(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

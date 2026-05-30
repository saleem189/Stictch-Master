import { describe, expect, it } from 'vitest';
import { calculateInvoiceTotal, getDefaultDocumentStatus, getInvoiceNumber } from './invoices';

describe('invoices', () => {
  it('calculates the invoice total from line items', () => {
    expect(calculateInvoiceTotal([
      { description: 'Suit', quantity: 1, rate: 42000, amount: 0 },
      { description: 'Buttons', quantity: 12, rate: 45, amount: 0 },
    ])).toBe(42540);
  });

  it('uses paid status for receipts and issued status for invoices', () => {
    expect(getDefaultDocumentStatus('receipt')).toBe('paid');
    expect(getDefaultDocumentStatus('final-invoice')).toBe('issued');
    expect(getDefaultDocumentStatus('quotation')).toBe('issued');
  });

  it('creates readable invoice numbers from type, date, and id', () => {
    expect(getInvoiceNumber('final-invoice', '2026-05-17', 'abc123xyz')).toBe('FIN-20260517-ABC123');
  });
});

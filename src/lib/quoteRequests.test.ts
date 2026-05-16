import { describe, expect, it } from 'vitest';
import { getInitialQuoteRequestForm, validateQuoteRequestForm } from './quoteRequests';

describe('quote request helpers', () => {
  it('creates a safe initial form', () => {
    expect(getInitialQuoteRequestForm()).toEqual({
      garmentType: '',
      styleNotes: '',
      preferredDueDate: '',
      budgetRange: '',
      measurementSource: 'book-measurement',
      inspirationNotes: '',
    });
  });

  it('requires core bespoke quote fields', () => {
    const result = validateQuoteRequestForm(getInitialQuoteRequestForm());

    expect(result.valid).toBe(false);
    expect(result.errors.garmentType).toBe('Garment type is required');
    expect(result.errors.styleNotes).toBe('Style notes are required');
    expect(result.errors.preferredDueDate).toBe('Preferred due date is required');
    expect(result.errors.budgetRange).toBe('Budget range is required');
  });

  it('accepts a complete quote request form', () => {
    const result = validateQuoteRequestForm({
      garmentType: 'Sherwani',
      styleNotes: 'Ivory, formal wedding wear',
      preferredDueDate: '2026-06-20',
      budgetRange: '50000-100000',
      measurementSource: 'existing',
      inspirationNotes: '',
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });
});

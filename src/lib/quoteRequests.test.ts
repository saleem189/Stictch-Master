import { describe, expect, it } from 'vitest';
import {
  buildQuoteReviewUpdate,
  getInitialQuoteRequestForm,
  validateQuoteRequestForm,
  validateQuoteReview,
} from './quoteRequests';

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

  it('requires review notes when rejecting a quote request', () => {
    const result = validateQuoteReview({ status: 'rejected', reviewNotes: '  ' });

    expect(result.valid).toBe(false);
    expect(result.errors.reviewNotes).toBe('Review notes are required when rejecting a quote');
  });

  it('builds a reviewed quote request update payload', () => {
    expect(buildQuoteReviewUpdate({
      status: 'reviewed',
      reviewNotes: 'Schedule measurement before order creation',
      reviewedBy: 'user-123',
      reviewedAt: '2026-05-17T10:00:00.000Z',
    })).toEqual({
      status: 'reviewed',
      reviewNotes: 'Schedule measurement before order creation',
      reviewedBy: 'user-123',
      updatedAt: '2026-05-17T10:00:00.000Z',
    });
  });
});

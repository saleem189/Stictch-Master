import { MeasurementSource, QuoteRequestStatus } from '../types';

export interface QuoteRequestFormData {
  garmentType: string;
  styleNotes: string;
  preferredDueDate: string;
  budgetRange: string;
  measurementSource: MeasurementSource;
  inspirationNotes: string;
}

export type QuoteRequestFormErrors = Partial<Record<keyof QuoteRequestFormData, string>>;

export interface QuoteReviewFormData {
  status: Extract<QuoteRequestStatus, 'reviewed' | 'rejected'>;
  reviewNotes: string;
}

export type QuoteReviewFormErrors = Partial<Record<keyof QuoteReviewFormData, string>>;

export function getInitialQuoteRequestForm(): QuoteRequestFormData {
  return {
    garmentType: '',
    styleNotes: '',
    preferredDueDate: '',
    budgetRange: '',
    measurementSource: 'book-measurement',
    inspirationNotes: '',
  };
}

export function validateQuoteRequestForm(form: QuoteRequestFormData): { valid: boolean; errors: QuoteRequestFormErrors } {
  const errors: QuoteRequestFormErrors = {};

  if (!form.garmentType.trim()) errors.garmentType = 'Garment type is required';
  if (!form.styleNotes.trim()) errors.styleNotes = 'Style notes are required';
  if (!form.preferredDueDate) errors.preferredDueDate = 'Preferred due date is required';
  if (!form.budgetRange.trim()) errors.budgetRange = 'Budget range is required';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateQuoteReview(form: QuoteReviewFormData): { valid: boolean; errors: QuoteReviewFormErrors } {
  const errors: QuoteReviewFormErrors = {};

  if (form.status === 'rejected' && !form.reviewNotes.trim()) {
    errors.reviewNotes = 'Review notes are required when rejecting a quote';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildQuoteReviewUpdate({
  status,
  reviewNotes,
  reviewedBy,
  reviewedAt = new Date().toISOString(),
}: QuoteReviewFormData & { reviewedBy: string; reviewedAt?: string }) {
  return {
    status,
    reviewNotes: reviewNotes.trim(),
    reviewedBy,
    updatedAt: reviewedAt,
  };
}

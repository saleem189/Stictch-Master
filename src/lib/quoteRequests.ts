import { MeasurementSource } from '../types';

export interface QuoteRequestFormData {
  garmentType: string;
  styleNotes: string;
  preferredDueDate: string;
  budgetRange: string;
  measurementSource: MeasurementSource;
  inspirationNotes: string;
}

export type QuoteRequestFormErrors = Partial<Record<keyof QuoteRequestFormData, string>>;

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

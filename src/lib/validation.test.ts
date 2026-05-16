import { describe, expect, it } from 'vitest';
import { validateForm, validators } from './validation';

describe('validateForm', () => {
  it('returns valid when all schema validators pass', () => {
    const result = validateForm(
      { name: 'Saleem', phone: '+92 300 1234567', email: 'tailor@example.com' },
      {
        name: validators.required('Name is required'),
        phone: validators.phone('Phone is invalid'),
        email: validators.email('Email is invalid'),
      },
    );

    expect(result).toEqual({ isValid: true, errors: {} });
  });

  it('collects field-level validation errors', () => {
    const result = validateForm(
      { name: ' ', phone: '123', email: 'wrong-email' },
      {
        name: validators.required('Name is required'),
        phone: validators.phone('Phone is invalid'),
        email: validators.email('Email is invalid'),
      },
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual({
      name: 'Name is required',
      phone: 'Phone is invalid',
      email: 'Email is invalid',
    });
  });

  it('treats optional blank email and phone as valid', () => {
    expect(validators.email('Email is invalid')('')).toBeNull();
    expect(validators.phone('Phone is invalid')('')).toBeNull();
  });

  it('enforces numeric minimums', () => {
    expect(validators.min(1, 'Amount must be positive')(0)).toBe('Amount must be positive');
    expect(validators.min(1, 'Amount must be positive')(1)).toBeNull();
  });
});

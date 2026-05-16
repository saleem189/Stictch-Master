
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateForm(data: Record<string, unknown>, schema: Record<string, (val: unknown) => string | null>): ValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;
  
  Object.keys(schema).forEach(key => {
    const error = schema[key](data[key]);
    if (error) {
      errors[key] = error;
      isValid = false;
    }
  });
  
  return { isValid, errors };
}

// Common validators
export const validators = {
  required: (msg: string) => (val: unknown) => (!val || (typeof val === 'string' && val.trim() === '') ? msg : null),
  email: (msg: string) => (val: unknown) => (typeof val === 'string' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? msg : null),
  phone: (msg: string) => (val: unknown) => (typeof val === 'string' && val && !/^\+?[\d\s-]{8,20}$/.test(val) ? msg : null),
  min: (min: number, msg: string) => (val: unknown) => (typeof val === 'number' && val < min ? msg : null),
  minLength: (min: number, msg: string) => (val: unknown) => (typeof val === 'string' && val.length < min ? msg : null),
};

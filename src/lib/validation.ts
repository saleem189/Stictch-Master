
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateForm(data: any, schema: Record<string, (val: any) => string | null>): ValidationResult {
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
  required: (msg: string) => (val: any) => (!val || (typeof val === 'string' && val.trim() === '') ? msg : null),
  email: (msg: string) => (val: any) => (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? msg : null),
  phone: (msg: string) => (val: any) => (val && !/^\+?[\d\s-]{8,20}$/.test(val) ? msg : null),
  min: (min: number, msg: string) => (val: any) => (typeof val === 'number' && val < min ? msg : null),
  minLength: (min: number, msg: string) => (val: any) => (typeof val === 'string' && val.length < min ? msg : null),
};

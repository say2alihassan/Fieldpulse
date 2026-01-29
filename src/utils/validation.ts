import type { FieldDefinition, ValidationResult } from '../types';

export function validateField(
  field: FieldDefinition,
  value: unknown
): string | null {
  const { validation } = field;

  // Required check
  if (validation?.required) {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }

    if (Array.isArray(value) && value.length === 0) {
      // Different message for photos vs multi-select
      if (field.type === 'photo') {
        return 'Please capture at least one photo';
      }
      return 'Please select at least one option';
    }
  }

  // Skip further validation if empty and not required
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Type-specific validation
  switch (field.type) {
    case 'text':
    case 'textarea':
      return validateText(value as string, validation);

    case 'number':
      return validateNumber(value as number, validation);

    case 'select':
      return validateSelect(value as string, field.options);

    case 'multi-select':
      return validateMultiSelect(value as string[], field.options, validation);

    case 'date':
    case 'time':
      return validateDateTime(value as string);

    case 'photo':
      return validatePhoto(value);

    case 'signature':
      return validateSignature(value);

    default:
      return null;
  }
}

function validateText(
  value: string,
  validation?: FieldDefinition['validation']
): string | null {
  if (!validation) return null;

  if (validation.minLength !== undefined && value.length < validation.minLength) {
    return `Minimum ${validation.minLength} characters required`;
  }

  if (validation.maxLength !== undefined && value.length > validation.maxLength) {
    return `Maximum ${validation.maxLength} characters allowed`;
  }

  if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      return validation.patternMessage || 'Invalid format';
    }
  }

  return null;
}

function validateNumber(
  value: number,
  validation?: FieldDefinition['validation']
): string | null {
  if (!validation) return null;

  if (typeof value !== 'number' || isNaN(value)) {
    return 'Please enter a valid number';
  }

  if (validation.min !== undefined && value < validation.min) {
    return `Minimum value is ${validation.min}`;
  }

  if (validation.max !== undefined && value > validation.max) {
    return `Maximum value is ${validation.max}`;
  }

  return null;
}

function validateSelect(
  value: string,
  options?: string[]
): string | null {
  if (!options || options.length === 0) {
    return null;
  }

  if (!options.includes(value)) {
    return 'Please select a valid option';
  }

  return null;
}

function validateMultiSelect(
  value: string[],
  options?: string[],
  validation?: FieldDefinition['validation']
): string | null {
  if (!Array.isArray(value)) {
    return 'Invalid selection';
  }

  if (options) {
    for (const item of value) {
      if (!options.includes(item)) {
        return 'Invalid option selected';
      }
    }
  }

  if (validation?.min !== undefined && value.length < validation.min) {
    return `Please select at least ${validation.min} options`;
  }

  if (validation?.max !== undefined && value.length > validation.max) {
    return `Maximum ${validation.max} options allowed`;
  }

  return null;
}

function validateDateTime(value: string): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return 'Invalid date/time';
  }

  return null;
}

function validatePhoto(value: unknown): string | null {
  if (!value) return null;

  // Photos are now stored as an array
  if (Array.isArray(value)) {
    // Empty array is valid (handled by required check above)
    if (value.length === 0) return null;

    // Validate each photo in the array
    for (const photo of value) {
      if (typeof photo !== 'object' || !photo) {
        return 'Invalid photo';
      }
      const p = photo as { uri?: string };
      if (!p.uri) {
        return 'Photo is missing';
      }
    }
    return null;
  }

  // Legacy: single photo object with uri
  if (typeof value !== 'object' || !value) {
    return 'Invalid photo';
  }

  const photo = value as { uri?: string };
  if (!photo.uri) {
    return 'Photo is missing';
  }

  return null;
}

function validateSignature(value: unknown): string | null {
  if (!value) return null;

  // Value should be a signature object with uri
  if (typeof value !== 'object' || !value) {
    return 'Invalid signature';
  }

  const signature = value as { uri?: string };
  if (!signature.uri) {
    return 'Signature is missing';
  }

  return null;
}

export function validateForm(
  fields: FieldDefinition[],
  values: Record<string, unknown>
): ValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const field of fields) {
    const error = validateField(field, values[field.id]);
    if (error) {
      errors[field.id] = error;
      isValid = false;
    }
  }

  return { isValid, errors };
}

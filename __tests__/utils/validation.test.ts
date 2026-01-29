import { validateField, validateForm } from '../../src/utils/validation';
import type { FieldDefinition } from '../../src/types';

describe('validateField', () => {
  describe('required validation', () => {
    const requiredTextField: FieldDefinition = {
      id: 'name',
      type: 'text',
      label: 'Name',
      validation: { required: true },
    };

    it('returns error for empty required text field', () => {
      expect(validateField(requiredTextField, '')).toBe('This field is required');
      expect(validateField(requiredTextField, null)).toBe('This field is required');
      expect(validateField(requiredTextField, undefined)).toBe('This field is required');
    });

    it('returns null for non-empty required text field', () => {
      expect(validateField(requiredTextField, 'John')).toBeNull();
    });

    it('returns error for empty required multi-select', () => {
      const field: FieldDefinition = {
        id: 'options',
        type: 'multi-select',
        label: 'Options',
        options: ['A', 'B', 'C'],
        validation: { required: true },
      };
      expect(validateField(field, [])).toBe('Please select at least one option');
    });
  });

  describe('text validation', () => {
    it('validates minLength', () => {
      const field: FieldDefinition = {
        id: 'username',
        type: 'text',
        label: 'Username',
        validation: { minLength: 3 },
      };
      expect(validateField(field, 'ab')).toBe('Minimum 3 characters required');
      expect(validateField(field, 'abc')).toBeNull();
      expect(validateField(field, 'abcd')).toBeNull();
    });

    it('validates maxLength', () => {
      const field: FieldDefinition = {
        id: 'code',
        type: 'text',
        label: 'Code',
        validation: { maxLength: 5 },
      };
      expect(validateField(field, 'abcdef')).toBe('Maximum 5 characters allowed');
      expect(validateField(field, 'abcde')).toBeNull();
      expect(validateField(field, 'abc')).toBeNull();
    });

    it('validates pattern', () => {
      const field: FieldDefinition = {
        id: 'serial',
        type: 'text',
        label: 'Serial Number',
        validation: {
          pattern: '^[A-Z]{2}\\d{4}$',
          patternMessage: 'Format: XX0000',
        },
      };
      expect(validateField(field, 'invalid')).toBe('Format: XX0000');
      expect(validateField(field, 'AB1234')).toBeNull();
      expect(validateField(field, 'ab1234')).toBe('Format: XX0000');
    });

    it('uses default pattern message when not provided', () => {
      const field: FieldDefinition = {
        id: 'email',
        type: 'text',
        label: 'Email',
        validation: { pattern: '^\\S+@\\S+$' },
      };
      expect(validateField(field, 'invalid')).toBe('Invalid format');
    });
  });

  describe('number validation', () => {
    it('validates min value', () => {
      const field: FieldDefinition = {
        id: 'quantity',
        type: 'number',
        label: 'Quantity',
        validation: { min: 1 },
      };
      expect(validateField(field, 0)).toBe('Minimum value is 1');
      expect(validateField(field, 1)).toBeNull();
      expect(validateField(field, 100)).toBeNull();
    });

    it('validates max value', () => {
      const field: FieldDefinition = {
        id: 'rating',
        type: 'number',
        label: 'Rating',
        validation: { max: 5 },
      };
      expect(validateField(field, 6)).toBe('Maximum value is 5');
      expect(validateField(field, 5)).toBeNull();
      expect(validateField(field, 1)).toBeNull();
    });

    it('validates min and max together', () => {
      const field: FieldDefinition = {
        id: 'percentage',
        type: 'number',
        label: 'Percentage',
        validation: { min: 0, max: 100 },
      };
      expect(validateField(field, -1)).toBe('Minimum value is 0');
      expect(validateField(field, 101)).toBe('Maximum value is 100');
      expect(validateField(field, 50)).toBeNull();
    });

    it('returns error for invalid number', () => {
      const field: FieldDefinition = {
        id: 'amount',
        type: 'number',
        label: 'Amount',
      };
      expect(validateField(field, NaN)).toBe('Please enter a valid number');
    });
  });

  describe('select validation', () => {
    it('validates option is in list', () => {
      const field: FieldDefinition = {
        id: 'status',
        type: 'select',
        label: 'Status',
        options: ['pending', 'completed', 'cancelled'],
      };
      expect(validateField(field, 'invalid')).toBe('Please select a valid option');
      expect(validateField(field, 'pending')).toBeNull();
    });
  });

  describe('multi-select validation', () => {
    const field: FieldDefinition = {
      id: 'tags',
      type: 'multi-select',
      label: 'Tags',
      options: ['A', 'B', 'C', 'D'],
      validation: { min: 1, max: 3 },
    };

    it('validates minimum selections', () => {
      expect(validateField(field, [])).toBe('Please select at least 1 options');
    });

    it('validates maximum selections', () => {
      expect(validateField(field, ['A', 'B', 'C', 'D'])).toBe('Maximum 3 options allowed');
    });

    it('validates options are in list', () => {
      expect(validateField(field, ['A', 'X'])).toBe('Invalid option selected');
    });

    it('returns null for valid selection', () => {
      expect(validateField(field, ['A', 'B'])).toBeNull();
    });
  });

  describe('date/time validation', () => {
    it('validates date format', () => {
      const field: FieldDefinition = {
        id: 'date',
        type: 'date',
        label: 'Date',
      };
      expect(validateField(field, 'invalid-date')).toBe('Invalid date/time');
      expect(validateField(field, '2024-01-15T00:00:00.000Z')).toBeNull();
    });
  });

  describe('photo validation', () => {
    const field: FieldDefinition = {
      id: 'photo',
      type: 'photo',
      label: 'Photo',
      validation: { required: true },
    };

    it('validates photo object has uri', () => {
      expect(validateField(field, {})).toBe('Photo is missing');
      expect(validateField(field, { uri: '' })).toBe('Photo is missing');
      expect(validateField(field, { uri: 'file://photo.jpg' })).toBeNull();
    });

    it('returns error for non-object value', () => {
      expect(validateField(field, 'string')).toBe('Invalid photo');
    });
  });

  describe('signature validation', () => {
    const field: FieldDefinition = {
      id: 'signature',
      type: 'signature',
      label: 'Signature',
      validation: { required: true },
    };

    it('validates signature object has uri', () => {
      expect(validateField(field, {})).toBe('Signature is missing');
      expect(validateField(field, { uri: 'file://sig.png' })).toBeNull();
    });
  });
});

describe('validateForm', () => {
  const fields: FieldDefinition[] = [
    {
      id: 'name',
      type: 'text',
      label: 'Name',
      validation: { required: true },
    },
    {
      id: 'email',
      type: 'text',
      label: 'Email',
      validation: { required: true, pattern: '^\\S+@\\S+$' },
    },
    {
      id: 'age',
      type: 'number',
      label: 'Age',
      validation: { min: 0, max: 150 },
    },
  ];

  it('returns isValid true when all fields pass', () => {
    const values = {
      name: 'John',
      email: 'john@example.com',
      age: 30,
    };
    const result = validateForm(fields, values);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns isValid false with errors when fields fail', () => {
    const values = {
      name: '',
      email: 'invalid',
      age: -5,
    };
    const result = validateForm(fields, values);
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBe('This field is required');
    expect(result.errors.email).toBe('Invalid format');
    expect(result.errors.age).toBe('Minimum value is 0');
  });

  it('handles missing values', () => {
    const values = {};
    const result = validateForm(fields, values);
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBe('This field is required');
    expect(result.errors.email).toBe('This field is required');
    // age is not required, so no error
    expect(result.errors.age).toBeUndefined();
  });
});

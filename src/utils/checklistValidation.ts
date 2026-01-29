import * as Yup from 'yup';
import type { FieldDefinition, ChecklistTemplate } from '../types';

/**
 * Generates a Yup validation schema from a checklist template
 * This allows the backend to define validation rules that are enforced on the client
 */
export function generateValidationSchema(
  template: ChecklistTemplate
): Yup.ObjectSchema<Record<string, unknown>> {
  const shape: Record<string, Yup.Schema> = {};

  for (const field of template.fields) {
    shape[field.id] = createFieldSchema(field);
  }

  return Yup.object().shape(shape);
}

function createFieldSchema(field: FieldDefinition): Yup.Schema {
  switch (field.type) {
    case 'text':
    case 'textarea':
      return createTextSchema(field);

    case 'number':
      return createNumberSchema(field);

    case 'select':
      return createSelectSchema(field);

    case 'multi-select':
      return createMultiSelectSchema(field);

    case 'date':
    case 'time':
      return createDateTimeSchema(field);

    case 'checkbox':
      return createCheckboxSchema(field);

    case 'photo':
      return createPhotoSchema(field);

    case 'signature':
      return createSignatureSchema(field);

    default:
      return Yup.mixed().nullable();
  }
}

function createTextSchema(field: FieldDefinition): Yup.Schema {
  let schema = Yup.string();

  if (field.validation?.required) {
    schema = schema.required(`${field.label} is required`);
  } else {
    schema = schema.nullable() as typeof schema;
  }

  if (field.validation?.minLength !== undefined) {
    schema = schema.min(
      field.validation.minLength,
      `${field.label} must be at least ${field.validation.minLength} characters`
    );
  }

  if (field.validation?.maxLength !== undefined) {
    schema = schema.max(
      field.validation.maxLength,
      `${field.label} must be at most ${field.validation.maxLength} characters`
    );
  }

  if (field.validation?.pattern) {
    schema = schema.matches(
      new RegExp(field.validation.pattern),
      field.validation.patternMessage || `${field.label} format is invalid`
    );
  }

  return schema;
}

function createNumberSchema(field: FieldDefinition): Yup.Schema {
  let schema = Yup.number()
    .transform((value, originalValue) => {
      // Handle empty string
      return originalValue === '' ? null : value;
    })
    .typeError(`${field.label} must be a number`);

  if (field.validation?.required) {
    schema = schema.required(`${field.label} is required`);
  } else {
    schema = schema.nullable() as typeof schema;
  }

  if (field.validation?.min !== undefined) {
    schema = schema.min(
      field.validation.min,
      `${field.label} must be at least ${field.validation.min}`
    );
  }

  if (field.validation?.max !== undefined) {
    schema = schema.max(
      field.validation.max,
      `${field.label} must be at most ${field.validation.max}`
    );
  }

  return schema;
}

function createSelectSchema(field: FieldDefinition): Yup.Schema {
  let schema = Yup.string()
    .transform((value) => {
      // Transform null to undefined for proper validation
      return value === null ? undefined : value;
    });

  if (field.validation?.required) {
    schema = schema.required(`Please select a ${field.label.toLowerCase()}`);
  } else {
    schema = schema.nullable() as typeof schema;
  }

  if (field.options && field.options.length > 0) {
    // Include undefined and empty string as valid for non-required fields
    const validValues = [...field.options, '', undefined];
    schema = schema.oneOf(
      validValues,
      `Please select a valid option`
    );
  }

  return schema;
}

function createMultiSelectSchema(field: FieldDefinition): Yup.Schema {
  let schema = Yup.array().of(Yup.string().required());

  if (field.validation?.required) {
    schema = schema.min(1, `Please select at least one ${field.label.toLowerCase()}`);
  }

  if (field.validation?.min !== undefined) {
    schema = schema.min(
      field.validation.min,
      `Please select at least ${field.validation.min} options`
    );
  }

  if (field.validation?.max !== undefined) {
    schema = schema.max(
      field.validation.max,
      `You can select at most ${field.validation.max} options`
    );
  }

  return schema;
}

function createDateTimeSchema(field: FieldDefinition): Yup.Schema {
  let schema = Yup.string();

  if (field.validation?.required) {
    schema = schema.required(`${field.label} is required`);
  } else {
    schema = schema.nullable() as typeof schema;
  }

  return schema;
}

function createCheckboxSchema(field: FieldDefinition): Yup.Schema {
  let schema = Yup.boolean();

  if (field.validation?.required) {
    schema = schema.oneOf([true], `${field.label} must be checked`);
  }

  return schema;
}

function createPhotoSchema(field: FieldDefinition): Yup.Schema {
  let schema = Yup.array().of(
    Yup.object().shape({
      uri: Yup.string().required(),
      localPath: Yup.string(),
      capturedAt: Yup.string(),
    })
  );

  if (field.validation?.required) {
    schema = schema.min(1, `Please capture at least one photo for ${field.label}`);
  }

  return schema;
}

function createSignatureSchema(field: FieldDefinition): Yup.Schema {
  const schema = Yup.object().shape({
    uri: Yup.string().required(),
  });

  if (field.validation?.required) {
    return schema.required(`${field.label} is required`);
  }

  return schema.nullable();
}

/**
 * Get initial values for Formik from template and existing responses
 */
export function getInitialValues(
  template: ChecklistTemplate,
  existingResponses: Array<{ fieldId: string; value: unknown }>
): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const field of template.fields) {
    const existing = existingResponses.find((r) => r.fieldId === field.id);

    if (existing) {
      values[field.id] = existing.value;
    } else if (field.defaultValue !== undefined) {
      values[field.id] = field.defaultValue;
    } else {
      values[field.id] = getDefaultValue(field.type);
    }
  }

  return values;
}

function getDefaultValue(type: FieldDefinition['type']): unknown {
  switch (type) {
    case 'text':
    case 'textarea':
      return '';
    case 'number':
      return null;
    case 'select':
      return null;
    case 'multi-select':
      return [];
    case 'date':
    case 'time':
      return null;
    case 'checkbox':
      return false;
    case 'photo':
      return [];
    case 'signature':
      return null;
    default:
      return null;
  }
}

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TextField from './fields/TextField';
import TextAreaField from './fields/TextAreaField';
import NumberField from './fields/NumberField';
import SelectField from './fields/SelectField';
import MultiSelectField from './fields/MultiSelectField';
import DateField from './fields/DateField';
import TimeField from './fields/TimeField';
import CheckboxField from './fields/CheckboxField';
import PhotoField from './fields/PhotoField';
import SignatureField from './fields/SignatureField';
import { UI } from '../../constants';
import type { FieldDefinition } from '../../types';

interface ChecklistRendererProps {
  fields: FieldDefinition[];
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  onFieldChange: (fieldId: string, value: unknown) => void;
  onFieldBlur: (fieldId: string) => void;
  onPhotoCapture: (fieldId: string, maxPhotos?: number) => void;
  onSignatureCapture: (fieldId: string) => void;
  registerFieldRef: (fieldId: string, ref: View | null) => void;
}

const FIELD_COMPONENTS: Record<
  FieldDefinition['type'],
  React.ComponentType<FieldComponentProps>
> = {
  text: TextField,
  textarea: TextAreaField,
  number: NumberField,
  select: SelectField,
  'multi-select': MultiSelectField,
  date: DateField,
  time: TimeField,
  checkbox: CheckboxField,
  photo: PhotoField,
  signature: SignatureField,
};

export interface FieldComponentProps {
  field: FieldDefinition;
  value: unknown;
  error: string | null;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  onCapture?: () => void;
}

export default function ChecklistRenderer({
  fields,
  values,
  errors,
  touched,
  onFieldChange,
  onFieldBlur,
  onPhotoCapture,
  onSignatureCapture,
  registerFieldRef,
}: ChecklistRendererProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {fields.map((field) => {
        const Component = FIELD_COMPONENTS[field.type];
        const value = values[field.id];
        const error = errors[field.id];
        const isTouched = touched[field.id];
        const showError = isTouched && error;

        if (!Component) {
          return (
            <View key={field.id} style={styles.fieldContainer}>
              <Text style={styles.unsupportedText}>
                Unsupported field type: {field.type}
              </Text>
            </View>
          );
        }

        const onCapture =
          field.type === 'photo'
            ? () => onPhotoCapture(field.id, field.maxPhotos)
            : field.type === 'signature'
              ? () => onSignatureCapture(field.id)
              : undefined;

        return (
          <View
            key={field.id}
            style={styles.fieldContainer}
            ref={(ref) => registerFieldRef(field.id, ref)}
          >
            <View style={styles.labelContainer}>
              <Text style={styles.label}>{field.label}</Text>
              {field.validation?.required && (
                <Text style={styles.required}>*</Text>
              )}
            </View>

            <Component
              field={field}
              value={value}
              error={showError ? error : null}
              onChange={(v) => onFieldChange(field.id, v)}
              onBlur={() => onFieldBlur(field.id)}
              onCapture={onCapture}
            />

            {showError && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: UI.SPACING.md,
  },
  fieldContainer: {
    marginBottom: UI.SPACING.lg,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: UI.SPACING.xs,
  },
  label: {
    fontSize: UI.FONT_SIZE.sm,
    fontWeight: '500',
    color: UI.COLORS.text,
  },
  required: {
    fontSize: UI.FONT_SIZE.sm,
    color: UI.COLORS.error,
    marginLeft: 2,
  },
  errorText: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.error,
    marginTop: UI.SPACING.xs,
  },
  unsupportedText: {
    fontSize: UI.FONT_SIZE.sm,
    color: UI.COLORS.textSecondary,
    fontStyle: 'italic',
  },
});

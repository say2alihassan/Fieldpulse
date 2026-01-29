import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { UI } from '../../../constants';
import type { FieldDefinition } from '../../../types';

interface TextAreaFieldProps {
  field: FieldDefinition;
  value: unknown;
  error: string | null;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}

export default function TextAreaField({
  field,
  value,
  error,
  onChange,
  onBlur,
}: TextAreaFieldProps): React.JSX.Element {
  return (
    <TextInput
      style={[styles.input, error && styles.inputError]}
      value={(value as string) || ''}
      onChangeText={onChange}
      onBlur={onBlur}
      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
      placeholderTextColor={UI.COLORS.disabled}
      multiline
      numberOfLines={4}
      textAlignVertical="top"
      testID={`field-${field.id}`}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: UI.COLORS.surface,
    borderWidth: 1,
    borderColor: UI.COLORS.border,
    borderRadius: UI.BORDER_RADIUS.md,
    padding: UI.SPACING.md,
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.text,
    minHeight: 100,
  },
  inputError: {
    borderColor: UI.COLORS.error,
  },
});

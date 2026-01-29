import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { UI } from '../../../constants';
import type { FieldDefinition } from '../../../types';

interface NumberFieldProps {
  field: FieldDefinition;
  value: unknown;
  error: string | null;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}

export default function NumberField({
  field,
  value,
  error,
  onChange,
  onBlur,
}: NumberFieldProps): React.JSX.Element {
  const handleChange = (text: string): void => {
    // Allow empty string
    if (text === '') {
      onChange(null);
      return;
    }

    // Parse number
    const num = parseFloat(text);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  return (
    <TextInput
      style={[styles.input, error && styles.inputError]}
      value={value !== null && value !== undefined ? String(value) : ''}
      onChangeText={handleChange}
      onBlur={onBlur}
      placeholder={field.placeholder || 'Enter number'}
      placeholderTextColor={UI.COLORS.disabled}
      keyboardType="numeric"
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
  },
  inputError: {
    borderColor: UI.COLORS.error,
  },
});

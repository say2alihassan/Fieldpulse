import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UI } from '../../../constants';
import type { FieldDefinition } from '../../../types';

interface CheckboxFieldProps {
  field: FieldDefinition;
  value: unknown;
  error: string | null;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}

export default function CheckboxField({
  field,
  value,
  onChange,
  onBlur,
}: CheckboxFieldProps): React.JSX.Element {
  const isChecked = Boolean(value);

  const handlePress = () => {
    onChange(!isChecked);
    onBlur();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
        {isChecked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.label}>{field.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI.SPACING.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: UI.COLORS.border,
    borderRadius: UI.BORDER_RADIUS.sm,
    marginRight: UI.SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: UI.COLORS.primary,
    borderColor: UI.COLORS.primary,
  },
  checkmark: {
    color: UI.COLORS.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.text,
    flex: 1,
  },
});

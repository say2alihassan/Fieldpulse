import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { UI } from '../../constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export default function Input({
  label,
  error,
  containerStyle,
  required,
  style,
  ...props
}: InputProps): React.JSX.Element {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          props.multiline && styles.multiline,
          style,
        ]}
        placeholderTextColor={UI.COLORS.disabled}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: UI.SPACING.md,
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
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.error,
    marginTop: UI.SPACING.xs,
  },
});

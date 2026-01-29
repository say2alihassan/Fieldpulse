import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { UI } from '../../../constants';
import type { FieldDefinition } from '../../../types';

interface TimeFieldProps {
  field: FieldDefinition;
  value: unknown;
  error: string | null;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}

export default function TimeField({
  field,
  value,
  error,
  onChange,
  onBlur,
}: TimeFieldProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  const dateValue = value ? new Date(value as string) : new Date();

  const handleChange = useCallback(
    (_event: unknown, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setIsOpen(false);
      }

      if (selectedDate) {
        onChange(selectedDate.toISOString());
        // Delay onBlur to ensure onChange has completed
        setTimeout(() => onBlur(), 0);
      } else if (Platform.OS === 'android') {
        // User dismissed on Android without selecting
        onBlur();
      }
    },
    [onChange, onBlur]
  );

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    // Delay onBlur to ensure state has updated
    setTimeout(() => onBlur(), 0);
  }, [onBlur]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    onBlur();
  }, [onBlur]);

  const displayValue = value
    ? format(new Date(value as string), 'h:mm a')
    : field.placeholder || 'Select time';

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[styles.selectorText, !value && styles.selectorPlaceholder]}>
          {displayValue}
        </Text>
        <Text style={styles.icon}>🕐</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={isOpen}
          transparent
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel}>
                  <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={styles.doneButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dateValue}
                mode="time"
                display="spinner"
                onChange={handleChange}
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      ) : (
        isOpen && (
          <DateTimePicker
            value={dateValue}
            mode="time"
            display="default"
            onChange={handleChange}
          />
        )
      )}
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    backgroundColor: UI.COLORS.surface,
    borderWidth: 1,
    borderColor: UI.COLORS.border,
    borderRadius: UI.BORDER_RADIUS.md,
    padding: UI.SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorError: {
    borderColor: UI.COLORS.error,
  },
  selectorText: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.text,
  },
  selectorPlaceholder: {
    color: UI.COLORS.disabled,
  },
  icon: {
    fontSize: UI.FONT_SIZE.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: UI.COLORS.surface,
    borderTopLeftRadius: UI.BORDER_RADIUS.lg,
    borderTopRightRadius: UI.BORDER_RADIUS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: UI.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: UI.COLORS.border,
  },
  cancelButton: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.textSecondary,
  },
  doneButton: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.primary,
    fontWeight: '500',
  },
  picker: {
    height: 200,
  },
});

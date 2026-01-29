import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { UI } from '../../../constants';
import type { FieldDefinition } from '../../../types';

interface SelectFieldProps {
  field: FieldDefinition;
  value: unknown;
  error: string | null;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}

export default function SelectField({
  field,
  value,
  error,
  onChange,
  onBlur,
}: SelectFieldProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const options = field.options || [];

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onBlur();
  }, [onBlur]);

  const handleSelect = useCallback(
    (option: string) => {
      onChange(option);
      setIsOpen(false);
      // Delay onBlur to ensure onChange has completed
      setTimeout(() => onBlur(), 0);
    },
    [onChange, onBlur]
  );

  const renderOption = ({ item }: { item: string }): React.JSX.Element => (
    <TouchableOpacity
      style={[styles.option, value === item && styles.optionSelected]}
      onPress={() => handleSelect(item)}
    >
      <Text
        style={[styles.optionText, value === item && styles.optionTextSelected]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setIsOpen(true)}
        testID={`field-${field.id}-dropdown`}
      >
        <Text
          style={[styles.selectorText, !value && styles.selectorPlaceholder]}
        >
          {(value as string) || field.placeholder || 'Select an option'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{field.label}</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item}
              style={styles.optionsList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  arrow: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.textSecondary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: UI.SPACING.lg,
  },
  modal: {
    backgroundColor: UI.COLORS.surface,
    borderRadius: UI.BORDER_RADIUS.lg,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: UI.COLORS.border,
  },
  modalTitle: {
    fontSize: UI.FONT_SIZE.lg,
    fontWeight: '600',
    color: UI.COLORS.text,
  },
  closeButton: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.primary,
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    padding: UI.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: UI.COLORS.border,
  },
  optionSelected: {
    backgroundColor: UI.COLORS.primary + '20',
  },
  optionText: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.text,
  },
  optionTextSelected: {
    color: UI.COLORS.primary,
    fontWeight: '500',
  },
});

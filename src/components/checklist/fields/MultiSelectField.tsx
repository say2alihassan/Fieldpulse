import React, { useState, useCallback, useMemo } from 'react';
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

interface MultiSelectFieldProps {
  field: FieldDefinition;
  value: unknown;
  error: string | null;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}

export default function MultiSelectField({
  field,
  value,
  error,
  onChange,
  onBlur,
}: MultiSelectFieldProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const options = field.options || [];
  const selected = useMemo(() => (value as string[]) || [], [value]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Delay onBlur to ensure onChange has completed
    setTimeout(() => onBlur(), 0);
  }, [onBlur]);

  const handleToggle = useCallback(
    (option: string) => {
      const newSelected = selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option];
      onChange(newSelected);
    },
    [selected, onChange]
  );

  const renderOption = ({ item }: { item: string }): React.JSX.Element => {
    const isSelected = selected.includes(item);

    return (
      <TouchableOpacity
        style={[styles.option, isSelected && styles.optionSelected]}
        onPress={() => handleToggle(item)}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text
          style={[styles.optionText, isSelected && styles.optionTextSelected]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  const displayText =
    selected.length > 0
      ? selected.join(', ')
      : field.placeholder || 'Select options';

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setIsOpen(true)}
      >
        <Text
          style={[
            styles.selectorText,
            selected.length === 0 && styles.selectorPlaceholder,
          ]}
          numberOfLines={1}
        >
          {displayText}
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
                <Text style={styles.doneButton}>Done</Text>
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
    flex: 1,
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.text,
    marginRight: UI.SPACING.sm,
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
  doneButton: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.primary,
    fontWeight: '500',
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: UI.COLORS.border,
  },
  optionSelected: {
    backgroundColor: UI.COLORS.primary + '10',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: UI.COLORS.border,
    borderRadius: UI.BORDER_RADIUS.sm,
    marginRight: UI.SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: UI.COLORS.primary,
    borderColor: UI.COLORS.primary,
  },
  checkmark: {
    color: UI.COLORS.textLight,
    fontSize: 14,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.text,
  },
  optionTextSelected: {
    fontWeight: '500',
  },
});

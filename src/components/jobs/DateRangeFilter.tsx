import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { UI, DATE_FORMATS } from '../../constants';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

type PickerMode = 'start' | 'end' | null;

export default function DateRangeFilter({
  value,
  onChange,
}: DateRangeFilterProps): React.JSX.Element {
  const [showPicker, setShowPicker] = useState<PickerMode>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const handleStartPress = useCallback(() => {
    setTempDate(value.startDate || new Date());
    setShowPicker('start');
  }, [value.startDate]);

  const handleEndPress = useCallback(() => {
    setTempDate(value.endDate || new Date());
    setShowPicker('end');
  }, [value.endDate]);

  const handleDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowPicker(null);
        if (event.type === 'dismissed') return;
      }

      if (selectedDate) {
        setTempDate(selectedDate);

        if (Platform.OS === 'android') {
          // On Android, apply immediately
          if (showPicker === 'start') {
            onChange({ ...value, startDate: selectedDate });
          } else if (showPicker === 'end') {
            onChange({ ...value, endDate: selectedDate });
          }
        }
      }
    },
    [showPicker, value, onChange]
  );

  const handleConfirm = useCallback(() => {
    if (showPicker === 'start') {
      onChange({ ...value, startDate: tempDate });
    } else if (showPicker === 'end') {
      onChange({ ...value, endDate: tempDate });
    }
    setShowPicker(null);
  }, [showPicker, tempDate, value, onChange]);

  const handleClear = useCallback(() => {
    onChange({ startDate: null, endDate: null });
  }, [onChange]);

  const hasFilter = value.startDate || value.endDate;

  const formatDateDisplay = (date: Date | null, placeholder: string): string => {
    return date ? format(date, DATE_FORMATS.DISPLAY_DATE) : placeholder;
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateButtons}>
        <TouchableOpacity
          style={[styles.dateButton, value.startDate && styles.dateButtonActive]}
          onPress={handleStartPress}
        >
          <Text style={styles.dateLabel}>From</Text>
          <Text
            style={[
              styles.dateValue,
              !value.startDate && styles.dateValuePlaceholder,
            ]}
          >
            {formatDateDisplay(value.startDate, 'Any')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.separator}>-</Text>

        <TouchableOpacity
          style={[styles.dateButton, value.endDate && styles.dateButtonActive]}
          onPress={handleEndPress}
        >
          <Text style={styles.dateLabel}>To</Text>
          <Text
            style={[
              styles.dateValue,
              !value.endDate && styles.dateValuePlaceholder,
            ]}
          >
            {formatDateDisplay(value.endDate, 'Any')}
          </Text>
        </TouchableOpacity>

        {hasFilter && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* iOS Modal Picker */}
      {Platform.OS === 'ios' && showPicker && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowPicker(null)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {showPicker === 'start' ? 'Start Date' : 'End Date'}
                </Text>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={showPicker === 'start' && value.endDate ? value.endDate : undefined}
                minimumDate={showPicker === 'end' && value.startDate ? value.startDate : undefined}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android Picker */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={showPicker === 'start' && value.endDate ? value.endDate : undefined}
          minimumDate={showPicker === 'end' && value.startDate ? value.startDate : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: UI.SPACING.md,
    paddingBottom: UI.SPACING.sm,
  },
  dateButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flex: 1,
    backgroundColor: UI.COLORS.surface,
    borderWidth: 1,
    borderColor: UI.COLORS.border,
    borderRadius: UI.BORDER_RADIUS.md,
    padding: UI.SPACING.sm,
  },
  dateButtonActive: {
    borderColor: UI.COLORS.primary,
    backgroundColor: '#E3F2FD',
  },
  dateLabel: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.textSecondary,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: UI.FONT_SIZE.sm,
    color: UI.COLORS.text,
    fontWeight: '500',
  },
  dateValuePlaceholder: {
    color: UI.COLORS.disabled,
  },
  separator: {
    marginHorizontal: UI.SPACING.sm,
    color: UI.COLORS.textSecondary,
  },
  clearButton: {
    marginLeft: UI.SPACING.sm,
    padding: UI.SPACING.sm,
  },
  clearButtonText: {
    color: UI.COLORS.primary,
    fontSize: UI.FONT_SIZE.sm,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: UI.COLORS.surface,
    borderTopLeftRadius: UI.BORDER_RADIUS.lg,
    borderTopRightRadius: UI.BORDER_RADIUS.lg,
    paddingBottom: UI.SPACING.xl,
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
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
    color: UI.COLORS.text,
  },
  modalCancel: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.textSecondary,
  },
  modalDone: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.primary,
    fontWeight: '600',
  },
});

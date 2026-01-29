import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { RectButton, ScrollView } from 'react-native-gesture-handler';
import { UI, JOB_STATUS_COLORS } from '../../constants';
import type { JobStatus } from '../../types';

interface StatusFilterProps {
  options: JobStatus[];
  selected: JobStatus[];
  onSelect: (status: JobStatus) => void;
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function StatusFilter({
  options,
  selected,
  onSelect,
}: StatusFilterProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {options.map((status) => {
          const isSelected = selected.includes(status);
          const color = JOB_STATUS_COLORS[status];

          return (
            <RectButton
              key={status}
              style={[
                styles.chip,
                isSelected && { backgroundColor: color },
                !isSelected && { borderColor: color },
              ]}
              onPress={() => onSelect(status)}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                  !isSelected && { color },
                ]}
              >
                {formatStatus(status)}
              </Text>
            </RectButton>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
  },
  content: {
    paddingHorizontal: UI.SPACING.md,
    paddingBottom: UI.SPACING.sm,
    gap: UI.SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: UI.SPACING.md,
    paddingVertical: UI.SPACING.sm,
    borderRadius: UI.BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: UI.FONT_SIZE.sm,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: UI.COLORS.textLight,
  },
});

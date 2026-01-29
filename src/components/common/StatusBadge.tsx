import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UI } from '../../constants';

interface StatusBadgeProps {
  status: string;
  color: string;
}

export default function StatusBadge({
  status,
  color,
}: StatusBadgeProps): React.JSX.Element {
  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      <Text style={styles.text}>{formatStatus(status)}</Text>
    </View>
  );
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: UI.SPACING.sm,
    paddingVertical: UI.SPACING.xs,
    borderRadius: UI.BORDER_RADIUS.sm,
  },
  text: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.xs,
    fontWeight: '600',
  },
});

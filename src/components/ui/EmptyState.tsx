import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UI } from '../../constants';

interface EmptyStateProps {
  message: string;
  icon?: string;
}

export default function EmptyState({
  message,
  icon,
}: EmptyStateProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: UI.SPACING.xl * 2,
  },
  icon: {
    fontSize: 48,
    marginBottom: UI.SPACING.md,
  },
  message: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.textSecondary,
    textAlign: 'center',
  },
});

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { UI } from '../../constants';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = 'large',
  color = UI.COLORS.primary,
  text,
  fullScreen = false,
}: LoadingSpinnerProps): React.JSX.Element {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: UI.SPACING.lg,
  },
  fullScreen: {
    flex: 1,
  },
  text: {
    marginTop: UI.SPACING.md,
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.textSecondary,
  },
});

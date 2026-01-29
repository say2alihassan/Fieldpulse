import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UI } from '../../constants';

type BannerVariant = 'info' | 'success' | 'warning' | 'error';

interface BannerProps {
  message: string;
  variant?: BannerVariant;
  onPress?: () => void;
  dismissText?: string;
}

export default function Banner({
  message,
  variant = 'info',
  onPress,
  dismissText,
}: BannerProps): React.JSX.Element {
  const content = (
    <View style={[styles.container, variantStyles[variant]]}>
      <Text style={[styles.message, textStyles[variant]]}>{message}</Text>
      {dismissText && <Text style={styles.dismiss}>{dismissText}</Text>}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    padding: UI.SPACING.sm,
    alignItems: 'center',
  },
  message: {
    fontSize: UI.FONT_SIZE.sm,
    fontWeight: '500',
  },
  dismiss: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.textSecondary,
    marginTop: 2,
  },
});

const variantStyles = StyleSheet.create({
  info: {
    backgroundColor: '#E3F2FD',
  },
  success: {
    backgroundColor: '#E8F5E9',
  },
  warning: {
    backgroundColor: UI.COLORS.warning,
  },
  error: {
    backgroundColor: '#FFEBEE',
  },
});

const textStyles = StyleSheet.create({
  info: {
    color: UI.COLORS.primary,
  },
  success: {
    color: UI.COLORS.success,
  },
  warning: {
    color: UI.COLORS.textLight,
  },
  error: {
    color: UI.COLORS.error,
  },
});

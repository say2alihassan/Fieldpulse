import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { UI } from '../../constants';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  testID?: string;
}

export default function Card({
  children,
  onPress,
  style,
  padding = 'md',
  testID,
}: CardProps): React.JSX.Element {
  const content = (
    <View style={[styles.card, paddingStyles[padding], style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        testID={testID}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI.COLORS.surface,
    borderRadius: UI.BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

const paddingStyles = StyleSheet.create({
  none: {
    padding: 0,
  },
  sm: {
    padding: UI.SPACING.sm,
  },
  md: {
    padding: UI.SPACING.md,
  },
  lg: {
    padding: UI.SPACING.lg,
  },
});

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { UI } from '../../constants';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
  testID,
}: ButtonProps): React.JSX.Element {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? UI.COLORS.primary : UI.COLORS.textLight}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              textVariantStyles[variant],
              textSizeStyles[size],
              icon ? styles.textWithIcon : undefined,
              isDisabled ? styles.textDisabled : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: UI.BORDER_RADIUS.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
  textWithIcon: {
    marginLeft: UI.SPACING.xs,
  },
  textDisabled: {
    opacity: 0.7,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: UI.COLORS.primary,
  },
  secondary: {
    backgroundColor: UI.COLORS.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: UI.COLORS.primary,
  },
  danger: {
    backgroundColor: UI.COLORS.error,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingVertical: UI.SPACING.xs,
    paddingHorizontal: UI.SPACING.md,
    minHeight: 32,
  },
  md: {
    paddingVertical: UI.SPACING.sm,
    paddingHorizontal: UI.SPACING.lg,
    minHeight: 44,
  },
  lg: {
    paddingVertical: UI.SPACING.md,
    paddingHorizontal: UI.SPACING.xl,
    minHeight: 52,
  },
});

const textVariantStyles = StyleSheet.create({
  primary: {
    color: UI.COLORS.textLight,
  },
  secondary: {
    color: UI.COLORS.textLight,
  },
  outline: {
    color: UI.COLORS.primary,
  },
  danger: {
    color: UI.COLORS.textLight,
  },
  ghost: {
    color: UI.COLORS.primary,
  },
});

const textSizeStyles = StyleSheet.create({
  sm: {
    fontSize: UI.FONT_SIZE.sm,
  },
  md: {
    fontSize: UI.FONT_SIZE.md,
  },
  lg: {
    fontSize: UI.FONT_SIZE.lg,
  },
});

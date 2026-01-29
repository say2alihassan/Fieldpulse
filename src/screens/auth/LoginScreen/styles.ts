import { StyleSheet } from 'react-native';
import { UI } from '../../../constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: UI.SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: UI.SPACING.xl * 2,
  },
  title: {
    fontSize: UI.FONT_SIZE.title,
    fontWeight: 'bold',
    color: UI.COLORS.primary,
    marginBottom: UI.SPACING.xs,
  },
  subtitle: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.textSecondary,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: UI.SPACING.md,
    padding: UI.SPACING.md,
    backgroundColor: UI.COLORS.surface,
    borderRadius: UI.BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: UI.COLORS.primary,
  },
  welcomeText: {
    fontSize: UI.FONT_SIZE.lg,
    fontWeight: '600',
    color: UI.COLORS.text,
    marginBottom: UI.SPACING.xs,
  },
  welcomeSubtext: {
    fontSize: UI.FONT_SIZE.sm,
    color: UI.COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: UI.SPACING.md,
  },
  inputContainer: {
    gap: UI.SPACING.xs,
  },
  label: {
    fontSize: UI.FONT_SIZE.sm,
    fontWeight: '500',
    color: UI.COLORS.text,
  },
  input: {
    backgroundColor: UI.COLORS.surface,
    borderWidth: 1,
    borderColor: UI.COLORS.border,
    borderRadius: UI.BORDER_RADIUS.md,
    padding: UI.SPACING.md,
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.text,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: UI.SPACING.sm,
    borderRadius: UI.BORDER_RADIUS.sm,
  },
  errorText: {
    color: UI.COLORS.error,
    fontSize: UI.FONT_SIZE.sm,
    textAlign: 'center',
  },
  button: {
    backgroundColor: UI.COLORS.primary,
    padding: UI.SPACING.md,
    borderRadius: UI.BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: UI.SPACING.sm,
  },
  buttonDisabled: {
    backgroundColor: UI.COLORS.disabled,
  },
  buttonText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: UI.SPACING.md,
    borderRadius: UI.BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: UI.COLORS.primary,
    backgroundColor: UI.COLORS.surface,
    gap: UI.SPACING.sm,
  },
  biometricIcon: {
    fontSize: 24,
  },
  biometricText: {
    color: UI.COLORS.primary,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '500',
  },
  footer: {
    marginTop: UI.SPACING.xl * 2,
    alignItems: 'center',
  },
  footerText: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.textSecondary,
  },
});

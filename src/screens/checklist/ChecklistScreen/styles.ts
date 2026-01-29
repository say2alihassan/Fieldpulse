import { StyleSheet } from 'react-native';
import { UI } from '../../../constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UI.COLORS.background,
  },
  savingBanner: {
    backgroundColor: UI.COLORS.info,
    padding: UI.SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: UI.SPACING.sm,
  },
  savingText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.sm,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    padding: UI.SPACING.sm,
    alignItems: 'center',
  },
  errorText: {
    color: UI.COLORS.error,
    fontSize: UI.FONT_SIZE.sm,
  },
  errorDismiss: {
    color: UI.COLORS.error,
    fontSize: UI.FONT_SIZE.xs,
    opacity: 0.7,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  footer: {
    padding: UI.SPACING.md,
    backgroundColor: UI.COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: UI.COLORS.border,
  },
  unsavedText: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: UI.SPACING.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: UI.SPACING.sm,
  },
  draftButton: {
    flex: 1,
    backgroundColor: UI.COLORS.surface,
    borderWidth: 1,
    borderColor: UI.COLORS.primary,
    padding: UI.SPACING.md,
    borderRadius: UI.BORDER_RADIUS.md,
    alignItems: 'center',
  },
  draftButtonText: {
    color: UI.COLORS.primary,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: UI.COLORS.success,
    padding: UI.SPACING.md,
    borderRadius: UI.BORDER_RADIUS.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: UI.COLORS.disabled,
    borderColor: UI.COLORS.disabled,
  },
  submitButtonText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
  },
});

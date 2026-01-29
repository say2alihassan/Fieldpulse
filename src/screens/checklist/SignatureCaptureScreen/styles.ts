import { StyleSheet } from 'react-native';
import { UI } from '../../../constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.COLORS.background,
  },
  landscapeLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sideControls: {
    width: 100,
    backgroundColor: UI.COLORS.surface,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UI.SPACING.lg,
    borderColor: UI.COLORS.border,
  },
  sideButton: {
    padding: UI.SPACING.md,
  },
  sideButtonDisabled: {
    opacity: 0.5,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
    color: UI.COLORS.text,
    marginBottom: UI.SPACING.xs,
  },
  subtitle: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.textSecondary,
    textAlign: 'center',
  },
  cancelText: {
    color: UI.COLORS.primary,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '500',
  },
  clearText: {
    color: UI.COLORS.error,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '500',
  },
  disabledText: {
    color: UI.COLORS.disabled,
  },
  signatureArea: {
    flex: 1,
    padding: UI.SPACING.md,
  },
  signatureContainer: {
    flex: 1,
    borderWidth: 2,
    borderColor: UI.COLORS.border,
    borderRadius: UI.BORDER_RADIUS.lg,
    backgroundColor: '#fff',
    overflow: 'hidden',
    position: 'relative',
  },
  signatureLineOverlay: {
    position: 'absolute',
    bottom: UI.SPACING.xl,
    left: UI.SPACING.xl,
    right: UI.SPACING.xl,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  line: {
    width: '100%',
    height: 1,
    backgroundColor: UI.COLORS.border,
    marginBottom: UI.SPACING.xs,
  },
  signatureLabel: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.disabled,
  },
  saveButton: {
    backgroundColor: UI.COLORS.success,
    paddingHorizontal: UI.SPACING.lg,
    paddingVertical: UI.SPACING.md,
    borderRadius: UI.BORDER_RADIUS.md,
  },
  saveButtonDisabled: {
    backgroundColor: UI.COLORS.disabled,
  },
  saveButtonText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
  },
});

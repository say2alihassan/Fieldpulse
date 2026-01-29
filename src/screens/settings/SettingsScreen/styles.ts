import { StyleSheet } from 'react-native';
import { UI } from '../../../constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.COLORS.background,
  },
  section: {
    backgroundColor: UI.COLORS.surface,
    marginTop: UI.SPACING.md,
    paddingHorizontal: UI.SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: UI.COLORS.border,
  },
  sectionTitle: {
    fontSize: UI.FONT_SIZE.sm,
    fontWeight: '600',
    color: UI.COLORS.textSecondary,
    textTransform: 'uppercase',
    paddingVertical: UI.SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UI.SPACING.md,
    borderTopWidth: 1,
    borderTopColor: UI.COLORS.border,
  },
  label: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.text,
  },
  value: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.textSecondary,
  },
  valueDisabled: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.disabled,
    fontStyle: 'italic',
  },
  online: {
    color: UI.COLORS.success,
  },
  offline: {
    color: UI.COLORS.error,
  },
  syncButton: {
    backgroundColor: UI.COLORS.primary,
    padding: UI.SPACING.md,
    borderRadius: UI.BORDER_RADIUS.md,
    alignItems: 'center',
    marginVertical: UI.SPACING.md,
  },
  syncButtonDisabled: {
    backgroundColor: UI.COLORS.disabled,
  },
  syncButtonText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: UI.SPACING.md,
  },
  logoutButton: {
    backgroundColor: UI.COLORS.error,
    padding: UI.SPACING.md,
    borderRadius: UI.BORDER_RADIUS.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
  },
});

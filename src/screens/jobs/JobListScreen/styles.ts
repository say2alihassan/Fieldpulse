import { StyleSheet } from 'react-native';
import { UI } from '../../../constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.COLORS.background,
  },
  offlineBanner: {
    backgroundColor: UI.COLORS.warning,
    padding: UI.SPACING.sm,
    alignItems: 'center',
  },
  offlineText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.sm,
    fontWeight: '500',
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
  searchContainer: {
    padding: UI.SPACING.md,
    paddingBottom: UI.SPACING.sm,
  },
  searchInput: {
    backgroundColor: UI.COLORS.surface,
    borderWidth: 1,
    borderColor: UI.COLORS.border,
    borderRadius: UI.BORDER_RADIUS.md,
    padding: UI.SPACING.sm,
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.text,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: UI.SPACING.md,
    paddingBottom: UI.SPACING.md,
  },
  footer: {
    padding: UI.SPACING.md,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: UI.SPACING.xl * 2,
  },
  emptyText: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.textSecondary,
  },
});

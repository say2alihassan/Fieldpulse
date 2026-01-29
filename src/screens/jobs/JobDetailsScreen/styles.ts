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
  scrollView: {
    flex: 1,
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
  header: {
    backgroundColor: UI.COLORS.surface,
    padding: UI.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: UI.COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI.SPACING.sm,
  },
  jobNumber: {
    fontSize: UI.FONT_SIZE.sm,
    color: UI.COLORS.textSecondary,
    fontWeight: '500',
  },
  title: {
    fontSize: UI.FONT_SIZE.xl,
    fontWeight: '600',
    color: UI.COLORS.text,
    marginBottom: UI.SPACING.xs,
  },
  description: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.textSecondary,
    marginBottom: UI.SPACING.sm,
  },
  priorityContainer: {
    flexDirection: 'row',
  },
  priorityBadge: {
    paddingHorizontal: UI.SPACING.sm,
    paddingVertical: UI.SPACING.xs,
    borderRadius: UI.BORDER_RADIUS.sm,
  },
  priorityText: {
    fontSize: UI.FONT_SIZE.xs,
    fontWeight: '600',
    color: UI.COLORS.textLight,
  },
  section: {
    backgroundColor: UI.COLORS.surface,
    padding: UI.SPACING.md,
    marginTop: UI.SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: UI.COLORS.border,
  },
  sectionTitle: {
    fontSize: UI.FONT_SIZE.sm,
    fontWeight: '600',
    color: UI.COLORS.textSecondary,
    marginBottom: UI.SPACING.sm,
    textTransform: 'uppercase',
  },
  scheduleRow: {
    flexDirection: 'row',
    marginBottom: UI.SPACING.xs,
  },
  scheduleLabel: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.textSecondary,
    width: 100,
  },
  scheduleValue: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.text,
    flex: 1,
  },
  customerName: {
    fontSize: UI.FONT_SIZE.lg,
    fontWeight: '500',
    color: UI.COLORS.text,
    marginBottom: UI.SPACING.sm,
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: UI.SPACING.xs,
  },
  contactLabel: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.textSecondary,
    width: 60,
  },
  contactValue: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.primary,
    flex: 1,
  },
  addressContainer: {
    marginTop: UI.SPACING.sm,
    padding: UI.SPACING.sm,
    backgroundColor: UI.COLORS.background,
    borderRadius: UI.BORDER_RADIUS.md,
  },
  addressText: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.text,
    lineHeight: 22,
  },
  openMapsText: {
    fontSize: UI.FONT_SIZE.sm,
    color: UI.COLORS.primary,
    marginTop: UI.SPACING.xs,
  },
  mapContainer: {
    height: 200,
    margin: UI.SPACING.md,
    borderRadius: UI.BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  checklistName: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.text,
  },
  checklistCount: {
    fontSize: UI.FONT_SIZE.sm,
    color: UI.COLORS.textSecondary,
    marginTop: UI.SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    padding: UI.SPACING.md,
    gap: UI.SPACING.sm,
    backgroundColor: UI.COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: UI.COLORS.border,
  },
  button: {
    flex: 1,
    padding: UI.SPACING.md,
    borderRadius: UI.BORDER_RADIUS.md,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: UI.COLORS.success,
  },
  checklistButton: {
    backgroundColor: UI.COLORS.primary,
  },
  buttonText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
  },
  photoGroup: {
    marginBottom: UI.SPACING.md,
  },
  photoGroupLabel: {
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '500',
    color: UI.COLORS.text,
    marginBottom: UI.SPACING.sm,
  },
  photosScrollContent: {
    gap: UI.SPACING.sm,
  },
  photoThumbnailContainer: {
    width: 100,
    height: 100,
    borderRadius: UI.BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: UI.COLORS.background,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
  modalCloseButton: {
    position: 'absolute',
    bottom: 50,
    paddingHorizontal: UI.SPACING.lg,
    paddingVertical: UI.SPACING.md,
    backgroundColor: UI.COLORS.primary,
    borderRadius: UI.BORDER_RADIUS.md,
  },
  modalCloseText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
  },
});

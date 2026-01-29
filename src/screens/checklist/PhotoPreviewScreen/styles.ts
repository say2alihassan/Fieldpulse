import { StyleSheet } from 'react-native';
import { UI } from '../../../constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  preview: {
    flex: 1,
  },
  infoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  infoContainer: {
    padding: UI.SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  infoText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '500',
    textAlign: 'center',
  },
  gpsText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.xs,
    textAlign: 'center',
    marginTop: UI.SPACING.xs,
    opacity: 0.8,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: UI.SPACING.md,
  },
  processingContainer: {
    alignItems: 'center',
    padding: UI.SPACING.lg,
  },
  processingText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.md,
    marginTop: UI.SPACING.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: UI.SPACING.sm,
  },
  button: {
    flex: 1,
    paddingVertical: UI.SPACING.md,
    borderRadius: UI.BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: UI.COLORS.textLight,
  },
  cancelButtonText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '500',
  },
  retakeButton: {
    backgroundColor: UI.COLORS.warning,
  },
  retakeButtonText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
  },
  useButton: {
    backgroundColor: UI.COLORS.success,
  },
  useButtonText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
  },
});

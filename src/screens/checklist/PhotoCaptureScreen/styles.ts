import { StyleSheet } from 'react-native';
import { UI } from '../../../constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI.SPACING.lg,
    backgroundColor: UI.COLORS.background,
  },
  permissionText: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.text,
    textAlign: 'center',
    marginBottom: UI.SPACING.lg,
  },
  permissionButton: {
    backgroundColor: UI.COLORS.primary,
    paddingHorizontal: UI.SPACING.lg,
    paddingVertical: UI.SPACING.md,
    borderRadius: UI.BORDER_RADIUS.md,
    marginBottom: UI.SPACING.md,
  },
  permissionButtonText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
  },
  closeButton: {
    padding: UI.SPACING.md,
  },
  closeButtonText: {
    color: UI.COLORS.primary,
    fontSize: UI.FONT_SIZE.md,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI.SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerInfo: {
    flex: 1,
  },
  photoCountText: {
    color: '#fff',
    fontSize: UI.FONT_SIZE.sm,
    fontWeight: '500',
  },
  headerButton: {
    padding: UI.SPACING.sm,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '500',
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  captureHint: {
    color: '#fff',
    fontSize: UI.FONT_SIZE.sm,
    marginTop: UI.SPACING.sm,
    opacity: 0.8,
  },
});

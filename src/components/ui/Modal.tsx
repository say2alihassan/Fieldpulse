import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { UI } from '../../constants';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeButtonText?: string;
  contentStyle?: ViewStyle;
  animationType?: 'none' | 'slide' | 'fade';
}

export default function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeButtonText = 'Close',
  contentStyle,
  animationType = 'fade',
}: ModalProps): React.JSX.Element {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.content, contentStyle]}
          onStartShouldSetResponder={() => true}
        >
          {(title || showCloseButton) && (
            <View style={styles.header}>
              <Text style={styles.title}>{title || ''}</Text>
              {showCloseButton && (
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeButton}>{closeButtonText}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {children}
        </View>
      </TouchableOpacity>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: UI.SPACING.lg,
  },
  content: {
    backgroundColor: UI.COLORS.surface,
    borderRadius: UI.BORDER_RADIUS.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: UI.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: UI.COLORS.border,
  },
  title: {
    fontSize: UI.FONT_SIZE.lg,
    fontWeight: '600',
    color: UI.COLORS.text,
  },
  closeButton: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.primary,
  },
});

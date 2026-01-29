import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { UI } from '../../../constants';
import type { FieldDefinition } from '../../../types';

interface SignatureFieldProps {
  field: FieldDefinition;
  value: unknown;
  error: string | null;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  onCapture?: () => void;
}

export default function SignatureField({
  value,
  error,
  onBlur: _onBlur,
  onCapture,
}: SignatureFieldProps): React.JSX.Element {
  const signature = value as { uri?: string } | null;
  const hasSignature = signature?.uri;

  return (
    <View style={styles.container}>
      {hasSignature ? (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: signature.uri }}
            style={styles.preview}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.resignButton}
            onPress={onCapture}
          >
            <Text style={styles.resignButtonText}>Re-sign</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.captureButton, error && styles.captureButtonError]}
          onPress={onCapture}
          testID="field-signature-capture"
        >
          <Text style={styles.penIcon}>✍️</Text>
          <Text style={styles.captureButtonText}>Tap to Sign</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 100,
  },
  captureButton: {
    backgroundColor: UI.COLORS.surface,
    borderWidth: 2,
    borderColor: UI.COLORS.border,
    borderStyle: 'dashed',
    borderRadius: UI.BORDER_RADIUS.md,
    padding: UI.SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  captureButtonError: {
    borderColor: UI.COLORS.error,
  },
  penIcon: {
    fontSize: 28,
    marginBottom: UI.SPACING.sm,
  },
  captureButtonText: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.primary,
    fontWeight: '500',
  },
  previewContainer: {
    position: 'relative',
    backgroundColor: UI.COLORS.surface,
    borderWidth: 1,
    borderColor: UI.COLORS.border,
    borderRadius: UI.BORDER_RADIUS.md,
    padding: UI.SPACING.sm,
  },
  preview: {
    width: '100%',
    height: 100,
    backgroundColor: '#fff',
  },
  resignButton: {
    position: 'absolute',
    top: UI.SPACING.sm,
    right: UI.SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: UI.SPACING.md,
    paddingVertical: UI.SPACING.xs,
    borderRadius: UI.BORDER_RADIUS.sm,
  },
  resignButtonText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.xs,
    fontWeight: '500',
  },
});

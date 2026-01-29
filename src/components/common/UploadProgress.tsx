import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UI } from '../../constants';

interface UploadProgressProps {
  progress: number; // 0-100
  fileName?: string;
  status?: 'uploading' | 'processing' | 'complete' | 'error';
  errorMessage?: string;
}

export default function UploadProgress({
  progress,
  fileName,
  status = 'uploading',
  errorMessage,
}: UploadProgressProps): React.JSX.Element {
  const getStatusText = (): string => {
    switch (status) {
      case 'uploading':
        return `Uploading... ${Math.round(progress)}%`;
      case 'processing':
        return 'Processing...';
      case 'complete':
        return 'Upload complete';
      case 'error':
        return errorMessage || 'Upload failed';
      default:
        return '';
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'complete':
        return UI.COLORS.success;
      case 'error':
        return UI.COLORS.error;
      default:
        return UI.COLORS.primary;
    }
  };

  return (
    <View style={styles.container}>
      {fileName && (
        <Text style={styles.fileName} numberOfLines={1}>
          {fileName}
        </Text>
      )}

      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: getStatusColor(),
              },
            ]}
          />
        </View>
      </View>

      <Text style={[styles.statusText, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: UI.SPACING.md,
    backgroundColor: UI.COLORS.surface,
    borderRadius: UI.BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: UI.COLORS.border,
  },
  fileName: {
    fontSize: UI.FONT_SIZE.sm,
    color: UI.COLORS.text,
    marginBottom: UI.SPACING.sm,
  },
  progressContainer: {
    marginBottom: UI.SPACING.xs,
  },
  progressBackground: {
    height: 6,
    backgroundColor: UI.COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusText: {
    fontSize: UI.FONT_SIZE.xs,
    fontWeight: '500',
  },
});

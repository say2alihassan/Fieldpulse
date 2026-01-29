import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { UI } from '../../../constants';
import { usePhotoUploadStore, PhotoUploadItem } from '../../../store/photoUploadStore';
import type { FieldDefinition } from '../../../types';

interface PhotoValue {
  uri: string;
  localPath?: string;
  capturedAt?: string;
}

interface PhotoFieldProps {
  field: FieldDefinition;
  value: unknown;
  error: string | null;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  onCapture?: () => void;
}

const DEFAULT_MAX_PHOTOS = 5;

export default function PhotoField({
  field,
  value,
  error,
  onChange,
  onBlur: _onBlur,
  onCapture,
}: PhotoFieldProps): React.JSX.Element {
  const maxPhotos = field.maxPhotos ?? DEFAULT_MAX_PHOTOS;

  // Support both single photo (legacy) and multiple photos
  const photos: PhotoValue[] = Array.isArray(value)
    ? (value as PhotoValue[])
    : value && typeof value === 'object' && 'uri' in (value as object)
    ? [value as PhotoValue]
    : [];

  const canAddMore = photos.length < maxPhotos;

  // Get upload status for photos in this field
  // Select the entire queue to avoid creating new arrays in selector (causes infinite loop)
  const queue = usePhotoUploadStore((state) => state.queue);
  const retryUpload = usePhotoUploadStore((state) => state.retryUpload);

  // Filter queue for this field using useMemo to maintain referential equality
  const uploadQueue = useMemo(
    () => queue.filter((item) => item.fieldId === field.id),
    [queue, field.id]
  );

  const handleRemovePhoto = (index: number): void => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);
  };

  // Get upload status for a photo by matching local path
  const getUploadStatus = (photo: PhotoValue): PhotoUploadItem | undefined => {
    if (!photo.localPath) return undefined;
    return uploadQueue.find((item) => item.localPath === photo.localPath);
  };

  return (
    <View style={styles.container}>
      {photos.length > 0 ? (
        <View style={styles.photosContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photosScrollContent}
          >
            {photos.map((photo, index) => {
              const uploadStatus = getUploadStatus(photo);

              return (
                <View key={`photo-${index}`} style={styles.photoWrapper}>
                  <Image source={{ uri: photo.uri }} style={styles.photoPreview} />

                  {/* Upload progress overlay */}
                  {uploadStatus && uploadStatus.status !== 'complete' && (
                    <View style={styles.uploadOverlay}>
                      {uploadStatus.status === 'uploading' && (
                        <>
                          <View style={styles.progressBarContainer}>
                            <View
                              style={[
                                styles.progressBar,
                                { width: `${uploadStatus.progress}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.uploadText}>
                            {Math.round(uploadStatus.progress)}%
                          </Text>
                        </>
                      )}
                      {uploadStatus.status === 'pending' && (
                        <Text style={styles.uploadText}>Queued</Text>
                      )}
                      {uploadStatus.status === 'error' && (
                        <TouchableOpacity
                          style={styles.retryButton}
                          onPress={() => retryUpload(uploadStatus.id)}
                        >
                          <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Upload complete indicator */}
                  {uploadStatus?.status === 'complete' && (
                    <View style={styles.uploadedBadge}>
                      <Text style={styles.uploadedBadgeText}>✓</Text>
                    </View>
                  )}

                  {/* Remove button */}
                  <View style={styles.photoOverlay}>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.photoIndex}>{index + 1}</Text>
                </View>
              );
            })}

            {/* Add more button */}
            {canAddMore && (
              <TouchableOpacity
                style={styles.addMoreButton}
                onPress={onCapture}
              >
                <Text style={styles.addMoreIcon}>+</Text>
                <Text style={styles.addMoreText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Photo count indicator */}
          <Text style={styles.photoCount}>
            {photos.length} / {maxPhotos} photos
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.captureButton, error && styles.captureButtonError]}
          onPress={onCapture}
        >
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.captureButtonText}>Take Photo</Text>
          {maxPhotos > 1 && (
            <Text style={styles.captureHint}>Up to {maxPhotos} photos</Text>
          )}
        </TouchableOpacity>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 120,
  },
  photosContainer: {
    gap: UI.SPACING.sm,
  },
  photosScrollContent: {
    gap: UI.SPACING.sm,
    paddingRight: UI.SPACING.sm,
  },
  photoWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: UI.BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: UI.COLORS.background,
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: UI.SPACING.xs,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: UI.COLORS.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  photoIndex: {
    position: 'absolute',
    bottom: UI.SPACING.xs,
    left: UI.SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.xs,
    paddingHorizontal: UI.SPACING.xs,
    paddingVertical: 2,
    borderRadius: UI.BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  uploadOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: UI.SPACING.xs,
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: UI.COLORS.primary,
  },
  uploadText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.xs,
  },
  retryButton: {
    backgroundColor: UI.COLORS.error,
    paddingHorizontal: UI.SPACING.sm,
    paddingVertical: 2,
    borderRadius: UI.BORDER_RADIUS.sm,
  },
  retryText: {
    color: UI.COLORS.textLight,
    fontSize: UI.FONT_SIZE.xs,
    fontWeight: '600',
  },
  uploadedBadge: {
    position: 'absolute',
    bottom: UI.SPACING.xs,
    right: UI.SPACING.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: UI.COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedBadgeText: {
    color: UI.COLORS.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  addMoreButton: {
    width: 120,
    height: 120,
    borderRadius: UI.BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: UI.COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UI.COLORS.surface,
  },
  addMoreIcon: {
    fontSize: 32,
    color: UI.COLORS.primary,
    marginBottom: UI.SPACING.xs,
  },
  addMoreText: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.primary,
    fontWeight: '500',
  },
  photoCount: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.textSecondary,
    textAlign: 'center',
    marginTop: UI.SPACING.xs,
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
    minHeight: 120,
  },
  captureButtonError: {
    borderColor: UI.COLORS.error,
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: UI.SPACING.sm,
  },
  captureButtonText: {
    fontSize: UI.FONT_SIZE.md,
    color: UI.COLORS.primary,
    fontWeight: '500',
  },
  captureHint: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.textSecondary,
    marginTop: UI.SPACING.xs,
  },
  errorText: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.error,
    marginTop: UI.SPACING.xs,
  },
});

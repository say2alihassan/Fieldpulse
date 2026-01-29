import { Image as ImageCompressor } from 'react-native-compressor';
import ImageMarker, { Position, TextBackgroundType, ImageFormat } from 'react-native-image-marker';
import { format } from 'date-fns';
import RNFS from 'react-native-fs';
import { PHOTO_CONFIG, DATE_FORMATS } from '../constants';
import type { ProcessedPhoto } from '../types';

interface PhotoMetadata {
  latitude: number | null;
  longitude: number | null;
  timestamp: Date;
}

interface TimestampOverlayOptions {
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  position?: Position;
}

const DEFAULT_OVERLAY_OPTIONS: TimestampOverlayOptions = {
  fontSize: 24,
  fontColor: '#FFFFFF',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  position: Position.bottomLeft,
};

/**
 * Burns timestamp and GPS coordinates onto the image
 */
async function burnTimestampOverlay(
  uri: string,
  metadata: PhotoMetadata,
  options: TimestampOverlayOptions = {}
): Promise<string> {
  const mergedOptions = { ...DEFAULT_OVERLAY_OPTIONS, ...options };

  // Format timestamp text
  const timestampText = format(metadata.timestamp, DATE_FORMATS.TIMESTAMP_OVERLAY);

  // Build overlay text with optional GPS coordinates
  let overlayText = timestampText;
  if (metadata.latitude !== null && metadata.longitude !== null) {
    const latDir = metadata.latitude >= 0 ? 'N' : 'S';
    const lonDir = metadata.longitude >= 0 ? 'E' : 'W';
    const lat = Math.abs(metadata.latitude).toFixed(6);
    const lon = Math.abs(metadata.longitude).toFixed(6);
    overlayText += `\n${lat}°${latDir}, ${lon}°${lonDir}`;
  }

  // Burn the timestamp onto the image
  const markedUri = await ImageMarker.markText({
    backgroundImage: {
      src: uri,
    },
    watermarkTexts: [
      {
        text: overlayText,
        position: {
          position: mergedOptions.position,
        },
        style: {
          color: mergedOptions.fontColor!,
          fontSize: mergedOptions.fontSize!,
          fontName: 'Arial',
          textBackgroundStyle: {
            type: TextBackgroundType.stretchX,
            color: mergedOptions.backgroundColor!,
            paddingX: 10,
            paddingY: 8,
          },
        },
      },
    ],
    quality: 100,
    saveFormat: ImageFormat.png,
  });

  return markedUri;
}

export async function processPhoto(
  uri: string,
  metadata: PhotoMetadata
): Promise<ProcessedPhoto> {
  // Step 1: Compress and resize the image first using react-native-compressor
  const compressedUri = await ImageCompressor.compress(uri, {
    compressionMethod: 'manual',
    maxWidth: PHOTO_CONFIG.MAX_WIDTH,
    maxHeight: PHOTO_CONFIG.MAX_HEIGHT,
    quality: PHOTO_CONFIG.QUALITY,
    input: 'uri',
    // output: 'uri',
  });

  // Step 2: Burn timestamp and GPS coordinates onto the image
  const markedUri = await burnTimestampOverlay(compressedUri, metadata);

  // Step 3: Final compression after adding overlay
  const finalUri = await ImageCompressor.compress(markedUri, {
    compressionMethod: 'manual',
    maxWidth: PHOTO_CONFIG.MAX_WIDTH,
    maxHeight: PHOTO_CONFIG.MAX_HEIGHT,
    quality: PHOTO_CONFIG.QUALITY,
    input: 'uri',
    // output: 'uri',
  });

  // Get file stats and dimensions
  const stats = await RNFS.stat(finalUri.replace('file://', ''));

  // Get image dimensions using Image.getSize would require react-native Image
  // For now, use the configured max dimensions as estimate
  const width = PHOTO_CONFIG.MAX_WIDTH;
  const height = PHOTO_CONFIG.MAX_HEIGHT;

  // Move to a permanent location
  const fileName = `photo_${Date.now()}.jpg`;
  const destPath = `${RNFS.DocumentDirectoryPath}/photos/${fileName}`;

  // Ensure directory exists
  await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/photos`);

  // Copy file
  await RNFS.copyFile(finalUri.replace('file://', ''), destPath);

  // Clean up temp files
  try {
    if (compressedUri !== uri) {
      await RNFS.unlink(compressedUri.replace('file://', ''));
    }
    await RNFS.unlink(markedUri.replace('file://', ''));
    if (finalUri !== markedUri) {
      await RNFS.unlink(finalUri.replace('file://', ''));
    }
  } catch {
    // Temp files might be auto-cleaned
  }

  return {
    uri: `file://${destPath}`,
    localPath: destPath,
    latitude: metadata.latitude,
    longitude: metadata.longitude,
    capturedAt: metadata.timestamp.toISOString(),
    width,
    height,
    sizeBytes: typeof stats.size === 'number' ? stats.size : parseInt(String(stats.size), 10),
  };
}

export async function deleteLocalPhoto(localPath: string): Promise<void> {
  try {
    await RNFS.unlink(localPath);
  } catch {
    // File might not exist, ignore
  }
}

export async function cleanupOldPhotos(daysOld = 30): Promise<number> {
  const photosDir = `${RNFS.DocumentDirectoryPath}/photos`;
  const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  try {
    const files = await RNFS.readDir(photosDir);

    for (const file of files) {
      if (file.mtime && new Date(file.mtime).getTime() < cutoff) {
        await RNFS.unlink(file.path);
        deletedCount++;
      }
    }
  } catch {
    // Directory might not exist
  }

  return deletedCount;
}

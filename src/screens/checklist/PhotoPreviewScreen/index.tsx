import React, { useState, useCallback } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useChecklistStore } from '../../../store/checklistStore';
import { usePhotoUploadStore } from '../../../store/photoUploadStore';
import { processPhoto } from '../../../utils/photoProcessor';
import { UI } from '../../../constants';
import type { JobsStackParamList } from '../../../types';
import { styles } from './styles';

interface PhotoItem {
  uri: string;
  localPath: string;
  latitude: number | null;
  longitude: number | null;
  capturedAt: string;
  width: number;
  height: number;
}

type RouteProps = RouteProp<JobsStackParamList, 'PhotoPreview'>;
type NavigationProp = NativeStackNavigationProp<JobsStackParamList, 'PhotoPreview'>;

export default function PhotoPreviewScreen(): React.JSX.Element {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId, fieldId, photoUri, latitude, longitude, maxPhotos = 5 } = route.params;

  const [isProcessing, setIsProcessing] = useState(false);
  const { responses, updateField } = useChecklistStore();
  const { queuePhoto } = usePhotoUploadStore();

  const existingPhotos = (responses[fieldId] as PhotoItem[] | null) || [];

  const handleUsePhoto = useCallback(async () => {
    setIsProcessing(true);

    try {
      const processed = await processPhoto(photoUri, {
        latitude,
        longitude,
        timestamp: new Date(),
      });

      const newPhoto: PhotoItem = {
        uri: processed.uri,
        localPath: processed.localPath,
        latitude: processed.latitude,
        longitude: processed.longitude,
        capturedAt: processed.capturedAt,
        width: processed.width,
        height: processed.height,
      };

      updateField(fieldId, [...existingPhotos, newPhoto]);

      queuePhoto({
        jobId,
        fieldId,
        localPath: processed.localPath,
        uri: processed.uri,
        latitude: processed.latitude,
        longitude: processed.longitude,
        capturedAt: processed.capturedAt,
        width: processed.width,
        height: processed.height,
        sizeBytes: processed.sizeBytes,
      });

      navigation.pop(2);
    } catch (error) {
      console.error('Photo processing failed:', error);
      setIsProcessing(false);
    }
  }, [
    photoUri,
    latitude,
    longitude,
    fieldId,
    jobId,
    existingPhotos,
    updateField,
    queuePhoto,
    navigation,
  ]);

  const handleRetake = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleCancel = useCallback(() => {
    navigation.pop(2);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: photoUri }}
        style={styles.preview}
        resizeMode="contain"
      />

      <SafeAreaView style={styles.infoOverlay}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Photo {existingPhotos.length + 1} of {maxPhotos}
          </Text>
          {latitude !== null && longitude !== null && (
            <Text style={styles.gpsText}>
              GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          )}
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.controls} edges={['bottom']}>
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={UI.COLORS.textLight} />
            <Text style={styles.processingText}>Processing photo...</Text>
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.retakeButton]}
              onPress={handleRetake}
            >
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.useButton]}
              onPress={handleUsePhoto}
            >
              <Text style={styles.useButtonText}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
